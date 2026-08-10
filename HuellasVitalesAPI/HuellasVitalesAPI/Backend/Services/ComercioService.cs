using HuellasVitalesAPI.Backend.Models.DTOs;
using HuellasVitalesAPI.Backend.Models.Entidades;
using HuellitasVitalesAPI.Data;
using Microsoft.EntityFrameworkCore;

namespace HuellitasVitalesAPI.Services
{
    public class ComercioService
    {
        private readonly ConexionDB _context;
        private readonly ILogger<ComercioService> _logger;

        public ComercioService(ConexionDB context, ILogger<ComercioService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<(bool Exito, string Mensaje)> CrearSolicitudRegistroAsync(SolicitudComercioRequest request)
        {
            var usuarioExiste = await _context.Usuarios.AnyAsync(u => u.IdUsuario == request.IdUsuario);
            if (!usuarioExiste) return (false, "El usuario solicitante no existe en el sistema.");

            using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                var personaLegal = await _context.PersonasLegales
                    .FirstOrDefaultAsync(p => p.Identificacion == request.Identificacion);

                if (personaLegal == null)
                {
                    personaLegal = new PersonaLegal
                    {
                        IdTipoPersona = request.IdTipoPersona,
                        Identificacion = request.Identificacion,
                        RazonSocial = request.IdTipoPersona == 2 ? request.RazonSocial : null,
                        IdUsuario = request.IdUsuario
                    };
                    _context.PersonasLegales.Add(personaLegal);
                    await _context.SaveChangesAsync();
                }

                var nuevosComercios = new List<Comercio>();

                foreach (var comDTO in request.Comercios)
                {
                    var existeComercioDuplicado = await _context.Comercios.AnyAsync(c => 
                        c.IdPersonaLegal == personaLegal.IdPersonaLegal && 
                        c.IdTipoComercio == comDTO.IdTipoComercio && 
                        c.NombreComercial.ToLower() == comDTO.NombreComercial.ToLower());

                    if (existeComercioDuplicado)
                    {
                        await transaction.RollbackAsync();
                        return (false, $"El comercio '{comDTO.NombreComercial}' ya se encuentra registrado o en proceso de solicitud.");
                    }

                    nuevosComercios.Add(new Comercio
                    {
                        IdPersonaLegal = personaLegal.IdPersonaLegal,
                        IdTipoComercio = comDTO.IdTipoComercio,
                        NombreComercial = comDTO.NombreComercial,
                        Direccion = comDTO.Direccion,
                        Telefono = comDTO.Telefono,
                        IdEstadoSolicitud = 1,
                        FechaSolicitud = DateTime.UtcNow
                    });
                }

                _context.Comercios.AddRange(nuevosComercios);
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return (true, "Solicitud de comercio(s) registrada con éxito.");
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Error al procesar solicitud para {Identificacion}", request.Identificacion);
                return (false, "Ocurrió un error interno al procesar la solicitud.");
            }
        }

        // ─── APROBAR UN COMERCIO (habilita su acceso al marketplace) ───
        // Codigo = código HTTP sugerido para que el controlador lo retorne.
        public async Task<(bool Exito, string Mensaje, int Codigo)> AprobarComercioAsync(int idComercio, int idAdmin)
        {
            try
            {
                var comercio = await _context.Comercios.FirstOrDefaultAsync(c => c.IdComercio == idComercio);

                // 404 - No existe
                if (comercio == null)
                    return (false, "El comercio indicado no existe.", 404);

                // 409 - Ya estaba aprobado (operación idempotente, no se repite la resolución)
                if (comercio.IdEstadoSolicitud == 2)
                    return (false, "Este comercio ya se encuentra aprobado.", 409);

                comercio.IdEstadoSolicitud = 2;              // 2 = APROBADO
                comercio.FechaResolucion = DateTime.UtcNow; // Fecha de resolución
                comercio.IdUsuarioResolvio = idAdmin;

                await _context.SaveChangesAsync();

                _logger.LogInformation("Comercio {Id} aprobado por el administrador {Admin}", idComercio, idAdmin);
                return (true, "Comercio aprobado. Ya tiene acceso al marketplace.", 200);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al aprobar el comercio {Id}", idComercio);
                return (false, "Ocurrió un error interno al aprobar el comercio.", 500);
            }
        }

        // ─── BÚSQUEDA DINÁMICA DE COMERCIOS APROBADOS (marketplace) ───
        public async Task<List<ComercioBusquedaDTO>> BuscarComerciosAprobadosAsync(string termino)
        {
            // Solo se listan comercios ya aprobados (estado 2)
            var query = _context.Comercios.Where(c => c.IdEstadoSolicitud == 2);

            termino = termino?.Trim() ?? string.Empty;
            if (!string.IsNullOrWhiteSpace(termino))
            {
                query = query.Where(c => c.NombreComercial.Contains(termino));
            }

            return await query
                .OrderBy(c => c.NombreComercial)
                .Take(20) // Se limita la respuesta para no saturar la UI
                .Select(c => new ComercioBusquedaDTO
                {
                    IdComercio = c.IdComercio,
                    NombreComercial = c.NombreComercial,
                    IdTipoComercio = c.IdTipoComercio,
                    Direccion = c.Direccion,
                    Telefono = c.Telefono
                })
                .ToListAsync();
        }

        //  LISTAR SOLICITUDES PENDIENTES (para el panel del administrador) 
        public async Task<List<ComercioPendienteDTO>> ListarPendientesAsync()
        {
            var pendientes = await (
                from c in _context.Comercios
                where c.IdEstadoSolicitud == 1
                join pl in _context.PersonasLegales on c.IdPersonaLegal equals pl.IdPersonaLegal
                join tc in _context.TiposComercioCat on c.IdTipoComercio equals tc.IdTipoComercio into tcGroup
                from tc in tcGroup.DefaultIfEmpty()
                join u in _context.Usuarios on pl.IdUsuario equals u.IdUsuario into uGroup
                from u in uGroup.DefaultIfEmpty()
                orderby c.FechaSolicitud
                select new ComercioPendienteDTO
                {
                    IdComercio = c.IdComercio,
                    NombreComercial = c.NombreComercial,
                    TipoComercio = tc != null ? tc.Nombre : "Sin definir",
                    NombrePersonaLegal = pl.IdTipoPersona == 2
                        ? (pl.RazonSocial ?? "")
                        : (u != null ? $"{u.Nombre} {u.Apellidos}" : ""),
                    Direccion = c.Direccion,
                    Telefono = c.Telefono,
                    FechaSolicitud = c.FechaSolicitud
                }
            ).ToListAsync();

            return pendientes;
        }

        // RECHAZAR UN COMERCIO
        public async Task<(bool Exito, string Mensaje, int Codigo)> RechazarComercioAsync(int idComercio, int idAdmin)
        {
            try
            {
                var comercio = await _context.Comercios.FirstOrDefaultAsync(c => c.IdComercio == idComercio);

                if (comercio == null)
                    return (false, "El comercio indicado no existe.", 404);

                if (comercio.IdEstadoSolicitud != 1)
                    return (false, "Esta solicitud ya fue resuelta anteriormente.", 409);

                comercio.IdEstadoSolicitud = 3;              // 3 = RECHAZADO
                comercio.FechaResolucion = DateTime.UtcNow;
                comercio.IdUsuarioResolvio = idAdmin;

                await _context.SaveChangesAsync();

                _logger.LogInformation("Comercio {Id} rechazado por el administrador {Admin}", idComercio, idAdmin);
                return (true, "Solicitud rechazada correctamente.", 200);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al rechazar el comercio {Id}", idComercio);
                return (false, "Ocurrió un error interno al rechazar la solicitud.", 500);
            }
        }

    }
}