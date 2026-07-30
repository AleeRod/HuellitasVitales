using System.ComponentModel.DataAnnotations;

namespace HuellasVitalesAPI.Backend.Models.Entidades
{
    public class Veterinario
    {
        [Key]
        public int IdVeterinario { get; set; }
        public int IdUsuario { get; set; }
        public string? Especialidad { get; set; }
        public string? Descripcion { get; set; }
    }
}