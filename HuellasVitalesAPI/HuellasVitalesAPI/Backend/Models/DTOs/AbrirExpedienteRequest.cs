using System.ComponentModel.DataAnnotations;

namespace HuellasVitalesAPI.Backend.Models.DTOs;

public class AbrirExpedienteRequest
{
    [Required, Range(1, int.MaxValue)]
    public int IdMascota { get; set; }

    [Required, Range(1, int.MaxValue)]
    public int IdComercio { get; set; }
}
