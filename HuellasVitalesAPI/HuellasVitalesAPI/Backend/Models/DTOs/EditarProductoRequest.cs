using System.ComponentModel.DataAnnotations;

namespace HuellasVitalesAPI.Backend.Models.DTOs
{
    public class EditarProductoRequest
    {
        [Required(ErrorMessage = "La categoría es obligatoria.")]
        [Range(1, 255, ErrorMessage = "La categoría indicada no es válida.")]
        public byte IdCategoria { get; set; }

        public byte? IdEspecie { get; set; }

        public int? IdMarca { get; set; }

        [StringLength(50, ErrorMessage = "El SKU no puede superar los 50 caracteres.")]
        public string? Sku { get; set; }

        [Required(ErrorMessage = "El nombre del producto es obligatorio.")]
        [StringLength(150, MinimumLength = 3, ErrorMessage = "El nombre debe tener entre 3 y 150 caracteres.")]
        public string Nombre { get; set; } = string.Empty;

        [StringLength(500, ErrorMessage = "La descripción no puede superar los 500 caracteres.")]
        public string? Descripcion { get; set; }

        [Required(ErrorMessage = "El precio es obligatorio.")]
        [Range(0.01, 99999999, ErrorMessage = "El precio debe ser mayor que cero.")]
        public decimal Precio { get; set; }

        [Range(0.01, 99999999, ErrorMessage = "El precio de descuento debe ser mayor que cero.")]
        public decimal? PrecioDescuento { get; set; }

        // Nulo = stock ilimitado / no controlado
        [Range(0, int.MaxValue, ErrorMessage = "El stock no puede ser negativo.")]
        public int? Stock { get; set; }

        // Sin [Url] para permitir rutas relativas del servidor (/uploads/...)
        [StringLength(300, ErrorMessage = "La ruta de la imagen no puede superar los 300 caracteres.")]
        public string? ImagenUrl { get; set; }
    }
}