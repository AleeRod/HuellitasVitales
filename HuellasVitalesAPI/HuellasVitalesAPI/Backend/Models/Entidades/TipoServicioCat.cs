using System.ComponentModel.DataAnnotations;

namespace HuellasVitalesAPI.Backend.Models.Entidades
{
    public class TipoServicioCat
    {
        [Key]
        public int IdTipoServicio { get; set; } // ¡Cambiado de short a int!
        
        public string Nombre { get; set; } = string.Empty;
        
        public bool Activo { get; set; } // ¡Agregado para que haga match exacto con la BD!
    }
}