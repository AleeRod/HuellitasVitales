using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HuellasVitalesAPI.Backend.Models.Entidades
{
    [Table("COMERCIO_FUNCIONARIO")]
    public class ComercioFuncionario
    {
        [Key]
        public int IdComercioFuncionario { get; set; }

        public int IdComercio { get; set; }

        public int IdUsuario { get; set; }

        public short IdCargo { get; set; }

        public bool Activo { get; set; } = true;

        [Column("FECHA_INGRESO")]
        public DateTime FechaIngreso { get; set; } = DateTime.UtcNow;
    }
}