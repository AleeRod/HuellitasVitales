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

        // Clínica veterinaria (COMERCIO) donde ejerce este veterinario. Nullable porque
        // los registros existentes antes de esta columna no tienen comercio asignado aún.
        // Requiere que la columna "IdComercio" exista físicamente en VETERINARIO en Supabase.
        public int? IdComercio { get; set; }
    }
}