using System.ComponentModel.DataAnnotations;

namespace HuellasVitalesAPI.Backend.Models.DTOs
{
    public class RestablecerPasswordDTO
    {
        [Required]
        public string Token { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        public string Correo { get; set; } = string.Empty;

        [Required]
        [MinLength(8)]
        public string NuevaPassword { get; set; } = string.Empty;
    }
}