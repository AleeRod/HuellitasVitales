using System;
using System.ComponentModel.DataAnnotations;

namespace HuellasVitalesAPI.Backend.Models.DTOs
{
    public class CrearCitaRequest
    {
        [Required(ErrorMessage = "Debes indicar la mascota para la cita.")]
        [Range(1, int.MaxValue, ErrorMessage = "La mascota indicada no es válida.")]
        public int IdMascota { get; set; }

        [Required(ErrorMessage = "Debes indicar el servicio.")]
        [Range(1, int.MaxValue, ErrorMessage = "El servicio indicado no es válido.")]
        public int IdServicio { get; set; }

        // Opcional: solo obligatorio si el servicio NO tiene veterinario asignado.
        [Range(1, int.MaxValue, ErrorMessage = "El veterinario indicado no es válido.")]
        public int? IdVeterinario { get; set; }

        [Required(ErrorMessage = "La fecha es obligatoria.")]
        public DateTime Fecha { get; set; }

        [Required(ErrorMessage = "La hora de inicio es obligatoria.")]
        public TimeSpan HoraInicio { get; set; }

        [StringLength(500, ErrorMessage = "Las notas no pueden superar los 500 caracteres.")]
        public string? Notas { get; set; }
    }
}