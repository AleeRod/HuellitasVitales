using System.ComponentModel.DataAnnotations;

namespace HuellasVitalesAPI.Backend.Models.DTOs
{
    public class EditarProductoRequest
    {
        [Required(ErrorMessage = "La categoría es obligatoria.")]
        public byte IdCategoria { get; set; }

        [Required(ErrorMessage = "El nombre es obligatorio.")]
        [StringLength(
            150,
            ErrorMessage = "El nombre no puede superar 150 caracteres."
        )]
        public string Nombre { get; set; } = string.Empty;

        [StringLength(
            1000,
            ErrorMessage = "La descripción no puede superar 1000 caracteres."
        )]
        public string? Descripcion { get; set; }

        [Range(
            0.01,
            999999999.99,
            ErrorMessage = "El precio debe ser mayor que 0."
        )]
        public decimal Precio { get; set; }

        [Range(
            0,
            int.MaxValue,
            ErrorMessage = "El stock no puede ser negativo."
        )]
        public int Stock { get; set; }

        [Url(ErrorMessage = "La imagen debe ser una URL válida.")]
        public string? ImagenUrl { get; set; }

        [Range(
            0,
            999999999.99,
            ErrorMessage = "El precio de descuento no puede ser negativo."
        )]
        public decimal? PrecioDescuento { get; set; }
    }
}