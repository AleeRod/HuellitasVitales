using HuellasVitalesAPI.Backend.Models.DTOs;
using HuellasVitalesAPI.Backend.Models.Entidades;
using HuellitasVitalesAPI.Data;
using Microsoft.EntityFrameworkCore;

namespace HuellitasVitalesAPI.Services
{
    public class AgendaService
    {
        private readonly ConexionDB _context;
        private readonly ILogger<AgendaService> _logger;

        public AgendaService(ConexionDB context, ILogger<AgendaService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<(bool Exito, string Mensaje, DisponibilidadDTO? Datos, int Codigo)> ObtenerDisponibilidadAsync(
            int idVeterinario, DateTime fecha, int duracionMinutos)
        {
            try
            {
                if (idVeterinario <= 0)
                    return (false, "El ID del veterinario es inválido.", null, 400);

                if (duracionMinutos <= 0)
                    return (false, "La duración del servicio debe ser mayor a cero.", null, 400);

                // 1. Extraer el día de la semana (0=Domingo, 1=Lunes ... 6=Sábado)
                short diaSemana = (short)fecha.DayOfWeek;

                // 2. Consultar el horario laboral del veterinario para ese día usando Entity Framework
                var horario = await _context.Set<HorarioVeterinario>()
                    .FirstOrDefaultAsync(h => h.IdVeterinario == idVeterinario 
                                           && h.DiaSemana == diaSemana 
                                           && h.Activo);

                var disponibilidad = new DisponibilidadDTO
                {
                    Fecha = fecha.ToString("yyyy-MM-dd"),
                    HorasDisponibles = new List<string>()
                };

                if (horario == null)
                {
                    // Si no labora ese día, devolvemos la estructura limpia con lista vacía
                    return (true, "El veterinario no labora en este día.", disponibilidad, 200);
                }

                // 3. Consultar las citas ocupadas ese día (Excluyendo canceladas, IdEstadoCita = 3)
                var citasOcupadas = await _context.Set<Cita>()
                    .Where(c => c.IdVeterinario == idVeterinario 
                             && c.Fecha.Date == fecha.Date 
                             && c.IdEstadoCita != 3)
                    .Select(c => new { c.HoraInicio, c.HoraFin })
                    .ToListAsync();

                // 4. Calcular los bloques de tiempo (intervalos de 30 minutos)
                TimeSpan intervalo = TimeSpan.FromMinutes(30);
                TimeSpan duracionServicio = TimeSpan.FromMinutes(duracionMinutos);

                for (TimeSpan slotActual = horario.HoraInicio; slotActual.Add(duracionServicio) <= horario.HoraFin; slotActual = slotActual.Add(intervalo))
                {
                    TimeSpan slotFin = slotActual.Add(duracionServicio);

                    // Validar cruces de horario con citas existentes
                    bool choca = citasOcupadas.Any(cita => 
                        (slotActual < cita.HoraFin) && (slotFin > cita.HoraInicio)
                    );

                    if (!choca)
                    {
                        disponibilidad.HorasDisponibles.Add(slotActual.ToString(@"hh\:mm"));
                    }
                }

                return (true, "Disponibilidad consultada con éxito.", disponibilidad, 200);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al consultar la disponibilidad para el veterinario {IdVeterinario} en la fecha {Fecha}", idVeterinario, fecha);
                return (false, "Ocurrió un error interno al consultar la disponibilidad.", null, 500);
            }
        }
    }
}