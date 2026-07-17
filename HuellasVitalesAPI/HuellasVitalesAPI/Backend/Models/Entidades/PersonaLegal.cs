using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema; // <-- Ojo a esta importación nueva

namespace HuellasVitalesAPI.Backend.Models.Entidades
{
    [Table("PERSONA_LEGAL")] // Le dice a EF que la tabla en SQL se llama así
    public class PersonaLegal
    {
        [Key]
        public int IdPersonaLegal { get; set; }

        public byte IdTipoPersona { get; set; }

        public string Identificacion { get; set; } = string.Empty;

        [Column("RAZON_SOCIAL")] // <-- Mapea la propiedad con la columna con guion bajo de SQL
        public string? RazonSocial { get; set; }

        public int IdUsuario { get; set; }
    }
}