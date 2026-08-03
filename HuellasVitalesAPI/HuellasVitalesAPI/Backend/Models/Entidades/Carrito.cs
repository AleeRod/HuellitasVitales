using System.ComponentModel.DataAnnotations;

namespace HuellasVitalesAPI.Backend.Models.Entidades
{
    public class Carrito
    {
        [Key]
        public int IdCarrito { get; set; }
        public long IdUsuario { get; set; }
        public DateTime FechaCreacion { get; set; }

        public List<CarritoItem> Items { get; set; } = new();
    }
}