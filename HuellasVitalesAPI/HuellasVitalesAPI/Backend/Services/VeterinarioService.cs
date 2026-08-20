using HuellasVitalesAPI.Backend.Models.DTOs;
using HuellasVitalesAPI.Backend.Models.Entidades;
using HuellitasVitalesAPI.Data;
using Microsoft.EntityFrameworkCore;

namespace HuellitasVitalesAPI.Services
{
    /// <summary>
    /// Gestiona qué veterinarios ejercen en cada veterinaria (COMERCIO de tipo Clínica
    /// Veterinaria). Reutiliza ComercioValidacionService.ValidarPropietarioComercioAsync para
    /// que un Admin pueda vincular veterinarios a cualquier veterinaria afiliada, mientras que
    /// un Funcionario solo puede hacerlo en la veterinaria que le pertenece (mismo mecanismo
    /// ya usado por ProductoService/ServicioService/ComercioFuncionarioService).
    /// </summary>
    public class VeterinarioService
    {
        private const byte ROL_CLIENTE = 3;
        private const byte ROL_VETERINARIO = 2;

        private readonly ConexionDB _context;
        private readonly ComercioValidacionService _validacion;
        private readonly ILogger<VeterinarioService> _logger;

        public VeterinarioService(
            ConexionDB context,
            ComercioValidacionService validacion,
            ILogger<VeterinarioService> logger)
        {
            _context = context;
            _validacion = validacion;
            _logger = logger;
        }

        // ─── BUSCAR UN USUARIO EXISTENTE POR CORREO (para vincularlo como veterinario) ───
        public async Task<(bool Exito, string Mensaje, int Codigo, UsuarioBusquedaDTO? Usuario)> BuscarUsuarioPorCorreoAsync(
            string correo)
        {
            var normalizado = correo.Trim().ToLower();

            var usuario = await _context.Usuarios
                .Where(u => u.Correo.ToLower() == normalizado)
                .Select(u => new UsuarioBusquedaDTO
                {
                    IdUsuario = u.IdUsuario,
                    Nombre = u.Nombre,
                    Apellidos = u.Apellidos,
                    Correo = u.Correo
                })
                .FirstOrDefaultAsync();

            if (usuario == null)
                return (false, "No existe ningún usuario registrado con ese correo.", 404, null);

            return (true, "Usuario encontrado.", 200, usuario);
        }

        // ─── LISTAR LOS VETERINARIOS DE UNA VETERINARIA ───
        public async Task<(bool Exito, string Mensaje, int Codigo, List<VeterinarioDTO> Veterinarios)> ListarPorComercioAsync(
            int idUsuario, int idComercio, bool esAdmin)
        {
            var validacion = await _validacion.ValidarPropietarioComercioAsync(idUsuario, idComercio, esAdmin);
            if (!validacion.Exito)
                return (false, validacion.Mensaje, validacion.Codigo, new List<VeterinarioDTO>());

            var veterinarios = await (
                from v in _context.Veterinarios
                where v.IdComercio == idComercio
                join u in _context.Usuarios on v.IdUsuario equals u.IdUsuario
                orderby u.Nombre
                select new VeterinarioDTO
                {
                    IdVeterinario = v.IdVeterinario,
                    IdUsuario = u.IdUsuario,
                    Nombre = u.Nombre,
                    Apellidos = u.Apellidos,
                    Correo = u.Correo,
                    Especialidad = v.Especialidad,
                    Descripcion = v.Descripcion
                }
            ).ToListAsync();

            return (true, "OK", 200, veterinarios);
        }

        // ─── VINCULAR (O RE-VINCULAR) UN USUARIO EXISTENTE COMO VETERINARIO DE LA VETERINARIA ───
        public async Task<(bool Exito, string Mensaje, int Codigo)> VincularAsync(
            int idUsuarioSolicitante, VincularVeterinarioRequest request, bool esAdmin)
        {
            try
            {
                var comercio = await _context.Comercios.FirstOrDefaultAsync(c => c.IdComercio == request.IdComercio);
                if (comercio == null)
                    return (false, "El comercio indicado no existe.", 404);

                if (comercio.IdTipoComercio != ComercioValidacionService.TIPO_COMERCIO_VETERINARIA)
                    return (false,
                        $"Solo se pueden agregar veterinarios a un comercio de tipo Clínica Veterinaria. " +
                        $"'{comercio.NombreComercial}' está registrado como otro tipo de comercio.", 400);

                var validacion = await _validacion.ValidarPropietarioComercioAsync(idUsuarioSolicitante, request.IdComercio, esAdmin);
                if (!validacion.Exito)
                    return (false, validacion.Mensaje, validacion.Codigo);

                var normalizado = request.Correo.Trim().ToLower();
                var usuario = await _context.Usuarios.FirstOrDefaultAsync(u => u.Correo.ToLower() == normalizado);
                if (usuario == null)
                    return (false, "No existe ningún usuario registrado con ese correo. Pídele que se registre primero.", 404);

                var veterinario = await _context.Veterinarios.FirstOrDefaultAsync(v => v.IdUsuario == usuario.IdUsuario);

                if (veterinario != null)
                {
                    if (veterinario.IdComercio.HasValue && veterinario.IdComercio.Value != request.IdComercio)
                        return (false, "Este usuario ya está registrado como veterinario en otra veterinaria.", 409);

                    veterinario.IdComercio = request.IdComercio;
                    if (!string.IsNullOrWhiteSpace(request.Especialidad))
                        veterinario.Especialidad = request.Especialidad.Trim();
                    if (!string.IsNullOrWhiteSpace(request.Descripcion))
                        veterinario.Descripcion = request.Descripcion.Trim();
                }
                else
                {
                    veterinario = new Veterinario
                    {
                        IdUsuario = usuario.IdUsuario,
                        IdComercio = request.IdComercio,
                        Especialidad = string.IsNullOrWhiteSpace(request.Especialidad) ? null : request.Especialidad.Trim(),
                        Descripcion = string.IsNullOrWhiteSpace(request.Descripcion) ? null : request.Descripcion.Trim()
                    };
                    _context.Veterinarios.Add(veterinario);
                }

                // Igual que ComercioService al aprobar un comercio: solo se promueve a un
                // Cliente puro. No se toca el rol de alguien que ya es Admin/Funcionario/etc.
                if (usuario.IdRol == ROL_CLIENTE)
                    usuario.IdRol = ROL_VETERINARIO;

                await _context.SaveChangesAsync();

                _logger.LogInformation(
                    "Usuario {Usuario} vinculado como veterinario del comercio {Comercio} por {Solicitante}",
                    usuario.IdUsuario, request.IdComercio, idUsuarioSolicitante);

                return (true, "Veterinario vinculado con éxito.", 201);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al vincular veterinario al comercio {Comercio}", request.IdComercio);
                return (false, "Ocurrió un error interno al vincular al veterinario.", 500);
            }
        }

        // ─── DESVINCULAR UN VETERINARIO DE LA VETERINARIA (no borra su historial de servicios/citas) ───
        public async Task<(bool Exito, string Mensaje, int Codigo)> DesvincularAsync(
            int idUsuarioSolicitante, int idVeterinario, bool esAdmin)
        {
            try
            {
                var veterinario = await _context.Veterinarios.FirstOrDefaultAsync(v => v.IdVeterinario == idVeterinario);
                if (veterinario == null)
                    return (false, "El veterinario indicado no existe.", 404);

                if (!veterinario.IdComercio.HasValue)
                    return (false, "Este veterinario no está vinculado a ninguna veterinaria.", 400);

                var validacion = await _validacion.ValidarPropietarioComercioAsync(idUsuarioSolicitante, veterinario.IdComercio.Value, esAdmin);
                if (!validacion.Exito)
                    return (false, validacion.Mensaje, validacion.Codigo);

                veterinario.IdComercio = null;
                await _context.SaveChangesAsync();

                return (true, "Veterinario desvinculado de la veterinaria.", 200);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al desvincular al veterinario {Id}", idVeterinario);
                return (false, "Ocurrió un error interno al desvincular al veterinario.", 500);
            }
        }
    }
}
