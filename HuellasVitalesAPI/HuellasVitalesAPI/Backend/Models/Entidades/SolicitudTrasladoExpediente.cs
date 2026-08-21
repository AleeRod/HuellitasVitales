using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HuellasVitalesAPI.Backend.Models.Entidades;

[Table("SOLICITUD_TRASLADO_EXPEDIENTE")]
public class SolicitudTrasladoExpediente
{
    [Key]
    public int IdSolicitudTraslado { get; set; }
    public int IdExpediente { get; set; }
    public int IdComercioOrigen { get; set; }
    public int IdComercioDestino { get; set; }
    public int IdUsuarioSolicitante { get; set; }
    public string Estado { get; set; } = "Pendiente";
    public string? Motivo { get; set; }
    public string? Respuesta { get; set; }
    public DateTime FechaSolicitud { get; set; } = DateTime.UtcNow;
    public DateTime? FechaResolucion { get; set; }
    public int? IdUsuarioResuelve { get; set; }
}
