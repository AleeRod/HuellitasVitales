using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HuellasVitalesAPI.Backend.Models.Entidades
{
    [Table("SERVICIO")]
    public class Servicio
    {
        [Key]
        [Column("IdServicio")]
        public int IdServicio { get; set; }

        [Column("IdComercio")]
        public int IdComercio { get; set; }

        [Column("Nombre")]
        public string Nombre { get; set; } = string.Empty;

        [Column("Descripcion")]
        public string? Descripcion { get; set; }

        [Column("DuracionMinutos")]
        public int DuracionMinutos { get; set; }

        [Column("Precio")]
        public decimal Precio { get; set; }

        [Column("Activo")]
        public bool Activo { get; set; }

        [Column("IdTipoServicio")]
        public short IdTipoServicio { get; set; }
    }
}
