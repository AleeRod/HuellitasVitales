using System.ComponentModel.DataAnnotations;

namespace HuellasVitalesAPI.Backend.Models.Entidades
{
    public class Servicio
    {
        [Key]
        public int IdServicio { get; set; }
        public int IdComercio { get; set; }
        public short IdTipoServicio { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public string? Descripcion { get; set; }
        public int DuracionMinutos { get; set; }
        public decimal Precio { get; set; }
        public bool Activo { get; set; } = true;
    }
}