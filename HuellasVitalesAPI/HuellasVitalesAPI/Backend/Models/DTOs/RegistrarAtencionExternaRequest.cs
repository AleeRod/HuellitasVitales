using System.ComponentModel.DataAnnotations;

namespace HuellasVitalesAPI.Backend.Models.DTOs;

public class RegistrarAtencionExternaRequest
{
    [Required, StringLength(200)] public string NombreVeterinaria { get; set; } = string.Empty;
    [StringLength(200)] public string? NombreProfesional { get; set; }
    public DateTime FechaAtencion { get; set; }
    [Required, StringLength(1000)] public string Motivo { get; set; } = string.Empty;
    [StringLength(4000)] public string? Diagnostico { get; set; }
    [StringLength(4000)] public string? Tratamiento { get; set; }
}
