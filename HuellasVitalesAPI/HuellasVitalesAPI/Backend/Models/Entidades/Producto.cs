using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HuellasVitalesAPI.Backend.Models.Entidades
{
    [Table("PRODUCTO")]
    public class Producto
    {
        [Key]
        [Column("IDPRODUCTO")]
        public int IdProducto { get; set; }

        [Column("IDCOMERCIO")]
        public int IdComercio { get; set; }

        [Column("IDCATEGORIA")]
        public byte IdCategoria { get; set; }

        [Column("IDESPECIE")]
        public byte? IdEspecie { get; set; }

        [Column("IDMARCA")]
        public int? IdMarca { get; set; }

        [Column("SKU")]
        public string? Sku { get; set; }

        [Column("NOMBRE")]
        public string Nombre { get; set; } = string.Empty;

        [Column("DESCRIPCION")]
        public string? Descripcion { get; set; }

        [Column("PRECIO")]
        public decimal Precio { get; set; }

        [Column("PRECIO_DESCUENTO")]
        public decimal? PrecioDescuento { get; set; }

        [Column("STOCK")]
        public int? Stock { get; set; }

        [Column("IMAGEN_URL")]
        public string? ImagenUrl { get; set; }

        [Column("ACTIVO")]
        public bool Activo { get; set; }

        [Column("FECHA_CREACION")]
        public DateTime FechaCreacion { get; set; }
    }
}