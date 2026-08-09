using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HuellasVitalesAPI.Backend.Models.Entidades
{
    [Table("CITA")]
    public class Cita
    {
        [Key]
        [Column("IdCita")]
        public int IdCita { get; set; }

        [Column("IdUsuario")]
        public int IdUsuario { get; set; }

        [Column("IdMascota")]
        public int IdMascota { get; set; }

        [Column("IdVeterinario")]
        public int IdVeterinario { get; set; }

        [Column("IdServicio")]
        public int IdServicio { get; set; }

        [Column("IdEstadoCita")]
        public short IdEstadoCita { get; set; } = 1;

        [Column("Fecha")]
        public DateTime Fecha { get; set; }

        [Column("HoraInicio")]
        public TimeSpan HoraInicio { get; set; }

        [Column("HoraFin")]
        public TimeSpan HoraFin { get; set; }

        [Column("Notas")]
        public string? Notas { get; set; }

        [Column("FechaCreacion")]
        public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;
    }
}