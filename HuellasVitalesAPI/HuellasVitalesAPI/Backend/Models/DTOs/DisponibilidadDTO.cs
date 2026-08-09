namespace HuellasVitalesAPI.Backend.Models.DTOs
{
    public class DisponibilidadDTO
    {
        public string Fecha { get; set; } = string.Empty;
        public List<string> HorasDisponibles { get; set; } = new List<string>();
    }
}