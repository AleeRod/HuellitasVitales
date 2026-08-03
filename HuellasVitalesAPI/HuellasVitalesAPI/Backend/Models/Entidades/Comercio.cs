using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema; // <-- Ojo a esta importación nueva

namespace HuellasVitalesAPI.Backend.Models.Entidades
{
    [Table("COMERCIO")] // Le dice a EF que la tabla en SQL es singular
    public class Comercio
    {
        [Key]
        public int IdComercio { get; set; }

        public int IdPersonaLegal { get; set; }

        public byte IdTipoComercio { get; set; }

        [Column("NOMBRE_COMERCIAL")] // Mapeo con SQL
        public string NombreComercial { get; set; } = string.Empty;

        public string? Direccion { get; set; }

        public string? Telefono { get; set; }

        public byte IdEstadoSolicitud { get; set; } = 1;

        [Column("FECHA_SOLICITUD")] // Mapeo con SQL
        public DateTime FechaSolicitud { get; set; } = DateTime.UtcNow;

        [Column("FECHA_RESOLUCION")] // Mapeo con SQL
        public DateTime? FechaResolucion { get; set; }

        [Column("IDUSUARIO_RESOLVIO")] // Mapeo con SQL
        public int? IdUsuarioResolvio { get; set; }
    }
}