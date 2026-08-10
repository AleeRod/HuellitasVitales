using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HuellasVitalesAPI.Backend.Models.Entidades
{
    public class UsuarioProveedorAuth
    {
        [Key]
        public int IdUsuarioProveedorAuth { get; set; }

        public int IdUsuario { get; set; }

        [Required]
        [MaxLength(50)]
        public string Proveedor { get; set; } = string.Empty;

        [Required]
        [MaxLength(255)]
        public string ProveedorId { get; set; } = string.Empty;

        // Relación con Usuario
        [ForeignKey(nameof(IdUsuario))]
        public Usuario Usuario { get; set; } = null!;
    }
}