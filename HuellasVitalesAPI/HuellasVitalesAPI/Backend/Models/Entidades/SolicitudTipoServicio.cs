using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HuellasVitalesAPI.Backend.Models.Entidades
{
    // Solicitud de un funcionario para dar de alta un nuevo tipo de servicio en el catálogo
    // compartido TIPO_SERVICIO_CAT. Espeja el mismo patrón de solicitud/resolución que ya usa
    // COMERCIO, reutilizando el mismo catálogo ESTADO_SOLICITUD_CAT (1=pendiente, 2=aprobado,
    // 3=rechazado). Se mantiene en su propia tabla en vez de mezclar este flujo dentro de
    // TIPO_SERVICIO_CAT: esa es una tabla *_CAT (catálogo simple), y las solicitudes pendientes
    // o rechazadas nunca deben aparecer mezcladas con los tipos reales del catálogo.
    [Table("SOLICITUD_TIPO_SERVICIO")]
    public class SolicitudTipoServicio
    {
        [Key]
        public int IdSolicitudTipoServicio { get; set; }

        public string Nombre { get; set; } = string.Empty;

        public int IdUsuarioSolicitante { get; set; }

        public int? IdComercio { get; set; }

        public short IdEstadoSolicitud { get; set; }

        public DateTime FechaSolicitud { get; set; }

        public DateTime? FechaResolucion { get; set; }

        public int? IdUsuarioResolvio { get; set; }
    }
}
