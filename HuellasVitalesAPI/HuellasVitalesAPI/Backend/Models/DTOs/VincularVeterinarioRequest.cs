using System.ComponentModel.DataAnnotations;

namespace HuellasVitalesAPI.Backend.Models.DTOs
{
    public class VincularVeterinarioRequest
    {
        [Required(ErrorMessage = "Debes indicar la veterinaria.")]
        [Range(1, int.MaxValue, ErrorMessage = "La veterinaria indicada no es válida.")]
        public int IdComercio { get; set; }

        [Required(ErrorMessage = "El correo del veterinario es obligatorio.")]
        [EmailAddress(ErrorMessage = "El correo indicado no es válido.")]
        public string Correo { get; set; } = string.Empty;

        [StringLength(150, ErrorMessage = "La especialidad no puede superar los 150 caracteres.")]
        public string? Especialidad { get; set; }

        [StringLength(500, ErrorMessage = "La descripción no puede superar los 500 caracteres.")]
        public string? Descripcion { get; set; }
    }
}
