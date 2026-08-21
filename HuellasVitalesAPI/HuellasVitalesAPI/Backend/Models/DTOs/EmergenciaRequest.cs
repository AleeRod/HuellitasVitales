using System.ComponentModel.DataAnnotations;
namespace HuellasVitalesAPI.Backend.Models.DTOs;
public class EmergenciaRequest
{
    [Required, StringLength(500)] public string Ubicacion { get; set; } = string.Empty;
    [Required, StringLength(500)] public string Motivo { get; set; } = string.Empty;
    [StringLength(4000)] public string? Descripcion { get; set; }
    public int? IdComercio { get; set; }
}
public class CerrarEmergenciaRequest
{
    [Required, StringLength(4000)] public string Diagnostico { get; set; } = string.Empty;
    [Required, StringLength(4000)] public string Tratamiento { get; set; } = string.Empty;
}
public class RegistrarEmergenciaExternaRequest
{
    [Required, StringLength(200)] public string NombreVeterinarioExterno { get; set; } = string.Empty;
    [Required, StringLength(200)] public string NombreClinicaExterna { get; set; } = string.Empty;
    [Required, StringLength(4000)] public string Diagnostico { get; set; } = string.Empty;
    [Required, StringLength(4000)] public string Tratamiento { get; set; } = string.Empty;
}
