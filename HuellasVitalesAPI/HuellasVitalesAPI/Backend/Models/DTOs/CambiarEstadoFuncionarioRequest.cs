using System.ComponentModel.DataAnnotations;

namespace HuellasVitalesAPI.Backend.Models.DTOs
{
    public class CambiarEstadoFuncionarioRequest
    {
        [Required]
        public bool Activo { get; set; }
    }
}