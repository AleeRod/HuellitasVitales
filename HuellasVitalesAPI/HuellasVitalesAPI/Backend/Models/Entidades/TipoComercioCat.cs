using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HuellasVitalesAPI.Backend.Models.Entidades
{
    [Table("TIPO_COMERCIO_CAT")]
    public class TipoComercioCat
    {
        [Key]
        public byte IdTipoComercio { get; set; }

        public string Nombre { get; set; } = string.Empty;
    }
}