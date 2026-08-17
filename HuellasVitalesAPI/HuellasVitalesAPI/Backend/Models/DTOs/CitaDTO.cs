using System;

namespace HuellasVitalesAPI.Backend.Models.DTOs
{
    public class CitaDTO
    {
        public int IdCita { get; set; }
        public int IdMascota { get; set; }
        public string NombreMascota { get; set; } = string.Empty;
        public string Especie { get; set; } = string.Empty;
        public string NombreCliente { get; set; } = string.Empty;
        public int IdVeterinario { get; set; }
        public string NombreVeterinario { get; set; } = string.Empty;
        public int IdServicio { get; set; }
        public string NombreServicio { get; set; } = string.Empty;
        public int IdTipoServicio { get; set; }
        public short IdEstadoCita { get; set; }
        public string EstadoCita { get; set; } = string.Empty;
        public DateTime Fecha { get; set; }
        public TimeSpan HoraInicio { get; set; }
        public TimeSpan HoraFin { get; set; }
        public string? Notas { get; set; }
    }
}