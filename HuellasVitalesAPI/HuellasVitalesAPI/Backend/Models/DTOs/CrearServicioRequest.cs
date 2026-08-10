using System.ComponentModel.DataAnnotations;

namespace HuellasVitalesAPI.Backend.Models.DTOs
{
    public class CrearServicioRequest
    {
        // Comercio (clínica veterinaria) donde se ofrecerá el servicio.
        // Mismo criterio que en CrearProductoRequest: se indica explícitamente.
        [Required(ErrorMessage = "Debes indicar el comercio donde se registrará el servicio.")]
        [Range(1, int.MaxValue, ErrorMessage = "El comercio indicado no es válido.")]
        public int IdComercio { get; set; }

        [Required(ErrorMessage = "El nombre del servicio es obligatorio.")]
        [StringLength(150, MinimumLength = 3, ErrorMessage = "El nombre debe tener entre 3 y 150 caracteres.")]
        public string Nombre { get; set; } = string.Empty;

        [StringLength(500, ErrorMessage = "La descripción no puede superar los 500 caracteres.")]
        public string? Descripcion { get; set; }

        [Required(ErrorMessage = "La duración del servicio es obligatoria.")]
        [Range(1, 1440, ErrorMessage = "La duración debe estar entre 1 y 1440 minutos.")]
        public int DuracionMinutos { get; set; }

        [Required(ErrorMessage = "El precio es obligatorio.")]
        [Range(0.01, 99999999, ErrorMessage = "El precio debe ser mayor que cero.")]
        public decimal Precio { get; set; }

        [Required(ErrorMessage = "El tipo de servicio es obligatorio.")]
        [Range(1, short.MaxValue, ErrorMessage = "El tipo de servicio indicado no es válido.")]
        public short IdTipoServicio { get; set; }
    }
}
