namespace HuellasVitalesAPI.Backend.Models.DTOs
{
    public class ComercioPendienteDTO
    {
        public int IdComercio { get; set; }
<<<<<<< HEAD
        public int IdPersonaLegal { get; set; }
        public byte IdTipoComercio { get; set; }
        public string NombreComercial { get; set; } = string.Empty;
        public string? Direccion { get; set; }
        public string? Telefono { get; set; }
        public byte IdEstadoSolicitud { get; set; }
        public string Estado { get; set; } = "Pendiente";
=======
        public string NombreComercial { get; set; } = string.Empty;
        public string TipoComercio { get; set; } = string.Empty;
        public string NombrePersonaLegal { get; set; } = string.Empty;
        public string? Direccion { get; set; }
        public string? Telefono { get; set; }
>>>>>>> feature-GestionCarrito
        public DateTime FechaSolicitud { get; set; }
    }
}