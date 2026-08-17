using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HuellasVitalesAPI.Backend.Models.Entidades
{
    [Table("ESPECIE_CAT")]
    public class EspecieCat
    {
        [Key]
        [Column("IdEspecie")]
        public byte IdEspecie { get; set; }

        [Column("Nombre")]
        public string Nombre { get; set; } = string.Empty;
    }
}