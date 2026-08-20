using HuellasVitalesAPI.Backend.Models.DTOs;
using HuellasVitalesAPI.Backend.Models.Entidades;
using HuellitasVitalesAPI.Data;
using Microsoft.EntityFrameworkCore;

namespace HuellitasVitalesAPI.Services
{
    /// <summary>
    /// CRUD del catálogo TIPO_SERVICIO_CAT (Consulta, Grooming, Procedimiento, ...) y del flujo
    /// de solicitudes con el que un Funcionario pide un tipo nuevo para que un Admin lo revise.
    /// Es un catálogo compartido por todas las veterinarias, no pertenece a un comercio.
    /// </summary>
    public class TipoServicioService
    {
        private const byte ROL_ADMIN = 1;
        private const byte ROL_FUNCIONARIO = 4;

        // ESTADO_SOLICITUD_CAT: mismo catálogo que ya usa COMERCIO (ver ComercioService).
        // No tiene entidad EF propia (documentado en CLAUDE.md), así que los nombres se
        // resuelven localmente, igual que ComercioValidacionService.NombreTipoComercio.
        private const short ESTADO_PENDIENTE = 1;
        private const short ESTADO_APROBADO = 2;
        private const short ESTADO_RECHAZADO = 3;

        private readonly ConexionDB _context;
        private readonly ComercioValidacionService _validacion;
        private readonly ILogger<TipoServicioService> _logger;

        public TipoServicioService(
            ConexionDB context,
            ComercioValidacionService validacion,
            ILogger<TipoServicioService> logger)
        {
            _context = context;
            _validacion = validacion;
            _logger = logger;
        }

        // ─── LISTAR TODOS LOS TIPOS DE SERVICIO ───
        public async Task<List<TipoServicioCat>> ListarAsync()
        {
            return await _context.TipoServicioCat
                .OrderBy(t => t.Nombre)
                .ToListAsync();
        }

        // ─── CREAR UN TIPO DE SERVICIO (SOLO ADMIN) ───
        // El funcionario ya no puede crear tipos directamente: debe enviar una solicitud
        // (ver SolicitarAsync) para que un administrador la apruebe o la rechace.
        public async Task<(bool Exito, string Mensaje, int Codigo, TipoServicioCat? Tipo)> CrearAsync(
            string nombre, byte rolUsuario)
        {
            try
            {
                if (rolUsuario != ROL_ADMIN)
                    return (false,
                        "Solo un administrador puede crear tipos de servicio directamente. " +
                        "Si sos funcionario, enviá una solicitud para que un administrador la revise.",
                        403, null);

                var nombreNormalizado = nombre.Trim();

                var yaExiste = await _context.TipoServicioCat
                    .AnyAsync(t => t.Nombre.ToLower() == nombreNormalizado.ToLower());
                if (yaExiste)
                    return (false, "Ya existe un tipo de servicio con ese nombre.", 409, null);

                var tipo = new TipoServicioCat
                {
                    Nombre = nombreNormalizado,
                    Activo = true
                };

                _context.TipoServicioCat.Add(tipo);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Tipo de servicio '{Nombre}' creado (Id {Id}).", tipo.Nombre, tipo.IdTipoServicio);

                return (true, "Tipo de servicio creado con éxito.", 201, tipo);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al crear el tipo de servicio '{Nombre}'.", nombre);
                return (false, "Ocurrió un error interno al crear el tipo de servicio.", 500, null);
            }
        }

        // ─── ACTIVAR / DESACTIVAR UN TIPO DE SERVICIO ───
        // Restringido a Admin: es un catálogo compartido y desactivarlo afecta a
        // servicios de otras veterinarias distintas de quien lo pida.
        public async Task<(bool Exito, string Mensaje, int Codigo)> CambiarEstadoAsync(int idTipoServicio, bool activo, bool esAdmin)
        {
            try
            {
                if (!esAdmin)
                    return (false, "Solo un administrador puede activar o desactivar tipos de servicio.", 403);

                var tipo = await _context.TipoServicioCat.FirstOrDefaultAsync(t => t.IdTipoServicio == idTipoServicio);
                if (tipo == null)
                    return (false, "El tipo de servicio indicado no existe.", 404);

                tipo.Activo = activo;
                await _context.SaveChangesAsync();

                return (true, activo ? "Tipo de servicio activado." : "Tipo de servicio desactivado.", 200);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al cambiar el estado del tipo de servicio {Id}.", idTipoServicio);
                return (false, "Ocurrió un error interno al actualizar el tipo de servicio.", 500);
            }
        }

        // ══════════════════════════════════════════════════════════════════
        // SOLICITUDES DE TIPO DE SERVICIO (Funcionario pide → Admin resuelve)
        // ══════════════════════════════════════════════════════════════════

        // ─── SOLICITAR UN TIPO DE SERVICIO NUEVO (SOLO FUNCIONARIO) ───
        public async Task<(bool Exito, string Mensaje, int Codigo)> SolicitarAsync(
            int idUsuario, SolicitarTipoServicioRequest request, byte rolUsuario)
        {
            try
            {
                if (rolUsuario != ROL_FUNCIONARIO)
                    return (false,
                        "Solo un funcionario (dueño de una veterinaria) puede enviar solicitudes de tipo de servicio.",
                        403);

                // El funcionario solo puede solicitar desde una veterinaria que le pertenezca.
                var validacion = await _validacion.ValidarPropietarioComercioAsync(idUsuario, request.IdComercio, esAdmin: false);
                if (!validacion.Exito)
                    return (false, validacion.Mensaje, validacion.Codigo);

                var nombreNormalizado = request.Nombre.Trim();

                var yaExiste = await _context.TipoServicioCat
                    .AnyAsync(t => t.Nombre.ToLower() == nombreNormalizado.ToLower());
                if (yaExiste)
                    return (false, "Ya existe un tipo de servicio con ese nombre en el catálogo.", 409);

                var yaHaySolicitudPendiente = await _context.SolicitudesTipoServicio.AnyAsync(
                    s => s.Nombre.ToLower() == nombreNormalizado.ToLower() && s.IdEstadoSolicitud == ESTADO_PENDIENTE);
                if (yaHaySolicitudPendiente)
                    return (false, "Ya hay una solicitud pendiente para ese mismo tipo de servicio.", 409);

                var solicitud = new SolicitudTipoServicio
                {
                    Nombre = nombreNormalizado,
                    IdUsuarioSolicitante = idUsuario,
                    IdComercio = request.IdComercio,
                    IdEstadoSolicitud = ESTADO_PENDIENTE,
                    FechaSolicitud = DateTime.UtcNow
                };

                _context.SolicitudesTipoServicio.Add(solicitud);
                await _context.SaveChangesAsync();

                _logger.LogInformation(
                    "Solicitud de tipo de servicio '{Nombre}' enviada por el usuario {Usuario} desde el comercio {Comercio}.",
                    solicitud.Nombre, idUsuario, request.IdComercio);

                return (true, "Solicitud enviada. Un administrador la revisará pronto.", 201);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al solicitar el tipo de servicio '{Nombre}'.", request.Nombre);
                return (false, "Ocurrió un error interno al enviar la solicitud.", 500);
            }
        }

        // ─── LISTAR SOLICITUDES PENDIENTES (ADMIN) ───
        public async Task<List<SolicitudTipoServicioDTO>> ListarPendientesAsync()
        {
            return await ListarConDetalleAsync(s => s.IdEstadoSolicitud == ESTADO_PENDIENTE);
        }

        // ─── LISTAR MIS SOLICITUDES (FUNCIONARIO: ve el estado de lo que pidió) ───
        public async Task<List<SolicitudTipoServicioDTO>> ListarMiasAsync(int idUsuario)
        {
            return await ListarConDetalleAsync(s => s.IdUsuarioSolicitante == idUsuario);
        }

        private async Task<List<SolicitudTipoServicioDTO>> ListarConDetalleAsync(
            System.Linq.Expressions.Expression<Func<SolicitudTipoServicio, bool>> filtro)
        {
            var solicitudes = await (
                from s in _context.SolicitudesTipoServicio.Where(filtro)
                join u in _context.Usuarios on s.IdUsuarioSolicitante equals u.IdUsuario
                join c in _context.Comercios on s.IdComercio equals c.IdComercio into cGroup
                from c in cGroup.DefaultIfEmpty()
                orderby s.FechaSolicitud descending
                select new SolicitudTipoServicioDTO
                {
                    IdSolicitudTipoServicio = s.IdSolicitudTipoServicio,
                    Nombre = s.Nombre,
                    IdUsuarioSolicitante = s.IdUsuarioSolicitante,
                    NombreSolicitante = (u.Nombre + " " + u.Apellidos).Trim(),
                    IdComercio = s.IdComercio,
                    NombreComercio = c != null ? c.NombreComercial : null,
                    IdEstadoSolicitud = s.IdEstadoSolicitud,
                    FechaSolicitud = s.FechaSolicitud,
                    FechaResolucion = s.FechaResolucion
                }
            ).ToListAsync();

            foreach (var s in solicitudes)
                s.EstadoSolicitud = NombreEstadoSolicitud(s.IdEstadoSolicitud);

            return solicitudes;
        }

        // ─── APROBAR UNA SOLICITUD (ADMIN): crea el tipo real en el catálogo ───
        public async Task<(bool Exito, string Mensaje, int Codigo)> AprobarSolicitudAsync(int idSolicitud, int idAdmin)
        {
            try
            {
                var solicitud = await _context.SolicitudesTipoServicio
                    .FirstOrDefaultAsync(s => s.IdSolicitudTipoServicio == idSolicitud);
                if (solicitud == null)
                    return (false, "La solicitud indicada no existe.", 404);

                if (solicitud.IdEstadoSolicitud != ESTADO_PENDIENTE)
                    return (false, "Esta solicitud ya fue resuelta anteriormente.", 409);

                // Si mientras tanto ya se creó (u otra solicitud igual ya fue aprobada), no
                // duplicamos el tipo: la solicitud igual queda marcada como aprobada.
                var tipoExistente = await _context.TipoServicioCat
                    .FirstOrDefaultAsync(t => t.Nombre.ToLower() == solicitud.Nombre.ToLower());

                if (tipoExistente == null)
                {
                    _context.TipoServicioCat.Add(new TipoServicioCat
                    {
                        Nombre = solicitud.Nombre,
                        Activo = true
                    });
                }

                solicitud.IdEstadoSolicitud = ESTADO_APROBADO;
                solicitud.FechaResolucion = DateTime.UtcNow;
                solicitud.IdUsuarioResolvio = idAdmin;

                await _context.SaveChangesAsync();

                _logger.LogInformation(
                    "Solicitud de tipo de servicio {Solicitud} ('{Nombre}') aprobada por el administrador {Admin}.",
                    idSolicitud, solicitud.Nombre, idAdmin);

                return (true, "Solicitud aprobada. El tipo de servicio ya está disponible.", 200);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al aprobar la solicitud de tipo de servicio {Id}.", idSolicitud);
                return (false, "Ocurrió un error interno al aprobar la solicitud.", 500);
            }
        }

        // ─── RECHAZAR UNA SOLICITUD (ADMIN) ───
        public async Task<(bool Exito, string Mensaje, int Codigo)> RechazarSolicitudAsync(int idSolicitud, int idAdmin)
        {
            try
            {
                var solicitud = await _context.SolicitudesTipoServicio
                    .FirstOrDefaultAsync(s => s.IdSolicitudTipoServicio == idSolicitud);
                if (solicitud == null)
                    return (false, "La solicitud indicada no existe.", 404);

                if (solicitud.IdEstadoSolicitud != ESTADO_PENDIENTE)
                    return (false, "Esta solicitud ya fue resuelta anteriormente.", 409);

                solicitud.IdEstadoSolicitud = ESTADO_RECHAZADO;
                solicitud.FechaResolucion = DateTime.UtcNow;
                solicitud.IdUsuarioResolvio = idAdmin;

                await _context.SaveChangesAsync();

                _logger.LogInformation(
                    "Solicitud de tipo de servicio {Solicitud} ('{Nombre}') rechazada por el administrador {Admin}.",
                    idSolicitud, solicitud.Nombre, idAdmin);

                return (true, "Solicitud rechazada.", 200);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al rechazar la solicitud de tipo de servicio {Id}.", idSolicitud);
                return (false, "Ocurrió un error interno al rechazar la solicitud.", 500);
            }
        }

        private static string NombreEstadoSolicitud(short idEstadoSolicitud) => idEstadoSolicitud switch
        {
            ESTADO_PENDIENTE => "Pendiente",
            ESTADO_APROBADO => "Aprobada",
            ESTADO_RECHAZADO => "Rechazada",
            _ => "Desconocido"
        };
    }
}
