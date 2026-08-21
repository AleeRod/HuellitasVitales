using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HuellasVitalesAPI.Backend.Models.Entidades;

[Table("EXPEDIENTE_COMERCIO")]
public class ExpedienteComercio
{
    [Key]
    public int IdExpedienteComercio { get; set; }
    public int IdExpediente { get; set; }
    public int IdComercio { get; set; }
    public bool PuedeConsultar { get; set; } = true;
    public bool PuedeModificar { get; set; }
    public DateTime FechaDesde { get; set; } = DateTime.UtcNow;
    public DateTime? FechaHasta { get; set; }
}
