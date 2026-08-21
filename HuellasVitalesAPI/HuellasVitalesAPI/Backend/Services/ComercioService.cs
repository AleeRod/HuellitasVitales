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

        public async Task<(bool Exito, string Mensaje)> CrearSolicitudRegistroAsync(SolicitudComercioRequest request, int idUsuario)
        {
            var usuarioExiste = await _context.Usuarios.AnyAsync(u => u.IdUsuario == idUsuario);
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
                        IdUsuario = idUsuario
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

        // ─── Ascender al dueño de Cliente a Funcionario ───
        // Solo si sigue siendo Cliente (3); no se toca si ya es Admin (1) o Profesional (2).
        const byte ROL_CLIENTE = 3;
        const byte ROL_FUNCIONARIO = 4;

        var personaLegal = await _context.PersonasLegales
            .FirstOrDefaultAsync(p => p.IdPersonaLegal == comercio.IdPersonaLegal);

            if (personaLegal != null)
        {
            var duenio = await _context.Usuarios
                .FirstOrDefaultAsync(u => u.IdUsuario == personaLegal.IdUsuario);

            Console.WriteLine($"[DEBUG ROL] personaLegal.IdUsuario={personaLegal.IdUsuario} | duenio existe={duenio != null} | duenio.IdRol={duenio?.IdRol}");

            if (duenio != null && duenio.IdRol == ROL_CLIENTE)
            {
                duenio.IdRol = ROL_FUNCIONARIO;
                Console.WriteLine("[DEBUG ROL] Se ejecutó el cambio a FUNCIONARIO");
                _logger.LogInformation(
                    "Usuario {Usuario} ascendido de Cliente a Funcionario al aprobarse el comercio {Comercio}",
                    duenio.IdUsuario, idComercio);
            }
        }

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
                    FechaSolicitud = c.FechaSolicitud,
                    TipoPersona = pl.IdTipoPersona == 2 ? "Jurídica" : "Física",
                    Identificacion = pl.Identificacion,
                    NombreSolicitante = u != null ? u.Nombre : "",
                    ApellidosSolicitante = u != null ? u.Apellidos : "",
                    CorreoSolicitante = u != null ? u.Correo : null,
                    TelefonoSolicitante = u != null ? u.Telefono : null
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

        private static string NombreEstadoSolicitud(byte idEstadoSolicitud) => idEstadoSolicitud switch
        {
            1 => "Pendiente",
            2 => "Aprobado",
            3 => "Rechazado",
            _ => "Desconocido"
        };

        // ─── LISTAR TODOS LOS COMERCIOS (para la vista "Comercios" del Admin) ───
        // A diferencia de ListarPendientesAsync, acá no se filtra por estado — el admin ve
        // pendientes, aprobados y rechazados en un mismo lugar, con filtros opcionales.
        public async Task<List<ComercioAdminDTO>> ListarTodosAsync(string? busqueda, byte? idEstadoSolicitud)
        {
            var query =
                from c in _context.Comercios
                join pl in _context.PersonasLegales on c.IdPersonaLegal equals pl.IdPersonaLegal
                join tc in _context.TiposComercioCat on c.IdTipoComercio equals tc.IdTipoComercio into tcGroup
                from tc in tcGroup.DefaultIfEmpty()
                join u in _context.Usuarios on pl.IdUsuario equals u.IdUsuario into uGroup
                from u in uGroup.DefaultIfEmpty()
                select new ComercioAdminDTO
                {
                    IdComercio = c.IdComercio,
                    NombreComercial = c.NombreComercial,
                    IdTipoComercio = c.IdTipoComercio,
                    TipoComercio = tc != null ? tc.Nombre : "Sin definir",
                    Direccion = c.Direccion,
                    Telefono = c.Telefono,
                    IdEstadoSolicitud = c.IdEstadoSolicitud,
                    EstadoSolicitud = "",
                    FechaSolicitud = c.FechaSolicitud,
                    FechaResolucion = c.FechaResolucion,
                    TipoPersona = pl.IdTipoPersona == 2 ? "Jurídica" : "Física",
                    Identificacion = pl.Identificacion,
                    NombrePersonaLegal = pl.IdTipoPersona == 2
                        ? (pl.RazonSocial ?? "")
                        : (u != null ? $"{u.Nombre} {u.Apellidos}" : ""),
                    CorreoSolicitante = u != null ? u.Correo : null,
                    TelefonoSolicitante = u != null ? u.Telefono : null
                };

            if (idEstadoSolicitud.HasValue)
                query = query.Where(x => x.IdEstadoSolicitud == idEstadoSolicitud.Value);

            if (!string.IsNullOrWhiteSpace(busqueda))
            {
                var termino = busqueda.Trim().ToLower();
                query = query.Where(x =>
                    x.NombreComercial.ToLower().Contains(termino) ||
                    x.NombrePersonaLegal.ToLower().Contains(termino) ||
                    (x.CorreoSolicitante != null && x.CorreoSolicitante.ToLower().Contains(termino)));
            }

            var resultado = await query.OrderByDescending(x => x.FechaSolicitud).ToListAsync();

            // El nombre del estado se resuelve en memoria (mismo criterio que EspecieCat en
            // UsuarioService): ESTADO_SOLICITUD_CAT no tiene entidad/DbSet propio en el proyecto.
            foreach (var comercio in resultado)
                comercio.EstadoSolicitud = NombreEstadoSolicitud(comercio.IdEstadoSolicitud);

            return resultado;
        }

        // ─── EDITAR DATOS BÁSICOS DE UN COMERCIO (cualquier estado) ───
        public async Task<(bool Exito, string Mensaje)> ActualizarAsync(int idComercio, EditarComercioRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.NombreComercial))
                return (false, "El nombre comercial es obligatorio.");

            var comercio = await _context.Comercios.FirstOrDefaultAsync(c => c.IdComercio == idComercio);
            if (comercio == null)
                return (false, "El comercio no existe.");

            comercio.NombreComercial = request.NombreComercial.Trim();
            comercio.IdTipoComercio = request.IdTipoComercio;
            comercio.Direccion = string.IsNullOrWhiteSpace(request.Direccion) ? null : request.Direccion.Trim();
            comercio.Telefono = string.IsNullOrWhiteSpace(request.Telefono) ? null : request.Telefono.Trim();

            await _context.SaveChangesAsync();
            return (true, "Comercio actualizado correctamente.");
        }

        // ─── ELIMINAR (dar de baja) UN COMERCIO YA APROBADO ───
        // El proyecto no modela un estado "Desactivado" propio (ESTADO_SOLICITUD_CAT solo tiene
        // Pendiente/Aprobado/Rechazado, confirmado contra la Supabase real) — agregar uno
        // requeriría insertar una fila de catálogo nueva, un cambio de datos que hay que decidir
        // aparte. Mientras tanto, "eliminar" un comercio (a diferencia de RechazarComercioAsync,
        // que solo actúa sobre solicitudes pendientes) reutiliza el mismo estado Rechazado(3):
        // en la práctica ya lo saca del marketplace (BuscarComerciosAprobadosAsync filtra por
        // estado == 2), que es el efecto real que se busca con "eliminar" en este panel.
        public async Task<(bool Exito, string Mensaje, int Codigo)> EliminarAsync(int idComercio, int idAdmin)
        {
            var comercio = await _context.Comercios.FirstOrDefaultAsync(c => c.IdComercio == idComercio);
            if (comercio == null)
                return (false, "El comercio no existe.", 404);

            if (comercio.IdEstadoSolicitud == 3)
                return (false, "Este comercio ya estaba eliminado.", 409);

            comercio.IdEstadoSolicitud = 3;
            comercio.FechaResolucion = DateTime.UtcNow;
            comercio.IdUsuarioResolvio = idAdmin;

            await _context.SaveChangesAsync();
            _logger.LogInformation("Comercio {Id} eliminado (dado de baja) por el administrador {Admin}", idComercio, idAdmin);

            return (true, "Comercio eliminado correctamente.", 200);
        }

            public async Task<List<ComercioResumenDTO>> ListarMiosAsync(int idUsuario)
        {
            const byte ESTADO_APROBADO = 2;

            return await (
                from c in _context.Comercios
                join p in _context.PersonasLegales on c.IdPersonaLegal equals p.IdPersonaLegal
                join tc in _context.TiposComercioCat on c.IdTipoComercio equals tc.IdTipoComercio into tcGroup
                from tc in tcGroup.DefaultIfEmpty()
                where p.IdUsuario == idUsuario && c.IdEstadoSolicitud == ESTADO_APROBADO
                select new ComercioResumenDTO
                {
                    IdComercio = c.IdComercio,
                    NombreComercial = c.NombreComercial,
                    IdTipoComercio = c.IdTipoComercio,
                    TipoComercio = tc != null ? tc.Nombre : "Desconocido"
                }
            ).ToListAsync();
        }

    }
}