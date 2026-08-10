using System.ComponentModel.DataAnnotations;

namespace HuellasVitalesAPI.Backend.Models.DTOs
{
    public class SolicitarRecuperacionDTO
    {
        [Required]
        [EmailAddress]
        public string Correo { get; set; } = string.Empty;
    }
}