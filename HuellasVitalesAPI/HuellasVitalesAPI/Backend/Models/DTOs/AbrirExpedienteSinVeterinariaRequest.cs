using System.ComponentModel.DataAnnotations;

namespace HuellasVitalesAPI.Backend.Models.DTOs;

public class AbrirExpedienteSinVeterinariaRequest
{
    [Required, Range(1, int.MaxValue)]
    public int IdMascota { get; set; }
}
