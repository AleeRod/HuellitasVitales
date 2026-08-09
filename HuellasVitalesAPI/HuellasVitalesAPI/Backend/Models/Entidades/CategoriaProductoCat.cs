using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HuellasVitalesAPI.Backend.Models.Entidades
{
    [Table("CATEGORIA_PRODUCTO_CAT")]
    public class CategoriaProductoCat
    {
        [Key]
        [Column("IdCategoria")]
        public byte IdCategoria { get; set; }

        [Column("Nombre")]
        public string Nombre { get; set; } = string.Empty;
    }
}