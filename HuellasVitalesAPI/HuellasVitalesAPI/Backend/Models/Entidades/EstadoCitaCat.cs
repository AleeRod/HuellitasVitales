using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HuellasVitalesAPI.Backend.Models.Entidades
{
    [Table("ESTADO_CITA_CAT")]
    public class EstadoCitaCat
    {
        [Key]
        [Column("IdEstadoCita")]
        public short IdEstadoCita { get; set; }

        [Column("Nombre")]
        public string Nombre { get; set; } = string.Empty;
    }
}