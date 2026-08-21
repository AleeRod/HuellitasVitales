namespace HuellasVitalesAPI.Backend.Models.DTOs
{
    /// <summary>
    /// Pide el enlace de verificación por correo para cambiar la contraseña (ver
    /// UsuarioController.SolicitarVerificacionPassword / UsuarioService.
    /// ValidarPasswordActualParaVerificacionAsync). Reemplaza a CambiarPasswordDTO: ya no se
    /// manda la contraseña nueva acá — esa se define después, verificado el correo, con el
    /// mismo POST /api/password/restablecer que usa "olvidé mi contraseña".
    /// </summary>
    public class SolicitarVerificacionPasswordDTO
    {
        // Solo obligatoria si la cuenta ya tiene una contraseña local. Cuentas creadas solo por
        // Google/Facebook no la tienen todavía, y este mismo endpoint les permite pedir el
        // enlace para establecer una por primera vez sin este campo.
        public string? PasswordActual { get; set; }
    }
}
