using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
namespace HuellasVitalesAPI.Backend.Models.Entidades;
[Table("EMERGENCIA")]
public class Emergencia
{
    [Key] public int IdEmergencia { get; set; }
    public int IdExpediente { get; set; }
    public int IdUsuarioSolicitante { get; set; }
    public int? IdComercio { get; set; }
    public int? IdVeterinario { get; set; }
    public string Estado { get; set; } = "Solicitada";
    public string Ubicacion { get; set; } = string.Empty;
    public string Motivo { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public DateTime FechaSolicitud { get; set; } = DateTime.UtcNow;
    public DateTime? FechaInicio { get; set; }
    public DateTime? FechaFinalizacion { get; set; }
    public string? Diagnostico { get; set; }
    public string? Tratamiento { get; set; }
    public bool EsAtencionExterna { get; set; }
    public string? NombreVeterinarioExterno { get; set; }
    public string? NombreClinicaExterna { get; set; }
}
