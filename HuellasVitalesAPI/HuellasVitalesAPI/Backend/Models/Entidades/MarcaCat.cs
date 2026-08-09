using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HuellasVitalesAPI.Backend.Models.Entidades
{
    [Table("MARCA_CAT")]
    public class MarcaCat
    {
        [Key]
        [Column("IdMarca")]
        public int IdMarca { get; set; }

        [Column("Nombre")]
        public string Nombre { get; set; } = string.Empty;
    }
}