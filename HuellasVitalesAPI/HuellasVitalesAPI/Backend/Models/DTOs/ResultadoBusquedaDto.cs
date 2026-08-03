namespace HuellasVitalesAPI.Backend.Models.DTOs
{
    public class ResultadoBusquedaDto
    {
        public int IdProducto { get; set; }
        public string? NombreProducto { get; set; }
        public string? Descripcion { get; set; }
        public decimal Precio { get; set; }
        public decimal? PrecioDescuento { get; set; }
        public string? ImagenUrl { get; set; }
        public string? Categoria { get; set; }
        public string? NombreComercio { get; set; }
        public string? TipoResultado { get; set; }
    }
}