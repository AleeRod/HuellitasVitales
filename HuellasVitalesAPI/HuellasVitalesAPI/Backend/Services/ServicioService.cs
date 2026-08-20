using HuellasVitalesAPI.Backend.Models.DTOs;
using HuellasVitalesAPI.Backend.Models.Entidades;
using HuellitasVitalesAPI.Data;
using Microsoft.EntityFrameworkCore;

namespace HuellitasVitalesAPI.Services
{
    public class ServicioService
    {
        private readonly ConexionDB _context;
        private readonly ComercioValidacionService _validacion;
        private readonly ILogger<ServicioService> _logger;

        public ServicioService(
            ConexionDB context,
            ComercioValidacionService validacion,
            ILogger<ServicioService> logger)
        {
            _context = context;
            _validacion = validacion;
            _logger = logger;
        }

        // ─── REGISTRAR UN SERVICIO EN UNA CLÍNICA VETERINARIA ───
        // AÑADIDO: bool esAdmin en los parámetros
        public async Task<(bool Exito, string Mensaje, int Codigo, int IdServicio)> CrearAsync(
            int idUsuario, CrearServicioRequest request, bool esAdmin)
        {
            try
            {
                // AÑADIDO: pasamos esAdmin al validador
                var validacion = await _validacion.ValidarComercioHabilitadoAsync(
                    idUsuario, request.IdComercio, ComercioValidacionService.TIPO_COMERCIO_VETERINARIA, esAdmin);

                if (!validacion.Exito)
                    return (false, validacion.Mensaje, validacion.Codigo, 0);

                // El veterinario asignado debe trabajar en ESTA veterinaria (mismo IdComercio),
                // para que al agendar una cita ya se sepa con certeza quién atiende.
                var veterinarioValido = await _context.Veterinarios.AnyAsync(
                    v => v.IdVeterinario == request.IdVeterinario && v.IdComercio == request.IdComercio);
                if (!veterinarioValido)
                    return (false, "El veterinario seleccionado no pertenece a esta veterinaria.", 400, 0);

                var servicio = new Servicio
                {
                    IdComercio = request.IdComercio,
                    Nombre = request.Nombre.Trim(),
                    Descripcion = string.IsNullOrWhiteSpace(request.Descripcion) ? null : request.Descripcion.Trim(),
                    DuracionMinutos = request.DuracionMinutos,
                    Precio = request.Precio,
                    IdTipoServicio = request.IdTipoServicio,
                    IdVeterinario = request.IdVeterinario,
                    Activo = true
                };

                _context.Servicios.Add(servicio);
                await _context.SaveChangesAsync();

                _logger.LogInformation(
                    "Servicio {Servicio} creado en el comercio {Comercio} por el usuario {Usuario}.",
                    servicio.IdServicio, request.IdComercio, idUsuario);

                return (true, "Servicio registrado con éxito.", 201, servicio.IdServicio);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al crear el servicio en el comercio {Comercio}", request.IdComercio);
                return (false, "Ocurrió un error interno al registrar el servicio.", 500, 0);
            }
        }

        // ─── EDITAR UN SERVICIO EXISTENTE ───
        // Nota: a diferencia de ProductoService.EditarProductoAsync, no filtramos por Activo
        // al buscar el servicio: así el checkbox "Servicio activo" del modal de edición
        // también puede reactivar un servicio previamente desactivado.
        public async Task<(bool Exito, string Mensaje, int Codigo, Servicio? Servicio)> EditarAsync(
            int idUsuario, int idServicio, EditarServicioRequest request, bool esAdmin)
        {
            try
            {
                var servicio = await _context.Servicios.FirstOrDefaultAsync(s => s.IdServicio == idServicio);
                if (servicio == null)
                    return (false, "El servicio indicado no existe.", 404, null);

                var validacion = await _validacion.ValidarPropietarioComercioAsync(idUsuario, servicio.IdComercio, esAdmin);
                if (!validacion.Exito)
                    return (false, validacion.Mensaje, validacion.Codigo, null);

                if (!await _context.TipoServicioCat.AnyAsync(t => t.IdTipoServicio == request.IdTipoServicio))
                    return (false, "El tipo de servicio indicado no es válido.", 400, null);

                // El veterinario asignado debe trabajar en la MISMA veterinaria que el servicio
                // (servicio.IdComercio no se reasigna vía edición, ver EditarServicioRequest).
                var veterinarioValido = await _context.Veterinarios.AnyAsync(
                    v => v.IdVeterinario == request.IdVeterinario && v.IdComercio == servicio.IdComercio);
                if (!veterinarioValido)
                    return (false, "El veterinario seleccionado no pertenece a esta veterinaria.", 400, null);

                servicio.Nombre = request.Nombre.Trim();
                servicio.Descripcion = string.IsNullOrWhiteSpace(request.Descripcion) ? null : request.Descripcion.Trim();
                servicio.DuracionMinutos = request.DuracionMinutos;
                servicio.Precio = request.Precio;
                servicio.IdTipoServicio = request.IdTipoServicio;
                servicio.IdVeterinario = request.IdVeterinario;
                servicio.Activo = request.Activo;

                await _context.SaveChangesAsync();

                _logger.LogInformation("Servicio {Servicio} editado por el usuario {Usuario}.", idServicio, idUsuario);

                return (true, "Servicio actualizado correctamente.", 200, servicio);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al editar el servicio {Servicio}", idServicio);
                return (false, "Ocurrió un error interno al actualizar el servicio.", 500, null);
            }
        }

        // ─── DESACTIVAR UN SERVICIO (BORRADO LÓGICO) ───
        // El sistema nunca borra filas físicamente, así que "eliminar" siempre es desactivar:
        // el criterio de negocio "no eliminar un servicio con citas activas" se cumple por
        // diseño, ya que la operación jamás destruye datos ni rompe citas existentes.
        public async Task<(bool Exito, string Mensaje, int Codigo)> EliminarAsync(int idUsuario, int idServicio, bool esAdmin)
        {
            try
            {
                var servicio = await _context.Servicios.FirstOrDefaultAsync(s => s.IdServicio == idServicio);
                if (servicio == null)
                    return (false, "El servicio indicado no existe.", 404);

                var validacion = await _validacion.ValidarPropietarioComercioAsync(idUsuario, servicio.IdComercio, esAdmin);
                if (!validacion.Exito)
                    return (false, validacion.Mensaje, validacion.Codigo);

                servicio.Activo = false;
                await _context.SaveChangesAsync();

                return (true, "Servicio desactivado correctamente.", 200);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al desactivar el servicio {Servicio}", idServicio);
                return (false, "Ocurrió un error interno al desactivar el servicio.", 500);
            }
        }

        // ─── OBTENER UN SERVICIO POR ID ───
        public async Task<(bool Exito, string Mensaje, int Codigo, Servicio? Servicio)> ObtenerPorIdAsync(int idServicio)
        {
            var servicio = await _context.Servicios.FirstOrDefaultAsync(s => s.IdServicio == idServicio);
            if (servicio == null)
                return (false, "Servicio no encontrado.", 404, null);

            return (true, "Servicio obtenido correctamente.", 200, servicio);
        }

        // ─── LISTAR TODOS LOS SERVICIOS (ACTIVOS E INACTIVOS) DE UN COMERCIO ───
        // A diferencia de ObtenerProductosPorComercioAsync, no filtramos por Activo: la HU
        // pide ver "el listado de todos los servicios registrados" para poder reactivarlos.
        public async Task<(bool Exito, string Mensaje, int Codigo, object? Servicios)> ObtenerPorComercioAsync(int idComercio)
        {
            var comercioExiste = await _context.Comercios.AnyAsync(c => c.IdComercio == idComercio);
            if (!comercioExiste)
                return (false, "El comercio indicado no existe.", 404, null);

            var servicios = await (
                from s in _context.Servicios
                where s.IdComercio == idComercio
                join t in _context.TipoServicioCat on (int)s.IdTipoServicio equals (int)t.IdTipoServicio
                join v in _context.Veterinarios on s.IdVeterinario equals v.IdVeterinario into vGroup
                from v in vGroup.DefaultIfEmpty()
                join u in _context.Usuarios on v.IdUsuario equals u.IdUsuario into uGroup
                from u in uGroup.DefaultIfEmpty()
                orderby s.IdServicio descending
                select new
                {
                    s.IdServicio,
                    s.IdComercio,
                    s.Nombre,
                    s.Descripcion,
                    s.DuracionMinutos,
                    s.Precio,
                    s.Activo,
                    s.IdTipoServicio,
                    NombreTipoServicio = t.Nombre,
                    s.IdVeterinario,
                    NombreVeterinario = u != null ? (u.Nombre + " " + u.Apellidos).Trim() : null
                }
            ).ToListAsync();

            return (true, "Servicios obtenidos correctamente.", 200, servicios);
        }

        // ─── LISTADO GLOBAL DE SERVICIOS (VISTA ADMIN) ───
        public async Task<object> ObtenerTodosGlobalAsync()
        {
            return await (
                from s in _context.Servicios
                join c in _context.Comercios on s.IdComercio equals c.IdComercio
                join t in _context.TipoServicioCat on (int)s.IdTipoServicio equals (int)t.IdTipoServicio
                join v in _context.Veterinarios on s.IdVeterinario equals v.IdVeterinario into vGroup
                from v in vGroup.DefaultIfEmpty()
                join u in _context.Usuarios on v.IdUsuario equals u.IdUsuario into uGroup
                from u in uGroup.DefaultIfEmpty()
                orderby s.IdServicio descending
                select new
                {
                    s.IdServicio,
                    s.IdComercio,
                    NombreComercio = c.NombreComercial,
                    s.Nombre,
                    s.Descripcion,
                    s.DuracionMinutos,
                    s.Precio,
                    s.Activo,
                    s.IdTipoServicio,
                    NombreTipoServicio = t.Nombre,
                    s.IdVeterinario,
                    NombreVeterinario = u != null ? (u.Nombre + " " + u.Apellidos).Trim() : null
                }
            ).ToListAsync();
        }

        // ─── VETERINARIAS DEL USUARIO AUTENTICADO (para el selector "mi veterinaria") ───
        // Espejo exacto de ProductoService.ObtenerAlmacenesDelUsuarioAsync, cambiando
        // TIPO_COMERCIO_ALMACEN por TIPO_COMERCIO_VETERINARIA.
        public async Task<object> ObtenerVeterinariasDelUsuarioAsync(int idUsuario)
        {
            return await (from c in _context.Comercios
                        join p in _context.PersonasLegales on c.IdPersonaLegal equals p.IdPersonaLegal
                        where p.IdUsuario == idUsuario
                                && c.IdTipoComercio == ComercioValidacionService.TIPO_COMERCIO_VETERINARIA
                                && c.IdEstadoSolicitud == 2 // aprobado
                        select new { idComercio = c.IdComercio, nombreComercial = c.NombreComercial })
                        .ToListAsync();
        }

        // ─── VETERINARIAS APROBADAS (para el selector del admin) ───
        public async Task<object> ObtenerVeterinariasAprobadasAsync()
        {
            return await _context.Comercios
                .Where(c => c.IdTipoComercio == ComercioValidacionService.TIPO_COMERCIO_VETERINARIA
                         && c.IdEstadoSolicitud == 2)
                .Select(c => new { idComercio = c.IdComercio, nombreComercial = c.NombreComercial })
                .ToListAsync();
        }

        // ─── VETERINARIOS QUE TRABAJAN EN UN COMERCIO (para el selector al crear un servicio) ───
        // Solo devuelve veterinarios cuyo IdComercio coincide: no tiene sentido ofrecer, al
        // crear un servicio de la Veterinaria A, un veterinario que ejerce en la Veterinaria B.
        public async Task<object> ObtenerVeterinariosPorComercioAsync(int idComercio)
        {
            return await (
                from v in _context.Veterinarios
                join u in _context.Usuarios on v.IdUsuario equals u.IdUsuario
                where v.IdComercio == idComercio
                orderby u.Nombre
                select new
                {
                    idVeterinario = v.IdVeterinario,
                    nombre = (u.Nombre + " " + u.Apellidos).Trim(),
                    especialidad = v.Especialidad
                }
            ).ToListAsync();
        }
    }
}