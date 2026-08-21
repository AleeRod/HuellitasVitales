using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HuellasVitalesAPI.Backend.Models.Entidades;

[Table("ATENCION_EXTERNA")]
public class AtencionExterna
{
    [Key] public int IdAtencionExterna { get; set; }
    public int IdExpediente { get; set; }
    public int IdUsuarioRegistro { get; set; }
    public string NombreVeterinaria { get; set; } = string.Empty;
    public string? NombreProfesional { get; set; }
    public DateTime FechaAtencion { get; set; }
    public string Motivo { get; set; } = string.Empty;
    public string? Diagnostico { get; set; }
    public string? Tratamiento { get; set; }
    public DateTime FechaRegistro { get; set; } = DateTime.UtcNow;
}
