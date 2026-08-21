namespace HuellasVitalesAPI.Backend.Models.DTOs
{
    // Vista de una cita para el panel de Administración: a diferencia de CitaDTO (usado por el
    // propio veterinario o cliente, que ya conocen su propio nombre), esta expone también el
    // nombre del veterinario y de la veterinaria (COMERCIO), porque el admin ve citas de toda
    // la plataforma, no de un solo profesional.
    public class CitaAdminDTO
    {
        public int IdCita { get; set; }
        public DateTime Fecha { get; set; }
        public TimeSpan HoraInicio { get; set; }
        public TimeSpan HoraFin { get; set; }
        public short IdEstadoCita { get; set; }
        public string EstadoCita { get; set; } = string.Empty;
        public int IdMascota { get; set; }
        public string NombreMascota { get; set; } = string.Empty;
        public string NombreDueno { get; set; } = string.Empty;
        public int IdVeterinario { get; set; }
        public string NombreVeterinario { get; set; } = string.Empty;
        public int IdServicio { get; set; }
        public string NombreServicio { get; set; } = string.Empty;
        public int IdComercio { get; set; }
        public string NombreComercio { get; set; } = string.Empty;
        public string? Notas { get; set; }
    }
}
