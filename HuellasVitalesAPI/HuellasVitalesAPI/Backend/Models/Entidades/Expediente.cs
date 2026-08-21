using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HuellasVitalesAPI.Backend.Models.Entidades;

[Table("EXPEDIENTE")]
public class Expediente
{
    [Key]
    public int IdExpediente { get; set; }
    public int IdMascota { get; set; }
    // Nullable: una mascota puede tener expediente sin ninguna veterinaria asignada todavía
    // (p. ej. se abrió solo para registrar una atención externa, sin haber tenido nunca una
    // cita ni haber elegido una veterinaria de la plataforma).
    public int? IdComercioActual { get; set; }
    public DateTime FechaApertura { get; set; } = DateTime.UtcNow;
    public bool Activo { get; set; } = true;
}
