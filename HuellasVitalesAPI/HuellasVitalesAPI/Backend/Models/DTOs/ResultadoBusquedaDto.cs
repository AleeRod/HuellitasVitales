namespace HuellasVitalesAPI.Backend.Models.DTOs
{
    public class ResultadoBusquedaDto
    {
        public int IdProducto { get; set; }
        public string NombreProducto { get; set; } = string.Empty;
        public string Descripcion { get; set; } = string.Empty;
        public decimal Precio { get; set; }
        public decimal? PrecioDescuento { get; set; }
        public string ImagenUrl { get; set; } = string.Empty;
        public string Categoria { get; set; } = string.Empty;
        public string NombreComercio { get; set; } = string.Empty;
        public string TipoResultado { get; set; } = string.Empty;
    }
}