using HuellitasVitalesAPI.Data;
using Microsoft.EntityFrameworkCore;

namespace HuellitasVitalesAPI.Services;

/// <summary>
/// Resumen de actividad clínica para el panel "Reportes": citas, emergencias, atenciones
/// externas y traslados. Combina dos formas de pertenencia porque en esta rama VETERINARIO no
/// tiene IdComercio (ese trabajo quedó en otra rama):
///   - Lo que el propio profesional atendió directamente (Cita.IdVeterinario,
///     Emergencia.IdVeterinario).
///   - Lo que pasó en los comercios que administra (dueño vía PERSONA_LEGAL o funcionario
///     activo vía COMERCIO_FUNCIONARIO) — mismo mecanismo que ya usan
///     TrasladoExpedienteService/EmergenciaService.
/// Para Admin, el alcance es global.
/// </summary>
public class ReporteService
{
    private const byte RolAdministrador = 1;
    private const short ESTADO_CITA_COMPLETADA = 4;

    private readonly ConexionDB _context;

    public ReporteService(ConexionDB context) => _context = context;

    public async Task<object> ObtenerResumenAsync(int idUsuario, byte rol)
    {
        var comercios = rol == RolAdministrador
            ? await _context.Comercios.Select(c => c.IdComercio).ToListAsync()
            : await ComerciosDelUsuarioAsync(idUsuario);

        var vet = await _context.Veterinarios.FirstOrDefaultAsync(v => v.IdUsuario == idUsuario);

        // ─── CITAS ───
        var citasQuery =
            from c in _context.Citas
            join s in _context.Servicios on c.IdServicio equals s.IdServicio
            where (vet != null && c.IdVeterinario == vet.IdVeterinario) || comercios.Contains(s.IdComercio)
            select c;

        var citasTotales = await citasQuery.CountAsync();
        var citasCompletadas = await citasQuery.CountAsync(c => c.IdEstadoCita == ESTADO_CITA_COMPLETADA);

        // ─── EMERGENCIAS ───
        var emergenciasQuery = _context.Emergencias.Where(e =>
            (vet != null && e.IdVeterinario == vet.IdVeterinario) ||
            (e.IdComercio.HasValue && comercios.Contains(e.IdComercio.Value)));

        var emergenciasAtendidas = await emergenciasQuery.CountAsync(e => e.Estado == "Finalizada");
        var emergenciasActivas = await emergenciasQuery.CountAsync(e => e.Estado == "Solicitada" || e.Estado == "Aceptada" || e.Estado == "EnAtencion");

        var ultimasEmergencias = await (
            from e in emergenciasQuery
            where e.Estado == "Finalizada"
            join ex in _context.Expedientes on e.IdExpediente equals ex.IdExpediente
            join m in _context.Mascotas on ex.IdMascota equals m.IdMascota
            orderby e.FechaFinalizacion descending
            select new
            {
                e.IdEmergencia,
                e.Motivo,
                e.Estado,
                e.FechaSolicitud,
                e.FechaFinalizacion,
                NombreMascota = m.Nombre,
                e.EsAtencionExterna
            }
        ).Take(5).ToListAsync();

        // ─── ATENCIONES EXTERNAS (por comercio: son autorreportadas por el cliente) ───
        var atencionesQuery =
            from a in _context.AtencionesExternas
            join ex in _context.Expedientes on a.IdExpediente equals ex.IdExpediente
            where ex.IdComercioActual.HasValue && comercios.Contains(ex.IdComercioActual.Value)
            select new { a, ex };

        var atencionesExternasRegistradas = await atencionesQuery.CountAsync();

        var ultimasAtencionesExternas = await (
            from ae in atencionesQuery
            join m in _context.Mascotas on ae.ex.IdMascota equals m.IdMascota
            orderby ae.a.FechaAtencion descending
            select new
            {
                ae.a.IdAtencionExterna,
                ae.a.NombreVeterinaria,
                ae.a.Motivo,
                ae.a.FechaAtencion,
                NombreMascota = m.Nombre
            }
        ).Take(5).ToListAsync();

        // ─── TRASLADOS ───
        var trasladosQuery = _context.SolicitudesTrasladoExpediente.Where(s =>
            comercios.Contains(s.IdComercioOrigen) || comercios.Contains(s.IdComercioDestino));

        var trasladosResueltos = await trasladosQuery.CountAsync(s => s.Estado == "Aceptada" || s.Estado == "Rechazada");

        var ultimosTraslados = await (
            from s in trasladosQuery
            where s.Estado == "Aceptada" || s.Estado == "Rechazada"
            join ex in _context.Expedientes on s.IdExpediente equals ex.IdExpediente
            join m in _context.Mascotas on ex.IdMascota equals m.IdMascota
            join cd in _context.Comercios on s.IdComercioDestino equals cd.IdComercio
            orderby s.FechaResolucion descending
            select new
            {
                s.IdSolicitudTraslado,
                s.Estado,
                s.FechaResolucion,
                NombreMascota = m.Nombre,
                VeterinariaDestino = cd.NombreComercial
            }
        ).Take(5).ToListAsync();

        return new
        {
            CitasTotales = citasTotales,
            CitasCompletadas = citasCompletadas,
            EmergenciasAtendidas = emergenciasAtendidas,
            EmergenciasActivas = emergenciasActivas,
            AtencionesExternasRegistradas = atencionesExternasRegistradas,
            TrasladosResueltos = trasladosResueltos,
            UltimasEmergencias = ultimasEmergencias,
            UltimasAtencionesExternas = ultimasAtencionesExternas,
            UltimosTraslados = ultimosTraslados
        };
    }

    // ─── RESUMEN PARA EL CLIENTE (rol 3): sus propias mascotas, citas, atenciones y emergencias ───
    public async Task<object> ObtenerResumenClienteAsync(int idUsuario)
    {
        var totalMascotas = await _context.Mascotas.CountAsync(m => m.IdUsuario == idUsuario && m.Activo);

        var citasQuery = _context.Citas.Where(c => c.IdUsuario == idUsuario);
        var citasCompletadas = await citasQuery.CountAsync(c => c.IdEstadoCita == ESTADO_CITA_COMPLETADA);
        var citasPendientes = await citasQuery.CountAsync(c => c.IdEstadoCita == 1 || c.IdEstadoCita == 2);

        var atencionesExternasRegistradas = await (
            from a in _context.AtencionesExternas
            join ex in _context.Expedientes on a.IdExpediente equals ex.IdExpediente
            join m in _context.Mascotas on ex.IdMascota equals m.IdMascota
            where m.IdUsuario == idUsuario
            select a
        ).CountAsync();

        var emergenciasSolicitadas = await _context.Emergencias.CountAsync(e => e.IdUsuarioSolicitante == idUsuario);

        var proximaCita = await citasQuery
            .Where(c => c.IdEstadoCita == 1 || c.IdEstadoCita == 2)
            .Where(c => c.Fecha >= DateTime.UtcNow.Date)
            .OrderBy(c => c.Fecha).ThenBy(c => c.HoraInicio)
            .Select(c => (DateTime?)c.Fecha)
            .FirstOrDefaultAsync();

        return new
        {
            TotalMascotas = totalMascotas,
            CitasCompletadas = citasCompletadas,
            CitasPendientes = citasPendientes,
            AtencionesExternasRegistradas = atencionesExternasRegistradas,
            EmergenciasSolicitadas = emergenciasSolicitadas,
            ProximaCita = proximaCita
        };
    }

    // ─── HISTORIAL CLÍNICO REAL DEL CLIENTE: une citas completadas, atenciones externas y
    // emergencias finalizadas de TODAS sus mascotas en una sola línea de tiempo ───
    public async Task<List<object>> ObtenerHistorialClinicoAsync(int idUsuario)
    {
        var citas = await (
            from c in _context.Citas
            where c.IdUsuario == idUsuario && c.IdEstadoCita == ESTADO_CITA_COMPLETADA
            join m in _context.Mascotas on c.IdMascota equals m.IdMascota
            join s in _context.Servicios on c.IdServicio equals s.IdServicio
            join v in _context.Veterinarios on c.IdVeterinario equals v.IdVeterinario
            join u in _context.Usuarios on v.IdUsuario equals u.IdUsuario
            select new
            {
                Tipo = "Cita",
                Fecha = c.Fecha,
                NombreMascota = m.Nombre,
                Titulo = s.Nombre,
                Detalle = "Atendido por " + (u.Nombre + " " + u.Apellidos).Trim(),
                Diagnostico = (string?)null,
                Tratamiento = (string?)null
            }
        ).ToListAsync();

        var atenciones = await (
            from a in _context.AtencionesExternas
            join ex in _context.Expedientes on a.IdExpediente equals ex.IdExpediente
            join m in _context.Mascotas on ex.IdMascota equals m.IdMascota
            where m.IdUsuario == idUsuario
            select new
            {
                Tipo = "AtencionExterna",
                Fecha = a.FechaAtencion.Date,
                NombreMascota = m.Nombre,
                Titulo = a.NombreVeterinaria,
                Detalle = a.Motivo,
                Diagnostico = a.Diagnostico,
                Tratamiento = a.Tratamiento
            }
        ).ToListAsync();

        var emergencias = await (
            from e in _context.Emergencias
            where e.IdUsuarioSolicitante == idUsuario && e.Estado == "Finalizada"
            join ex in _context.Expedientes on e.IdExpediente equals ex.IdExpediente
            join m in _context.Mascotas on ex.IdMascota equals m.IdMascota
            select new
            {
                Tipo = "Emergencia",
                Fecha = (e.FechaFinalizacion ?? e.FechaSolicitud).Date,
                NombreMascota = m.Nombre,
                Titulo = e.Motivo,
                Detalle = e.EsAtencionExterna ? $"Atendida por {e.NombreClinicaExterna}" : "Emergencia atendida en Huellitas Vitales",
                Diagnostico = e.Diagnostico,
                Tratamiento = e.Tratamiento
            }
        ).ToListAsync();

        // Las tres proyecciones tienen exactamente los mismos nombres/tipos de propiedad en el
        // mismo orden, así que el compilador las trata como el mismo tipo anónimo — se pueden
        // concatenar y ordenar directamente, sin "dynamic".
        return citas
            .Concat(atenciones)
            .Concat(emergencias)
            .OrderByDescending(x => x.Fecha)
            .Cast<object>()
            .ToList();
    }

    private async Task<List<int>> ComerciosDelUsuarioAsync(int idUsuario)
    {
        var propios = await (
            from c in _context.Comercios
            join p in _context.PersonasLegales on c.IdPersonaLegal equals p.IdPersonaLegal
            where p.IdUsuario == idUsuario
            select c.IdComercio
        ).ToListAsync();

        var funcionario = await _context.ComerciosFuncionarios
            .Where(f => f.IdUsuario == idUsuario && f.Activo)
            .Select(f => f.IdComercio)
            .ToListAsync();

        return propios.Union(funcionario).Distinct().ToList();
    }
}
