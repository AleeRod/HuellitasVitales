using System.Net;
using HuellasVitalesAPI.Backend.Models.DTOs;
using HuellitasVitalesAPI.Services;
using Microsoft.AspNetCore.Mvc;

namespace HuellitasVitalesAPI.Controllers
{
    [Route("api/password")]
    [ApiController]
    public class PasswordController : ControllerBase
    {
        private readonly UsuarioService _usuarioService;
        private readonly IEmailService _emailService;
        private readonly IConfiguration _config;
        private readonly ILogger<PasswordController> _logger;

        public PasswordController(
            UsuarioService usuarioService,
            IEmailService emailService,
            IConfiguration config,
            ILogger<PasswordController> logger)
        {
            _usuarioService = usuarioService;
            _emailService = emailService;
            _config = config;
            _logger = logger;
        }

        // POST api/password/recuperar
        // Antes devolvía el token directo en la respuesta ("TEMPORAL: para probar desde
        // Swagger"), así que cualquiera con el correo de otra persona podía resetear su
        // contraseña sin más verificación. Ahora el token viaja únicamente por correo — hacer
        // clic en el enlace es lo que "verifica que es él" antes de dejarlo definir una
        // contraseña nueva. La respuesta siempre es el mismo mensaje genérico, exista o no ese
        // correo en el sistema (no revela si una cuenta existe).
        [HttpPost("recuperar")]
        public async Task<IActionResult> SolicitarRecuperacion(
            [FromBody] SolicitarRecuperacionDTO dto)
        {
            const string mensajeGenerico = "Si el correo está registrado, te enviamos un enlace para verificar tu identidad y restablecer la contraseña.";

            try
            {
                var (token, nombreUsuario) = await _usuarioService
                    .GenerarTokenRecuperacionAsync(dto.Correo);

                if (token != null)
                {
                    var frontendUrl = _config["Frontend:Url"]?.TrimEnd('/') ?? "http://localhost:5173";
                    var enlace = $"{frontendUrl}/restablecer-password?token={WebUtility.UrlEncode(token)}&correo={WebUtility.UrlEncode(dto.Correo)}";

                    await _emailService.EnviarCorreoRecuperacionAsync(dto.Correo, nombreUsuario ?? string.Empty, enlace);
                }

                return Ok(new { success = true, mensaje = mensajeGenerico });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al procesar la solicitud de recuperación de contraseña.");
                return StatusCode(500, new
                {
                    success = false,
                    mensaje = "Error al procesar la recuperación."
                });
            }
        }

        [HttpPost("restablecer")]
        public async Task<IActionResult> RestablecerPassword(
            [FromBody] RestablecerPasswordDTO dto)
        {
            try
            {
                var resultado =
                    await _usuarioService
                        .RestablecerPasswordAsync(dto);

                if (!resultado.Exito)
                {
                    return BadRequest(new
                    {
                        success = false,
                        mensaje = resultado.Mensaje
                    });
                }

                return Ok(new
                {
                    success = true,
                    mensaje = resultado.Mensaje
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al restablecer la contraseña.");
                return StatusCode(500, new
                {
                    success = false,
                    mensaje = "Error al restablecer la contraseña."
                });
            }
        }
    }
}
