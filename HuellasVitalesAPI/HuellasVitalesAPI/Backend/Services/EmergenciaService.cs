using HuellasVitalesAPI.Backend.Models.DTOs;
using HuellasVitalesAPI.Backend.Models.Entidades;
using HuellitasVitalesAPI.Data;
using Microsoft.EntityFrameworkCore;
namespace HuellitasVitalesAPI.Services;
public class EmergenciaService
{
    private readonly ConexionDB _context; private readonly NotificacionService _notificaciones;
    public EmergenciaService(ConexionDB context, NotificacionService notificaciones) { _context = context; _notificaciones = notificaciones; }
    public async Task<(bool, string, int, object?)> SolicitarAsync(int expedienteId, int usuarioId, EmergenciaRequest r)
    {
        var expediente = await (from e in _context.Expedientes join m in _context.Mascotas on e.IdMascota equals m.IdMascota where e.IdExpediente == expedienteId && e.Activo && m.IdUsuario == usuarioId select e).FirstOrDefaultAsync();
        if (expediente == null) return (false, "No tienes permisos sobre este expediente.", 403, null);
        var comercio = r.IdComercio ?? expediente.IdComercioActual;
        var emergencia = new Emergencia { IdExpediente = expedienteId, IdUsuarioSolicitante = usuarioId, IdComercio = comercio, Ubicacion = r.Ubicacion.Trim(), Motivo = r.Motivo.Trim(), Descripcion = string.IsNullOrWhiteSpace(r.Descripcion) ? null : r.Descripcion.Trim() };
        _context.Emergencias.Add(emergencia); await _context.SaveChangesAsync();
        return (true, "Emergencia registrada. La veterinaria será notificada.", 201, emergencia);
    }
    public async Task<(bool, string, int, object?)> AceptarAsync(int id, int usuarioId, byte rol)
    {
        if (rol is not (1 or 2)) return (false, "Solo un administrador o profesional puede aceptar emergencias.", 403, null);
        var e = await _context.Emergencias.FirstOrDefaultAsync(x => x.IdEmergencia == id);
        if (e == null) return (false, "La emergencia no existe.", 404, null);
        if (e.Estado != "Solicitada") return (false, "La emergencia ya fue gestionada.", 409, null);
        var vet = await _context.Veterinarios.FirstOrDefaultAsync(v => v.IdUsuario == usuarioId);
        if (rol == 2 && vet == null) return (false, "No existe un profesional asociado a tu cuenta.", 403, null);
        e.IdVeterinario = vet?.IdVeterinario; e.Estado = "Aceptada"; await _context.SaveChangesAsync();
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
        if (rol != 1 && (vet == null || e.IdVeterinario != vet.IdVeterinario)) return (false, "No tienes permisos para actualizar esta emergencia.", 403, null);
        e.Estado = siguiente; if (siguiente == "EnAtencion") e.FechaInicio = DateTime.UtcNow; if (siguiente == "Finalizada") { e.FechaFinalizacion = DateTime.UtcNow; e.Diagnostico = cierre!.Diagnostico.Trim(); e.Tratamiento = cierre.Tratamiento.Trim(); }
        await _context.SaveChangesAsync(); await _notificaciones.CrearAsync(e.IdUsuarioSolicitante, "Actualización de emergencia", siguiente == "Finalizada" ? "La atención de emergencia fue finalizada." : "La atención de emergencia inició.", "Emergencia", "Emergencia", e.IdEmergencia);
        return (true, "Estado de emergencia actualizado.", 200, e);
    }
}
