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

        public PasswordController(UsuarioService usuarioService)
        {
            _usuarioService = usuarioService;
        }

        [HttpPost("recuperar")]
        public async Task<IActionResult> SolicitarRecuperacion(
            [FromBody] SolicitarRecuperacionDTO dto)
        {
            try
            {
                var token = await _usuarioService
                    .GenerarTokenRecuperacionAsync(dto.Correo);

                // TEMPORAL:
                // Lo devolvemos solamente para probar desde Swagger.
                return Ok(new
                {
                    success = true,
                    mensaje = "Solicitud procesada.",
                    token = token
                });
            }
            catch (Exception ex)
            {
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
                return StatusCode(500, new
                {
                    success = false,
                    mensaje = "Error al restablecer la contraseña."
                });
            }
        }
    }
}