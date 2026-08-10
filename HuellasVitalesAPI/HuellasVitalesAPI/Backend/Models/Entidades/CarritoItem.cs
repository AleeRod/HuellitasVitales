using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HuellasVitalesAPI.Backend.Models.Entidades
{
    [Table("CARRITO_ITEM")]
    public class CarritoItem
    {
        [Key]
        [Column("IdCarritoItem")]
        public int IdCarritoItem { get; set; }

        [Column("IdCarrito")]
        public int IdCarrito { get; set; }

        [Column("IdProducto")]
        public int IdProducto { get; set; }

        [Column("Cantidad")]
        public int Cantidad { get; set; }

        [Column("PrecioUnitario")]
        public decimal PrecioUnitario { get; set; }

        [Column("FechaAgregado")]
        public DateTime FechaAgregado { get; set; }

        // Relación con Carrito para que EF Core resuelva la clave foránea "CARRITO_ITEM_IdCarrito_fkey"
        [ForeignKey("IdCarrito")]
        public virtual Carrito? Carrito { get; set; }
    }
}