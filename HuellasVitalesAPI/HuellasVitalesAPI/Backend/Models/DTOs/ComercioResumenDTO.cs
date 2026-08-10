namespace HuellasVitalesAPI.Backend.Models.DTOs
{
    public class ComercioResumenDTO
    {
        public int IdComercio { get; set; }
        public string NombreComercial { get; set; } = string.Empty;
        public byte IdTipoComercio { get; set; }
        public string TipoComercio { get; set; } = string.Empty;
    }
}