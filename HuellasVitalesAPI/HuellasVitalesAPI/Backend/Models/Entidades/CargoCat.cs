using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HuellasVitalesAPI.Backend.Models.Entidades
{
    [Table("CARGO_CAT")]
    public class CargoCat
    {
        [Key]
        public short IdCargo { get; set; }

        public string Nombre { get; set; } = string.Empty;
    }
}