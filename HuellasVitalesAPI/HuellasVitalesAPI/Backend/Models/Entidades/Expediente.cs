using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HuellasVitalesAPI.Backend.Models.Entidades;

[Table("EXPEDIENTE")]
public class Expediente
{
    [Key]
    public int IdExpediente { get; set; }
    public int IdMascota { get; set; }
    public int IdComercioActual { get; set; }
    public DateTime FechaApertura { get; set; } = DateTime.UtcNow;
    public bool Activo { get; set; } = true;
}
