using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HuellasVitalesAPI.Backend.Models.Entidades
{
    [Table("ORDEN_DETALLE")]
    public class OrdenDetalle
    {
        [Key]
        [Column("IdOrdenDetalle")]
        public int IdOrdenDetalle { get; set; }

        [Column("IdOrden")]
        public int IdOrden { get; set; }

        [Column("IdProducto")]
        public int IdProducto { get; set; }

        [Column("Cantidad")]
        public int Cantidad { get; set; }

        // Precio con el que se cobró, calculado en el servidor al comprar.
        [Column("PrecioUnitario")]
        public decimal PrecioUnitario { get; set; }

        [ForeignKey("IdOrden")]
        public virtual Orden? Orden { get; set; }
    }
}
