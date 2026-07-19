using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HuellasVitalesAPI.Backend.Models.Entidades
{
    [Table("CATEGORIA_PRODUCTO_CAT")]
    public class CategoriaProductoCat
    {
        [Key]
        [Column("IDCATEGORIA")]
        public byte IdCategoria { get; set; }

        [Column("NOMBRE")]
        public string Nombre { get; set; } = string.Empty;
    }
}