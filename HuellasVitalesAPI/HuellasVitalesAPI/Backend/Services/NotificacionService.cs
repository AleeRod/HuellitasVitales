using HuellasVitalesAPI.Backend.Models.Entidades;
using HuellitasVitalesAPI.Data;
using Microsoft.EntityFrameworkCore;

namespace HuellitasVitalesAPI.Services;

public class NotificacionService
{
    private readonly ConexionDB _context;

    public NotificacionService(ConexionDB context) => _context = context;

    public async Task CrearAsync(int idUsuario, string titulo, string mensaje, string tipo,
        string? referenciaTipo = null, int? referenciaId = null)
    {
        _context.Notificaciones.Add(new Notificacion
        {
            IdUsuario = idUsuario,
            Titulo = titulo,
            Mensaje = mensaje,
            Tipo = tipo,
            ReferenciaTipo = referenciaTipo,
            ReferenciaId = referenciaId,
            FechaCreacion = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();
    }

    public async Task<List<Notificacion>> ObtenerPendientesAsync(int idUsuario) =>
        await _context.Notificaciones
            .Where(n => n.IdUsuario == idUsuario)
            .OrderBy(n => n.Leida)
            .ThenByDescending(n => n.FechaCreacion)
            .Take(50)
            .ToListAsync();

    public async Task<bool> MarcarLeidaAsync(int idNotificacion, int idUsuario)
    {
        var notificacion = await _context.Notificaciones
            .FirstOrDefaultAsync(n => n.IdNotificacion == idNotificacion && n.IdUsuario == idUsuario);
        if (notificacion == null) return false;

        notificacion.Leida = true;
        await _context.SaveChangesAsync();
        return true;
    }
}
