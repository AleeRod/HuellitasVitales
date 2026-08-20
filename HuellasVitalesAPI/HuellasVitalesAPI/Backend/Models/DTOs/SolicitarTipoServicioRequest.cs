using System.ComponentModel.DataAnnotations;

namespace HuellasVitalesAPI.Backend.Models.DTOs
{
    public class SolicitarTipoServicioRequest
    {
        [Required(ErrorMessage = "El nombre del tipo de servicio es obligatorio.")]
        [StringLength(100, MinimumLength = 3, ErrorMessage = "El nombre debe tener entre 3 y 100 caracteres.")]
        public string Nombre { get; set; } = string.Empty;

        // Veterinaria desde la que se solicita, para que el administrador tenga contexto
        // al revisarla.
        [Required(ErrorMessage = "Debes indicar desde qué veterinaria solicitás el tipo de servicio.")]
        [Range(1, int.MaxValue, ErrorMessage = "La veterinaria indicada no es válida.")]
        public int IdComercio { get; set; }
    }
}
