using System.ComponentModel.DataAnnotations;

namespace HuellasVitalesAPI.Backend.Models.DTOs
{
    public class VincularFuncionarioRequest
    {
        [Required(ErrorMessage = "Debes indicar el comercio.")]
        [Range(1, int.MaxValue, ErrorMessage = "El comercio indicado no es válido.")]
        public int IdComercio { get; set; }

        [Required(ErrorMessage = "El correo del empleado es obligatorio.")]
        [EmailAddress(ErrorMessage = "El correo indicado no es válido.")]
        public string Correo { get; set; } = string.Empty;

        [Required(ErrorMessage = "El cargo es obligatorio.")]
        [Range(1, short.MaxValue, ErrorMessage = "El cargo indicado no es válido.")]
        public short IdCargo { get; set; }
    }
}