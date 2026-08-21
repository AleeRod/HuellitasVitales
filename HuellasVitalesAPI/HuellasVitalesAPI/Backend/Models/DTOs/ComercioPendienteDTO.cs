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

        // Campos extra para el modal de "ver más" del panel de Solicitudes — todos ya
        // disponibles en el join de ListarPendientesAsync, ninguno requiere una consulta nueva.
        public string TipoPersona { get; set; } = string.Empty; // "Física" o "Jurídica"
        public string? Identificacion { get; set; }
        public string NombreSolicitante { get; set; } = string.Empty;
        public string ApellidosSolicitante { get; set; } = string.Empty;
        public string? CorreoSolicitante { get; set; }
        public string? TelefonoSolicitante { get; set; }
    }
}