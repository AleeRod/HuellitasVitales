using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HuellasVitalesAPI.Backend.Models.Entidades
{
    [Table("CARRITO")]
    public class Carrito
    {
        [Key]
        [Column("IdCarrito")]
        public int IdCarrito { get; set; }

        [Column("IdUsuario")]
        public long IdUsuario { get; set; }

        [Column("FechaCreacion")]
        public DateTime FechaCreacion { get; set; }

        public List<CarritoItem> Items { get; set; } = new();
    }
}