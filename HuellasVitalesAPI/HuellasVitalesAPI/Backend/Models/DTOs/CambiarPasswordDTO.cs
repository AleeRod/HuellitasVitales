using System.ComponentModel.DataAnnotations;

namespace HuellasVitalesAPI.Backend.Models.DTOs
{
    public class CambiarPasswordDTO
    {
        // Solo obligatoria si la cuenta ya tiene una contraseña local (ver
        // UsuarioService.CambiarPasswordAsync). Cuentas creadas solo por Google/Facebook no
        // la tienen todavía, y este mismo endpoint les permite establecer una por primera vez.
        public string? PasswordActual { get; set; }

        [Required]
        [MinLength(8)]
        public string PasswordNueva { get; set; } = string.Empty;
    }
}
