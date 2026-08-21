using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HuellasVitalesAPI.Backend.Models.Entidades
{
    [Table("ORDEN")]
    public class Orden
    {
        [Key]
        [Column("IdOrden")]
        public int IdOrden { get; set; }

        // Igual que CARRITO, esta tabla guarda el usuario como bigint.
        [Column("IdUsuario")]
        public long IdUsuario { get; set; }

        [Column("IdEstadoOrden")]
        public short IdEstadoOrden { get; set; }

        [Column("Total")]
        public decimal Total { get; set; }

        [Column("FechaOrden")]
        public DateTime FechaOrden { get; set; }

        // Método de pago elegido en la simulación de checkout ("tarjeta", "sinpe" o
        // "efectivo"). Nullable porque las órdenes creadas antes de esta columna no lo tienen.
        [Column("MetodoPago")]
        public string? MetodoPago { get; set; }

        public List<OrdenDetalle> Detalles { get; set; } = new();
    }
}
