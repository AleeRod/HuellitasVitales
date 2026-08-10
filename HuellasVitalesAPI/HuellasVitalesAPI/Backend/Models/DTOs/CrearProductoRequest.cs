using System.ComponentModel.DataAnnotations;

namespace HuellasVitalesAPI.Backend.Models.DTOs
{
    public class CrearProductoRequest
    {
        // Comercio (almacén) donde se publicará el producto.
        // No se toma del token: un mismo usuario puede tener veterinaria y almacén,
        // por lo que debe indicar explícitamente en cuál está trabajando.
        [Required(ErrorMessage = "Debes indicar el comercio donde se registrará el producto.")]
        [Range(1, int.MaxValue, ErrorMessage = "El comercio indicado no es válido.")]
        public int IdComercio { get; set; }

        [Required(ErrorMessage = "El nombre del producto es obligatorio.")]
        [StringLength(150, MinimumLength = 3, ErrorMessage = "El nombre debe tener entre 3 y 150 caracteres.")]
        public string Nombre { get; set; } = string.Empty;

        [Required(ErrorMessage = "La categoría es obligatoria.")]
        [Range(1, 255, ErrorMessage = "La categoría indicada no es válida.")]
        public byte IdCategoria { get; set; }

        public byte? IdEspecie { get; set; }

        public int? IdMarca { get; set; }

        [StringLength(50, ErrorMessage = "El SKU no puede superar los 50 caracteres.")]
        public string? Sku { get; set; }

        [StringLength(500, ErrorMessage = "La descripción no puede superar los 500 caracteres.")]
        public string? Descripcion { get; set; }

        [Required(ErrorMessage = "El precio es obligatorio.")]
        [Range(0.01, 99999999, ErrorMessage = "El precio debe ser mayor que cero.")]
        public decimal Precio { get; set; }

        [Range(0.01, 99999999, ErrorMessage = "El precio de descuento debe ser mayor que cero.")]
        public decimal? PrecioDescuento { get; set; }

        // Nulo = stock ilimitado / no controlado (la columna admite NULL).
        [Range(0, int.MaxValue, ErrorMessage = "El stock no puede ser negativo.")]
        public int? Stock { get; set; }

        public string? ImagenUrl { get; set; }
    }
}
