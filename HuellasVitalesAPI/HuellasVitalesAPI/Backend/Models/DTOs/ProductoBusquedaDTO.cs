namespace HuellasVitalesAPI.Backend.Models.DTOs
{
    public class ProductoBusquedaDTO
    {
        public int IdProducto { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public decimal Precio { get; set; }
        public decimal? PrecioDescuento { get; set; }
        public int? Stock { get; set; }
        public bool Agotado { get; set; }
        public string? ImagenUrl { get; set; }
        public int IdComercio { get; set; }
        public string NombreComercio { get; set; } = string.Empty;
    }
}