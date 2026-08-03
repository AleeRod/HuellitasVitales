using System.ComponentModel.DataAnnotations;

namespace HuellasVitalesAPI.Backend.Models.Entidades
{
    public class TipoServicioCat
    {
        [Key]
        public short IdTipoServicio { get; set; }
        public string Nombre { get; set; } = string.Empty;
    }
}