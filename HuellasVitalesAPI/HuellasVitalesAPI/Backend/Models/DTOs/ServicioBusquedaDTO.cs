namespace HuellasVitalesAPI.Backend.Models.DTOs
{
    public class ServicioBusquedaDTO
    {
        public int IdServicio { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public string TipoServicio { get; set; } = string.Empty;
        public decimal Precio { get; set; }
        public int DuracionMinutos { get; set; }
        public int IdComercio { get; set; }
        public string NombreComercio { get; set; } = string.Empty;
    }
}