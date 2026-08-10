namespace HuellasVitalesAPI.Backend.Models.DTOs
{
    public class ComercioPendienteDTO
    {
        public int IdComercio { get; set; }
        public string NombreComercial { get; set; } = string.Empty;
        public string TipoComercio { get; set; } = string.Empty;
        public string NombrePersonaLegal { get; set; } = string.Empty;
        public string? Direccion { get; set; }
        public string? Telefono { get; set; }
        public DateTime FechaSolicitud { get; set; }
    }
}