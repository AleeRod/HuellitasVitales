using HuellasVitalesAPI.Backend.Models.DTOs;
using HuellasVitalesAPI.Backend.Models.Entidades;
using HuellitasVitalesAPI.Data;
using Microsoft.EntityFrameworkCore;

namespace HuellitasVitalesAPI.Services;

public class TrasladoExpedienteService
{
    private const byte RolAdministrador = 1;
    private const byte TipoComercioVeterinaria = 1;
    private const byte EstadoComercioAprobado = 2;
    private readonly ConexionDB _context;
    private readonly NotificacionService _notificaciones;
    private readonly ILogger<TrasladoExpedienteService> _logger;

    public TrasladoExpedienteService(ConexionDB context, NotificacionService notificaciones,
        ILogger<TrasladoExpedienteService> logger)
    {
        _context = context;
        _notificaciones = notificaciones;
        _logger = logger;
    }

    public async Task<(bool Exito, string Mensaje, int Codigo, object? Datos)> SolicitarAsync(
        int idExpediente, int idUsuario, byte rol, SolicitarTrasladoExpedienteRequest request)
    {
        var expediente = await _context.Expedientes.FirstOrDefaultAsync(e => e.IdExpediente == idExpediente && e.Activo);
        if (expediente == null) return (false, "El expediente no existe o está inactivo.", 404, null);

        var mascota = await _context.Mascotas.FirstOrDefaultAsync(m => m.IdMascota == expediente.IdMascota && m.Activo);
        if (mascota == null) return (false, "La mascota asociada al expediente no existe o está inactiva.", 404, null);
        if (rol != RolAdministrador && mascota.IdUsuario != idUsuario)
            return (false, "Solo el propietario de la mascota puede solicitar el traslado.", 403, null);
        if (expediente.IdComercioActual == null)
            return (false, "Tu mascota todavía no tiene una veterinaria asignada, así que no hay de dónde trasladarla. Elegí una veterinaria primero.", 400, null);
        if (request.IdComercioDestino == expediente.IdComercioActual)
            return (false, "La veterinaria de destino debe ser diferente a la actual.", 400, null);

        var destino = await ObtenerComercioVeterinarioAsync(request.IdComercioDestino);
        if (destino == null) return (false, "La veterinaria de destino no existe o no está aprobada.", 404, null);
        if (await _context.SolicitudesTrasladoExpediente.AnyAsync(s => s.IdExpediente == idExpediente && s.Estado == "Pendiente"))
            return (false, "Ya existe una solicitud de traslado pendiente para este expediente.", 409, null);

        var solicitud = new SolicitudTrasladoExpediente
        {
            IdExpediente = idExpediente,
            IdComercioOrigen = expediente.IdComercioActual.Value,
            IdComercioDestino = request.IdComercioDestino,
            IdUsuarioSolicitante = idUsuario,
            Motivo = string.IsNullOrWhiteSpace(request.Motivo) ? null : request.Motivo.Trim(),
            FechaSolicitud = DateTime.UtcNow
        };
        _context.SolicitudesTrasladoExpediente.Add(solicitud);
        await _context.SaveChangesAsync();

        await NotificarResponsablesComercioAsync(destino.IdComercio, "Solicitud de traslado recibida",
            $"Se solicitó trasladar el expediente de {mascota.Nombre} a {destino.NombreComercial}.",
            "TrasladoExpediente", solicitud.IdSolicitudTraslado);

        return (true, "Solicitud de traslado enviada a la veterinaria receptora.", 201, new
        {
            solicitud.IdSolicitudTraslado, solicitud.Estado, solicitud.FechaSolicitud,
            VeterinariaDestino = destino.NombreComercial
        });
    }

    public async Task<(bool Exito, string Mensaje, int Codigo, object? Datos)> ResolverAsync(
        int idSolicitud, int idUsuario, byte rol, bool aceptar, ResolverTrasladoExpedienteRequest request)
    {
        var solicitud = await _context.SolicitudesTrasladoExpediente.FirstOrDefaultAsync(s => s.IdSolicitudTraslado == idSolicitud);
        if (solicitud == null) return (false, "La solicitud de traslado no existe.", 404, null);
        if (solicitud.Estado != "Pendiente") return (false, "Esta solicitud ya fue resuelta.", 409, null);
        if (!await PuedeGestionarComercioAsync(idUsuario, rol, solicitud.IdComercioDestino))
            return (false, "No tienes permisos para resolver solicitudes de esta veterinaria.", 403, null);

        var expediente = await _context.Expedientes.FirstOrDefaultAsync(e => e.IdExpediente == solicitud.IdExpediente && e.Activo);
        if (expediente == null) return (false, "El expediente ya no está disponible.", 404, null);
        if (expediente.IdComercioActual != solicitud.IdComercioOrigen)
            return (false, "El expediente cambió de veterinaria mientras la solicitud estaba pendiente.", 409, null);

        await using var transaccion = await _context.Database.BeginTransactionAsync();
        solicitud.Estado = aceptar ? "Aceptada" : "Rechazada";
        solicitud.Respuesta = string.IsNullOrWhiteSpace(request.Respuesta) ? null : request.Respuesta.Trim();
        solicitud.FechaResolucion = DateTime.UtcNow;
        solicitud.IdUsuarioResuelve = idUsuario;

        if (aceptar)
        {
            var accesoOrigen = await _context.ExpedientesComercios
                .FirstOrDefaultAsync(a => a.IdExpediente == expediente.IdExpediente && a.IdComercio == solicitud.IdComercioOrigen && a.FechaHasta == null);
            if (accesoOrigen != null)
            {
                accesoOrigen.PuedeModificar = false;
                accesoOrigen.PuedeConsultar = true;
                accesoOrigen.FechaHasta = DateTime.UtcNow;
            }

            _context.ExpedientesComercios.Add(new ExpedienteComercio
            {
                IdExpediente = expediente.IdExpediente,
                IdComercio = solicitud.IdComercioDestino,
                PuedeConsultar = true,
                PuedeModificar = true,
                FechaDesde = DateTime.UtcNow
            });
            expediente.IdComercioActual = solicitud.IdComercioDestino;
        }

        await _context.SaveChangesAsync();
        await transaccion.CommitAsync();

        var resultado = aceptar ? "aceptado" : "rechazado";
        await _notificaciones.CrearAsync(solicitud.IdUsuarioSolicitante, $"Traslado {resultado}",
            $"La veterinaria receptora ha {resultado} la solicitud de traslado del expediente.",
            "TrasladoExpediente", "SolicitudTraslado", solicitud.IdSolicitudTraslado);
        return (true, $"Traslado {resultado} correctamente.", 200, new { solicitud.IdSolicitudTraslado, solicitud.Estado });
    }

    public async Task<List<object>> PendientesAsync(int idUsuario, byte rol)
    {
        var comercios = await ComerciosGestionablesAsync(idUsuario, rol);
        return await (from s in _context.SolicitudesTrasladoExpediente
                      where s.Estado == "Pendiente" && comercios.Contains(s.IdComercioDestino)
                      join e in _context.Expedientes on s.IdExpediente equals e.IdExpediente
                      join m in _context.Mascotas on e.IdMascota equals m.IdMascota
                      join c in _context.Comercios on s.IdComercioDestino equals c.IdComercio
                      select (object)new { s.IdSolicitudTraslado, s.IdExpediente, NombreMascota = m.Nombre,
                          s.FechaSolicitud, s.Motivo, IdComercioDestino = c.IdComercio, VeterinariaDestino = c.NombreComercial }).ToListAsync();
    }

    // ─── MIS SOLICITUDES (para el cliente que las envió) ───
    // Antes el cliente enviaba una solicitud y nunca más sabía qué pasó con ella — no había
    // ninguna forma de consultar si fue aceptada, rechazada, o seguía pendiente.
    public async Task<List<object>> ObtenerMisSolicitudesAsync(int idUsuario)
    {
        return await (
            from s in _context.SolicitudesTrasladoExpediente
            where s.IdUsuarioSolicitante == idUsuario
            join e in _context.Expedientes on s.IdExpediente equals e.IdExpediente
            join m in _context.Mascotas on e.IdMascota equals m.IdMascota
            join cd in _context.Comercios on s.IdComercioDestino equals cd.IdComercio
            orderby s.FechaSolicitud descending
            select (object)new
            {
                s.IdSolicitudTraslado,
                NombreMascota = m.Nombre,
                VeterinariaDestino = cd.NombreComercial,
                s.Estado,
                s.Motivo,
                s.Respuesta,
                s.FechaSolicitud,
                s.FechaResolucion
            }
        ).ToListAsync();
    }

    private async Task<Comercio?> ObtenerComercioVeterinarioAsync(int idComercio) =>
        await _context.Comercios.FirstOrDefaultAsync(c => c.IdComercio == idComercio &&
            c.IdTipoComercio == TipoComercioVeterinaria && c.IdEstadoSolicitud == EstadoComercioAprobado);

    private async Task<bool> PuedeGestionarComercioAsync(int idUsuario, byte rol, int idComercio)
    {
        if (rol == RolAdministrador) return true;
        if (await _context.PersonasLegales.AnyAsync(p => p.IdUsuario == idUsuario &&
            _context.Comercios.Any(c => c.IdComercio == idComercio && c.IdPersonaLegal == p.IdPersonaLegal))) return true;
        return await _context.ComerciosFuncionarios.AnyAsync(f => f.IdComercio == idComercio && f.IdUsuario == idUsuario && f.Activo);
    }

    private async Task<List<int>> ComerciosGestionablesAsync(int idUsuario, byte rol)
    {
        if (rol == RolAdministrador) return await _context.Comercios.Select(c => c.IdComercio).ToListAsync();
        var propios = await (from c in _context.Comercios join p in _context.PersonasLegales on c.IdPersonaLegal equals p.IdPersonaLegal where p.IdUsuario == idUsuario select c.IdComercio).ToListAsync();
        var funcionario = await _context.ComerciosFuncionarios.Where(f => f.IdUsuario == idUsuario && f.Activo).Select(f => f.IdComercio).ToListAsync();
        return propios.Union(funcionario).Distinct().ToList();
    }

    private async Task NotificarResponsablesComercioAsync(int idComercio, string titulo, string mensaje, string tipo, int referenciaId)
    {
        var responsables = await (from c in _context.Comercios join p in _context.PersonasLegales on c.IdPersonaLegal equals p.IdPersonaLegal where c.IdComercio == idComercio select p.IdUsuario).ToListAsync();
        foreach (var idUsuario in responsables.Distinct()) await _notificaciones.CrearAsync(idUsuario, titulo, mensaje, tipo, "SolicitudTraslado", referenciaId);
    }
}
