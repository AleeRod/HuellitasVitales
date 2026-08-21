using HuellasVitalesAPI.Backend.Models.DTOs;
using HuellasVitalesAPI.Backend.Models.Entidades;
using HuellitasVitalesAPI.Data;
using Microsoft.EntityFrameworkCore;

namespace HuellitasVitalesAPI.Services;

public class EmergenciaService
{
    private const byte RolAdministrador = 1;
    private const byte RolVeterinario = 2;
    private const byte TipoComercioVeterinaria = 1;
    private const byte EstadoComercioAprobado = 2;

    private readonly ConexionDB _context;
    private readonly NotificacionService _notificaciones;

    public EmergenciaService(ConexionDB context, NotificacionService notificaciones)
    {
        _context = context;
        _notificaciones = notificaciones;
    }

    // Por defecto la emergencia se manda a TODAS las veterinarias aprobadas (IdComercio queda
    // en null): en una emergencia real no tiene sentido pedirle al cliente que elija una sola
    // clínica antes de poder contar qué está pasando — la Ubicación que ya completa existe
    // justamente para que cada veterinaria evalúe si le queda cerca y puede responder. Si el
    // cliente prefiere avisarle a una veterinaria puntual (r.IdComercio viene informado), se
    // respeta esa elección y solo se notifica a esa clínica.
    public async Task<(bool, string, int, object?)> SolicitarAsync(int expedienteId, int usuarioId, EmergenciaRequest r)
    {
        var expediente = await (from e in _context.Expedientes join m in _context.Mascotas on e.IdMascota equals m.IdMascota where e.IdExpediente == expedienteId && e.Activo && m.IdUsuario == usuarioId select e).FirstOrDefaultAsync();
        if (expediente == null) return (false, "No tienes permisos sobre este expediente.", 403, null);

        var emergencia = new Emergencia
        {
            IdExpediente = expedienteId,
            IdUsuarioSolicitante = usuarioId,
            IdComercio = r.IdComercio,
            Ubicacion = r.Ubicacion.Trim(),
            Motivo = r.Motivo.Trim(),
            Descripcion = string.IsNullOrWhiteSpace(r.Descripcion) ? null : r.Descripcion.Trim()
        };
        _context.Emergencias.Add(emergencia);
        await _context.SaveChangesAsync();

        if (r.IdComercio.HasValue)
        {
            await NotificarResponsablesComercioAsync(r.IdComercio.Value, "Nueva solicitud de emergencia",
                $"Se solicitó atención de emergencia: {emergencia.Motivo}.", "Emergencia", emergencia.IdEmergencia);
            return (true, "Emergencia registrada. La veterinaria será notificada.", 201, emergencia);
        }

        await NotificarTodasLasVeterinariasAsync("Nueva solicitud de emergencia",
            $"Se solicitó atención de emergencia: {emergencia.Motivo}.", "Emergencia", emergencia.IdEmergencia);
        return (true, "Emergencia registrada y enviada a todas las veterinarias disponibles.", 201, emergencia);
    }

    public async Task<(bool, string, int, object?)> AceptarAsync(int id, int usuarioId, byte rol)
    {
        if (rol is not (RolAdministrador or RolVeterinario)) return (false, "Solo un administrador o profesional puede aceptar emergencias.", 403, null);
        var e = await _context.Emergencias.FirstOrDefaultAsync(x => x.IdEmergencia == id);
        if (e == null) return (false, "La emergencia no existe.", 404, null);
        if (e.Estado != "Solicitada") return (false, "La emergencia ya fue gestionada.", 409, null);

        // Si el rol del usuario ya es Veterinario pero todavía no tiene fila en VETERINARIO
        // (nadie la crea automáticamente al asignar el rol), se abre su perfil profesional
        // acá mismo, la primera vez que acepta algo — en vez de bloquearlo con un error.
        var vet = await _context.Veterinarios.FirstOrDefaultAsync(v => v.IdUsuario == usuarioId);
        if (rol == RolVeterinario && vet == null)
        {
            vet = new Veterinario { IdUsuario = usuarioId };
            _context.Veterinarios.Add(vet);
            await _context.SaveChangesAsync();
        }

        // El veterinario que acepta debe pertenecer a la clínica de la emergencia (dueño o
        // funcionario activo de ese comercio) — antes cualquier veterinario del sistema podía
        // aceptar cualquier emergencia sin importar la clínica.
        if (rol != RolAdministrador && e.IdComercio.HasValue && !await PerteneceAlComercioAsync(usuarioId, e.IdComercio.Value))
            return (false, "No pertenecés a la veterinaria de esta emergencia.", 403, null);

        // Si la emergencia no tenía veterinaria asignada (se mandó a todas), la primera clínica
        // que la acepta se la "reclama": queda anclada a su comercio de ahí en adelante — así
        // los reportes/historial de esa clínica la reconocen como propia.
        if (!e.IdComercio.HasValue)
        {
            var comerciosDelQueAcepta = await ComerciosDelUsuarioAsync(usuarioId);
            if (comerciosDelQueAcepta.Count > 0) e.IdComercio = comerciosDelQueAcepta[0];
        }

        e.IdVeterinario = vet?.IdVeterinario;
        e.Estado = "Aceptada";
        await _context.SaveChangesAsync();
        await _notificaciones.CrearAsync(e.IdUsuarioSolicitante, "Emergencia aceptada", "Un profesional aceptó la solicitud de emergencia.", "Emergencia", "Emergencia", e.IdEmergencia);
        return (true, "Emergencia aceptada.", 200, e);
    }

    public async Task<(bool, string, int, object?)> IniciarAsync(int id, int usuarioId, byte rol) => await CambiarEstadoAsync(id, usuarioId, rol, "Aceptada", "EnAtencion", null);
    public async Task<(bool, string, int, object?)> FinalizarAsync(int id, int usuarioId, byte rol, CerrarEmergenciaRequest r) => await CambiarEstadoAsync(id, usuarioId, rol, "EnAtencion", "Finalizada", r);

    private async Task<(bool, string, int, object?)> CambiarEstadoAsync(int id, int usuarioId, byte rol, string actual, string siguiente, CerrarEmergenciaRequest? cierre)
    {
        var e = await _context.Emergencias.FirstOrDefaultAsync(x => x.IdEmergencia == id);
        if (e == null) return (false, "La emergencia no existe.", 404, null);
        if (e.Estado != actual) return (false, "La emergencia no se encuentra en el estado esperado.", 409, null);
        var vet = await _context.Veterinarios.FirstOrDefaultAsync(v => v.IdUsuario == usuarioId);
        if (rol != RolAdministrador && (vet == null || e.IdVeterinario != vet.IdVeterinario)) return (false, "No tienes permisos para actualizar esta emergencia.", 403, null);
        e.Estado = siguiente;
        if (siguiente == "EnAtencion") e.FechaInicio = DateTime.UtcNow;
        if (siguiente == "Finalizada") { e.FechaFinalizacion = DateTime.UtcNow; e.Diagnostico = cierre!.Diagnostico.Trim(); e.Tratamiento = cierre.Tratamiento.Trim(); }
        await _context.SaveChangesAsync();
        await _notificaciones.CrearAsync(e.IdUsuarioSolicitante, "Actualización de emergencia", siguiente == "Finalizada" ? "La atención de emergencia fue finalizada." : "La atención de emergencia inició.", "Emergencia", "Emergencia", e.IdEmergencia);
        return (true, "Estado de emergencia actualizado.", 200, e);
    }

    // ─── ATENCIÓN POR VETERINARIO NO REGISTRADO ───
    // El propietario que solicitó la emergencia registra él mismo, después del hecho, quién
    // lo atendió fuera de la plataforma (clínica/veterinario externo) con diagnóstico y
    // tratamiento, y la emergencia se cierra sola. No admite documentos adjuntos por ahora:
    // EMERGENCIA no tiene una tabla de documentos propia (a diferencia de ATENCION_EXTERNA).
    public async Task<(bool, string, int, object?)> RegistrarAtencionExternaAsync(int id, int usuarioId, RegistrarEmergenciaExternaRequest r)
    {
        var e = await _context.Emergencias.FirstOrDefaultAsync(x => x.IdEmergencia == id);
        if (e == null) return (false, "La emergencia no existe.", 404, null);
        if (e.IdUsuarioSolicitante != usuarioId) return (false, "Solo quien solicitó la emergencia puede registrar la atención externa.", 403, null);
        if (e.Estado is "Finalizada" or "Cancelada") return (false, "Esta emergencia ya fue cerrada.", 409, null);

        e.EsAtencionExterna = true;
        e.NombreVeterinarioExterno = r.NombreVeterinarioExterno.Trim();
        e.NombreClinicaExterna = r.NombreClinicaExterna.Trim();
        e.Diagnostico = r.Diagnostico.Trim();
        e.Tratamiento = r.Tratamiento.Trim();
        e.Estado = "Finalizada";
        e.FechaFinalizacion = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return (true, "Atención externa registrada. La emergencia quedó cerrada.", 200, e);
    }

    // ─── EMERGENCIAS PENDIENTES (para el panel del veterinario/admin) ───
    // Incluye tanto las dirigidas a la propia clínica como las de "broadcast" (sin veterinaria
    // asignada, mandadas a todas) — cualquier profesional o funcionario de una veterinaria debe
    // poder verlas y aceptarlas, ya que nadie es dueño de ellas todavía.
    public async Task<List<object>> PendientesAsync(int idUsuario, byte rol)
    {
        var comercios = rol == RolAdministrador
            ? await _context.Comercios.Select(c => c.IdComercio).ToListAsync()
            : await ComerciosDelUsuarioAsync(idUsuario);

        var puedeVerBroadcast = rol == RolAdministrador || rol == RolVeterinario
            || await _context.Comercios.AnyAsync(c => comercios.Contains(c.IdComercio) && c.IdTipoComercio == TipoComercioVeterinaria);

        return await (
            from e in _context.Emergencias
            where e.Estado == "Solicitada" &&
                  ((e.IdComercio.HasValue && comercios.Contains(e.IdComercio.Value)) ||
                   (!e.IdComercio.HasValue && puedeVerBroadcast))
            join ex in _context.Expedientes on e.IdExpediente equals ex.IdExpediente
            join m in _context.Mascotas on ex.IdMascota equals m.IdMascota
            join u in _context.Usuarios on e.IdUsuarioSolicitante equals u.IdUsuario
            orderby e.FechaSolicitud descending
            select (object)new
            {
                e.IdEmergencia,
                e.IdExpediente,
                NombreMascota = m.Nombre,
                e.Ubicacion,
                e.Motivo,
                e.FechaSolicitud,
                e.IdComercio,
                TelefonoContacto = u.Telefono
            }
        ).ToListAsync();
    }

    // ─── EMERGENCIAS "EN CURSO" (aceptadas o en atención) para el veterinario que las lleva,
    // o todas para el admin ───
    public async Task<List<object>> EnCursoAsync(int idUsuario, byte rol)
    {
        IQueryable<Emergencia> query = _context.Emergencias.Where(e => e.Estado == "Aceptada" || e.Estado == "EnAtencion");

        if (rol != RolAdministrador)
        {
            var vet = await _context.Veterinarios.FirstOrDefaultAsync(v => v.IdUsuario == idUsuario);
            if (vet == null) return new List<object>();
            query = query.Where(e => e.IdVeterinario == vet.IdVeterinario);
        }

        return await (
            from e in query
            join ex in _context.Expedientes on e.IdExpediente equals ex.IdExpediente
            join m in _context.Mascotas on ex.IdMascota equals m.IdMascota
            join u in _context.Usuarios on e.IdUsuarioSolicitante equals u.IdUsuario
            orderby e.FechaSolicitud descending
            select (object)new
            {
                e.IdEmergencia,
                e.IdExpediente,
                NombreMascota = m.Nombre,
                e.Ubicacion,
                e.Motivo,
                e.Estado,
                e.FechaSolicitud,
                e.FechaInicio,
                TelefonoContacto = u.Telefono
            }
        ).ToListAsync();
    }

    // ─── EMERGENCIAS DE UN EXPEDIENTE (para mostrarlas dentro del expediente) ───
    public async Task<List<Emergencia>> ListarPorExpedienteAsync(int idExpediente) =>
        await _context.Emergencias.Where(e => e.IdExpediente == idExpediente).OrderByDescending(e => e.FechaSolicitud).ToListAsync();

    // ─── TODAS MIS EMERGENCIAS (de cualquiera de mis mascotas) ───
    // Antes el cliente solo veía el historial de emergencias de la mascota que tuviera
    // seleccionada en ese momento — tenía que ir clickeando mascota por mascota para ver todo
    // lo que pidió. Esto trae todo de una, sin importar cuál mascota esté seleccionada.
    public async Task<List<object>> ObtenerMisEmergenciasAsync(int idUsuario)
    {
        return await (
            from e in _context.Emergencias
            where e.IdUsuarioSolicitante == idUsuario
            join ex in _context.Expedientes on e.IdExpediente equals ex.IdExpediente
            join m in _context.Mascotas on ex.IdMascota equals m.IdMascota
            orderby e.FechaSolicitud descending
            select (object)new
            {
                e.IdEmergencia,
                e.IdExpediente,
                NombreMascota = m.Nombre,
                e.Ubicacion,
                e.Motivo,
                e.Descripcion,
                e.Estado,
                e.FechaSolicitud,
                e.FechaInicio,
                e.FechaFinalizacion,
                e.Diagnostico,
                e.Tratamiento,
                e.EsAtencionExterna,
                e.NombreVeterinarioExterno,
                e.NombreClinicaExterna
            }
        ).ToListAsync();
    }

    // ─── VETERINARIOS DISPONIBLES DE UN COMERCIO (y si hay alguno dentro de su horario ahora) ───
    public async Task<(List<object> Veterinarios, bool FueraDeHorario)> ObtenerVeterinariosDisponiblesAsync(int idComercio)
    {
        var idsUsuarios = await _context.ComerciosFuncionarios
            .Where(f => f.IdComercio == idComercio && f.Activo)
            .Select(f => f.IdUsuario)
            .ToListAsync();

        var veterinarios = await (
            from v in _context.Veterinarios
            where idsUsuarios.Contains(v.IdUsuario)
            join u in _context.Usuarios on v.IdUsuario equals u.IdUsuario
            select new { v.IdVeterinario, Nombre = (u.Nombre + " " + u.Apellidos).Trim(), v.Especialidad }
        ).ToListAsync();

        var ahora = DateTime.Now;
        var diaSemana = (short)ahora.DayOfWeek;
        var hora = ahora.TimeOfDay;

        var idsVeterinarios = veterinarios.Select(v => v.IdVeterinario).ToList();
        var idsEnHorario = await _context.HorariosVeterinario
            .Where(h => idsVeterinarios.Contains(h.IdVeterinario) && h.Activo && h.DiaSemana == diaSemana && h.HoraInicio <= hora && h.HoraFin >= hora)
            .Select(h => h.IdVeterinario)
            .Distinct()
            .ToListAsync();

        var resultado = veterinarios
            .Select(v => (object)new { v.IdVeterinario, v.Nombre, v.Especialidad, DentroDeHorario = idsEnHorario.Contains(v.IdVeterinario) })
            .ToList();

        var fueraDeHorario = veterinarios.Count == 0 || idsEnHorario.Count == 0;
        return (resultado, fueraDeHorario);
    }

    private async Task<bool> PerteneceAlComercioAsync(int idUsuario, int idComercio)
    {
        var esDueno = await (from c in _context.Comercios
                              join p in _context.PersonasLegales on c.IdPersonaLegal equals p.IdPersonaLegal
                              where c.IdComercio == idComercio && p.IdUsuario == idUsuario
                              select c.IdComercio).AnyAsync();
        if (esDueno) return true;

        return await _context.ComerciosFuncionarios.AnyAsync(f => f.IdComercio == idComercio && f.IdUsuario == idUsuario && f.Activo);
    }

    private async Task<List<int>> ComerciosDelUsuarioAsync(int idUsuario)
    {
        var propios = await (from c in _context.Comercios join p in _context.PersonasLegales on c.IdPersonaLegal equals p.IdPersonaLegal where p.IdUsuario == idUsuario select c.IdComercio).ToListAsync();
        var funcionario = await _context.ComerciosFuncionarios.Where(f => f.IdUsuario == idUsuario && f.Activo).Select(f => f.IdComercio).ToListAsync();
        return propios.Union(funcionario).Distinct().ToList();
    }

    private async Task NotificarResponsablesComercioAsync(int idComercio, string titulo, string mensaje, string tipo, int referenciaId)
    {
        var responsables = await (from c in _context.Comercios join p in _context.PersonasLegales on c.IdPersonaLegal equals p.IdPersonaLegal where c.IdComercio == idComercio select p.IdUsuario).ToListAsync();
        var funcionarios = await _context.ComerciosFuncionarios.Where(f => f.IdComercio == idComercio && f.Activo).Select(f => f.IdUsuario).ToListAsync();
        foreach (var idUsuario in responsables.Union(funcionarios).Distinct())
            await _notificaciones.CrearAsync(idUsuario, titulo, mensaje, tipo, "Emergencia", referenciaId);
    }

    // ─── BROADCAST: notifica a los responsables de TODAS las veterinarias aprobadas ───
    // Usado cuando la emergencia no viene dirigida a una clínica en particular.
    private async Task NotificarTodasLasVeterinariasAsync(string titulo, string mensaje, string tipo, int referenciaId)
    {
        var idsVeterinarias = await _context.Comercios
            .Where(c => c.IdTipoComercio == TipoComercioVeterinaria && c.IdEstadoSolicitud == EstadoComercioAprobado)
            .Select(c => c.IdComercio)
            .ToListAsync();

        var responsables = await (
            from c in _context.Comercios
            join p in _context.PersonasLegales on c.IdPersonaLegal equals p.IdPersonaLegal
            where idsVeterinarias.Contains(c.IdComercio)
            select p.IdUsuario
        ).ToListAsync();

        var funcionarios = await _context.ComerciosFuncionarios
            .Where(f => idsVeterinarias.Contains(f.IdComercio) && f.Activo)
            .Select(f => f.IdUsuario)
            .ToListAsync();

        foreach (var idUsuario in responsables.Union(funcionarios).Distinct())
            await _notificaciones.CrearAsync(idUsuario, titulo, mensaje, tipo, "Emergencia", referenciaId);
    }
}
