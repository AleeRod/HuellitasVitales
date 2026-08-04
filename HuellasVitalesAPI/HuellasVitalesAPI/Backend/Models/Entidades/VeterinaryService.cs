using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using HuellasVitalesAPI.Backend.Models.Enums;

namespace HuellasVitalesAPI.Backend.Models.Entidades
{
    /// <summary>
    /// Servicio del catálogo de la clínica (consulta, grooming, procedimiento, etc.).
    /// Del que dependen la agenda de citas y el buscador.
    /// </summary>
    [Table("SERVICIO_VETERINARIO")]
    public class VeterinaryService
    {
        [Key]
        public int IdServicioVeterinario { get; set; }

        [Required]
        [MaxLength(120)]
        [Column("NOMBRE")]
        public string Nombre { get; set; } = string.Empty;

        [MaxLength(500)]
        [Column("DESCRIPCION")]
        public string? Descripcion { get; set; }

        [Column("DURACION_MINUTOS")]
        public int DuracionMinutos { get; set; }

        [Column("PRECIO", TypeName = "decimal(10,2)")]
        public decimal Precio { get; set; }

        // Se persiste como int (valor ordinal del enum). Ver TipoServicio.
        [Column("TIPO")]
        public TipoServicio Tipo { get; set; }

        // Borrado lógico: un servicio con IsActive = false ya no se ofrece al agendar
        // citas nuevas, pero las citas históricas que lo referencian se conservan intactas.
        [Column("IS_ACTIVE")]
        public bool IsActive { get; set; } = true;

        [Column("FECHA_CREACION")]
        public DateTime FechaCreacion { get; set; } = DateTime.Now;
    }
}
