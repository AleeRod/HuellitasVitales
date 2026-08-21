using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HuellasVitalesAPI.Backend.Models.Entidades;

[Table("NOTIFICACION")]
public class Notificacion
{
    [Key]
    public int IdNotificacion { get; set; }
    public int IdUsuario { get; set; }
    public string Titulo { get; set; } = string.Empty;
    public string Mensaje { get; set; } = string.Empty;
    public string Tipo { get; set; } = string.Empty;
    public bool Leida { get; set; }
    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;
    public string? ReferenciaTipo { get; set; }
    public int? ReferenciaId { get; set; }
}
