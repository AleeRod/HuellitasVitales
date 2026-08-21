using System.Net;
using System.Net.Mail;

namespace HuellitasVitalesAPI.Services
{
    public interface IEmailService
    {
        /// <summary>
        /// Envía el correo de verificación para restablecer la contraseña. El enlace ya trae el
        /// token — hacer clic en él es lo que "verifica que es él" antes de dejarlo definir una
        /// contraseña nueva.
        /// </summary>
        Task EnviarCorreoRecuperacionAsync(string correoDestino, string nombreUsuario, string enlaceRecuperacion);
    }

    /// <summary>
    /// Envío de correo por SMTP genérico (Gmail, Outlook, o cualquier relay que acepte
    /// usuario/contraseña) usando <see cref="SmtpClient"/> — ya viene con .NET, no hace falta
    /// agregar ningún paquete nuevo. Las credenciales viven en `Smtp` de appsettings.json y NO
    /// vienen cargadas con nada real: hay que completarlas a mano (ver Docs/04-Notas/MEJORAS.md)
    /// para que el envío funcione de verdad.
    /// </summary>
    public class EmailService : IEmailService
    {
        private readonly IConfiguration _config;
        private readonly ILogger<EmailService> _logger;

        public EmailService(IConfiguration config, ILogger<EmailService> logger)
        {
            _config = config;
            _logger = logger;
        }

        public async Task EnviarCorreoRecuperacionAsync(string correoDestino, string nombreUsuario, string enlaceRecuperacion)
        {
            var host = _config["Smtp:Host"];
            var puerto = _config.GetValue<int>("Smtp:Port", 587);
            var usaSsl = _config.GetValue<bool>("Smtp:UsaSsl", true);
            var usuarioSmtp = _config["Smtp:Usuario"];
            var passwordSmtp = _config["Smtp:Password"];
            var remitenteNombre = _config["Smtp:RemitenteNombre"] ?? "Huellitas Vitales";
            var remitenteCorreo = _config["Smtp:RemitenteCorreo"] ?? usuarioSmtp;

            if (string.IsNullOrWhiteSpace(host) || string.IsNullOrWhiteSpace(usuarioSmtp) || string.IsNullOrWhiteSpace(passwordSmtp))
            {
                // No hay credenciales SMTP configuradas todavía — no revienta el flujo (el
                // endpoint sigue respondiendo genérico, sin revelar si el correo existe), pero
                // sí queda bien visible en el log que el correo real nunca salió.
                _logger.LogWarning(
                    "No se pudo enviar el correo de recuperación a {Correo}: faltan credenciales SMTP en appsettings.json (Smtp:Host/Usuario/Password).",
                    correoDestino);
                return;
            }

            var asunto = "Recuperá tu contraseña — Huellitas Vitales";
            var cuerpoHtml = $@"
                <div style=""font-family: Arial, sans-serif; background:#FEFAE0; padding: 32px;"">
                  <div style=""max-width: 480px; margin: 0 auto; background:#ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 8px 24px rgba(0,0,0,0.08);"">
                    <div style=""background: linear-gradient(135deg, #1B4332 0%, #2d6a4f 100%); padding: 24px; text-align:center;"">
                      <h1 style=""color:#ffffff; margin:0; font-size: 20px;"">🐾 Huellitas Vitales</h1>
                    </div>
                    <div style=""padding: 28px 24px;"">
                      <p style=""color:#1B4332; font-size: 16px;"">Hola{(string.IsNullOrWhiteSpace(nombreUsuario) ? "" : $", {nombreUsuario}")},</p>
                      <p style=""color:#4a5568; font-size: 14px; line-height: 1.5;"">
                        Recibimos una solicitud para restablecer tu contraseña. Si fuiste vos, hacé clic en el botón
                        de abajo para verificar que sos el dueño de esta cuenta y elegir una contraseña nueva.
                      </p>
                      <div style=""text-align:center; margin: 28px 0;"">
                        <a href=""{enlaceRecuperacion}""
                           style=""background:#52B788; color:#ffffff; text-decoration:none; padding: 14px 28px; border-radius: 12px; font-weight:bold; display:inline-block;"">
                          Verificar y restablecer contraseña
                        </a>
                      </div>
                      <p style=""color:#718096; font-size: 12px; line-height: 1.5;"">
                        Este enlace vence en 30 minutos. Si no fuiste vos quien lo solicitó, podés ignorar este
                        correo con tranquilidad: tu contraseña actual sigue siendo válida.
                      </p>
                    </div>
                  </div>
                </div>";

            using var mensaje = new MailMessage
            {
                From = new MailAddress(remitenteCorreo!, remitenteNombre),
                Subject = asunto,
                Body = cuerpoHtml,
                IsBodyHtml = true
            };
            mensaje.To.Add(correoDestino);

            using var cliente = new SmtpClient(host, puerto)
            {
                EnableSsl = usaSsl,
                Credentials = new NetworkCredential(usuarioSmtp, passwordSmtp)
            };

            try
            {
                await cliente.SendMailAsync(mensaje);
            }
            catch (Exception ex)
            {
                // Mismo criterio que arriba: no filtra el error al usuario (evita revelar si el
                // correo existe o no), pero queda registrado para quien esté operando el backend.
                _logger.LogError(ex, "Error al enviar el correo de recuperación a {Correo}", correoDestino);
            }
        }
    }
}
