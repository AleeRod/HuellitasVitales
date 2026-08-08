using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HuellasVitalesAPI.Backend.Models.Entidades
{
    [Table("PRODUCTO")]
    public class Producto
    {
        [Key]
        [Column("IdProducto")]
        public int IdProducto { get; set; }

        [Column("IdComercio")]
        public int IdComercio { get; set; }

        [Column("IdCategoria")]
        public byte IdCategoria { get; set; }

        [Column("IdEspecie")]
        public byte? IdEspecie { get; set; }

        [Column("IdMarca")]
        public int? IdMarca { get; set; }

        [Column("Sku")]
        public string? Sku { get; set; }

        [Column("Nombre")]
        public string Nombre { get; set; } = string.Empty;

        [Column("Descripcion")]
        public string? Descripcion { get; set; }

        [Column("Precio")]
        public decimal Precio { get; set; }

        [Column("PRECIO_DESCUENTO")]
        public decimal? PrecioDescuento { get; set; }

        [Column("Stock")]
        public int? Stock { get; set; }

        [Column("IMAGEN_URL")]
        public string? ImagenUrl { get; set; }

        [Column("Activo")]
        public bool Activo { get; set; }

        [Column("FECHA_CREACION")]
        public DateTime FechaCreacion { get; set; }
    }
}
