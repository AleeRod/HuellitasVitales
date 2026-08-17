using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HuellasVitalesAPI.Backend.Models.Entidades
{
    [Table("HORARIO_VETERINARIO")]
    public class HorarioVeterinario
    {
        [Key]
        [Column("IdHorario")]
        public int IdHorario { get; set; }

        [Column("IdVeterinario")]
        public int IdVeterinario { get; set; }

        [Column("DiaSemana")]
        public short DiaSemana { get; set; } // 0=Domingo, 1=Lunes...

        [Column("HoraInicio")]
        public TimeSpan HoraInicio { get; set; }

        [Column("HoraFin")]
        public TimeSpan HoraFin { get; set; }

        [Column("Activo")]
        public bool Activo { get; set; } = true;
    }
}