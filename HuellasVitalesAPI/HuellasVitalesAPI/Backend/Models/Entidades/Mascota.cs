using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HuellasVitalesAPI.Backend.Models.Entidades
{
    [Table("MASCOTA")]
    public class Mascota
    {
        [Key]
        [Column("IdMascota")]
        public int IdMascota { get; set; }

        [Column("IdUsuario")]
        public int IdUsuario { get; set; }

        [Column("Nombre")]
        public string Nombre { get; set; } = string.Empty;

        [Column("IdEspecie")]
        public short? IdEspecie { get; set; }

        [Column("Raza")]
        public string? Raza { get; set; }

        [Column("FechaNacimiento")]
        public DateTime? FechaNacimiento { get; set; }

        [Column("Activo")]
        public bool Activo { get; set; } = true;
    }
}