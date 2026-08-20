namespace HuellasVitalesAPI.Backend.Models.DTOs
{
    public class SolicitudTipoServicioDTO
    {
        public int IdSolicitudTipoServicio { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public int IdUsuarioSolicitante { get; set; }
        public string NombreSolicitante { get; set; } = string.Empty;
        public int? IdComercio { get; set; }
        public string? NombreComercio { get; set; }
        public short IdEstadoSolicitud { get; set; }
        public string EstadoSolicitud { get; set; } = string.Empty;
        public DateTime FechaSolicitud { get; set; }
        public DateTime? FechaResolucion { get; set; }
    }
}
