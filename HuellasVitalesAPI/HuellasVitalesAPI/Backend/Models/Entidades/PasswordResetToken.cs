using System.ComponentModel.DataAnnotations;

namespace HuellasVitalesAPI.Backend.Models.Entidades
{
    public class PasswordResetToken
    {
        [Key]
        public int Id { get; set; }

        public int IdUsuario { get; set; }

        public string TokenHash { get; set; } = string.Empty;

        public DateTime FechaExpiracion { get; set; }

        public bool Usado { get; set; } = false;
    }
}