using HuellasVitalesAPI.Backend.Models.DTOs;
using HuellasVitalesAPI.Backend.Models.Entidades;
using HuellitasVitalesAPI.Data;
using Microsoft.EntityFrameworkCore;

namespace HuellitasVitalesAPI.Services
{
    public class ComercioFuncionarioService
    {
        private const byte ROL_ADMINISTRADOR = 1;
        private const byte ROL_FUNCIONARIO = 4;

        private readonly ConexionDB _context;
        private readonly ComercioValidacionService _validacion;
        private readonly ILogger<ComercioFuncionarioService> _logger;

        public ComercioFuncionarioService(
            ConexionDB context,
            ComercioValidacionService validacion,
            ILogger<ComercioFuncionarioService> logger)
        {
            _context = context;
            _validacion = validacion;
            _logger = logger;
        }

        // ─── LISTAR EMPLEADOS DE UN COMERCIO ───
        public async Task<(bool Exito, string Mensaje, int Codigo, List<FuncionarioDTO> Funcionarios)> ListarPorComercioAsync(
            int idUsuario, int idComercio, bool esAdmin)
        {
            var validacion = await _validacion.ValidarPropietarioComercioAsync(idUsuario, idComercio, esAdmin);
            if (!validacion.Exito)
                return (false, validacion.Mensaje, validacion.Codigo, new List<FuncionarioDTO>());

            var funcionarios = await (
                from f in _context.ComerciosFuncionarios
                where f.IdComercio == idComercio
                join u in _context.Usuarios on f.IdUsuario equals u.IdUsuario
                join c in _context.CargosCat on f.IdCargo equals c.IdCargo
                orderby f.FechaIngreso descending
                select new FuncionarioDTO
                {
                    IdComercioFuncionario = f.IdComercioFuncionario,
                    IdUsuario = u.IdUsuario,
                    Nombre = u.Nombre,
                    Apellidos = u.Apellidos,
                    Correo = u.Correo,
                    IdCargo = f.IdCargo,
                    Cargo = c.Nombre,
                    Activo = f.Activo,
                    FechaIngreso = f.FechaIngreso
                }
            ).ToListAsync();

            return (true, "OK", 200, funcionarios);
        }

        // ─── BUSCAR UN USUARIO EXISTENTE POR CORREO (para vincularlo) ───
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

        // ─── VINCULAR UN USUARIO EXISTENTE COMO EMPLEADO DEL COMERCIO ───
        public async Task<(bool Exito, string Mensaje, int Codigo)> VincularAsync(
            int idUsuarioSolicitante, VincularFuncionarioRequest request, bool esAdmin)
        {
            try
            {
                var validacion = await _validacion.ValidarPropietarioComercioAsync(idUsuarioSolicitante, request.IdComercio, esAdmin);
                if (!validacion.Exito)
                    return (false, validacion.Mensaje, validacion.Codigo);

                var normalizado = request.Correo.Trim().ToLower();
                var usuario = await _context.Usuarios.FirstOrDefaultAsync(u => u.Correo.ToLower() == normalizado);
                if (usuario == null)
                    return (false, "No existe ningún usuario registrado con ese correo. Pídele que se registre primero.", 404);

                // No se puede vincular como empleado a alguien que ya es Administrador o
                // Funcionario (de este u otro comercio) — evita mezclar roles administrativos
                // con un cargo de empleado.
                if (usuario.IdRol == ROL_ADMINISTRADOR || usuario.IdRol == ROL_FUNCIONARIO)
                    return (false, "No se puede vincular como empleado a un usuario que ya tiene rol de Administrador o Funcionario.", 400);

                var cargoExiste = await _context.CargosCat.AnyAsync(c => c.IdCargo == request.IdCargo);
                if (!cargoExiste)
                    return (false, "El cargo indicado no es válido.", 400);

                var yaVinculado = await _context.ComerciosFuncionarios.AnyAsync(
                    f => f.IdComercio == request.IdComercio && f.IdUsuario == usuario.IdUsuario);
                if (yaVinculado)
                    return (false, "Este usuario ya está vinculado a este comercio.", 409);

                var funcionario = new ComercioFuncionario
                {
                    IdComercio = request.IdComercio,
                    IdUsuario = usuario.IdUsuario,
                    IdCargo = request.IdCargo,
                    Activo = true,
                    FechaIngreso = DateTime.UtcNow
                };

                _context.ComerciosFuncionarios.Add(funcionario);
                await _context.SaveChangesAsync();

                _logger.LogInformation(
                    "Usuario {Usuario} vinculado como funcionario del comercio {Comercio} por {Solicitante}",
                    usuario.IdUsuario, request.IdComercio, idUsuarioSolicitante);

                return (true, "Empleado vinculado con éxito.", 201);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al vincular funcionario al comercio {Comercio}", request.IdComercio);
                return (false, "Ocurrió un error interno al vincular el empleado.", 500);
            }
        }

        // ─── ACTIVAR / DESACTIVAR UN EMPLEADO ───
        public async Task<(bool Exito, string Mensaje, int Codigo)> CambiarEstadoAsync(
            int idUsuarioSolicitante, int idComercioFuncionario, bool activo, bool esAdmin)
        {
            try
            {
                var funcionario = await _context.ComerciosFuncionarios
                    .FirstOrDefaultAsync(f => f.IdComercioFuncionario == idComercioFuncionario);

                if (funcionario == null)
                    return (false, "El registro de empleado indicado no existe.", 404);

                var validacion = await _validacion.ValidarPropietarioComercioAsync(idUsuarioSolicitante, funcionario.IdComercio, esAdmin);
                if (!validacion.Exito)
                    return (false, validacion.Mensaje, validacion.Codigo);

                funcionario.Activo = activo;
                await _context.SaveChangesAsync();

                return (true, activo ? "Empleado reactivado." : "Empleado desactivado.", 200);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al cambiar estado del funcionario {Id}", idComercioFuncionario);
                return (false, "Ocurrió un error interno al actualizar el empleado.", 500);
            }
        }
    }
}