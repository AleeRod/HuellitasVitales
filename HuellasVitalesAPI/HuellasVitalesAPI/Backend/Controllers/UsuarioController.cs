using HuellasVitalesAPI.Backend.Models.DTOs;
using HuellitasVitalesAPI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System.Security.Claims;

namespace HuellitasVitalesAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UsuarioController : ControllerBase
    {
        private readonly UsuarioService _usuarioService;
        private readonly ILogger<UsuarioController> _logger;

        public UsuarioController(UsuarioService usuarioService, ILogger<UsuarioController> logger)
        {
            _usuarioService = usuarioService;
            _logger = logger;
        }

        // ─── TAREA 3: Datos del perfil de usuario ───
        // GET api/usuario/{id}
        // ─── GET api/usuario/perfil ───
        [Authorize]
        [HttpGet("perfil")]
        public async Task<IActionResult> ObtenerPerfilAutenticado()
        {
            try
            {
                var userIdClaim = User.FindFirst("sub")?.Value 
                            ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int idUsuario))
                {
                    return Unauthorized(new { success = false, mensaje = "Token inválido." });
                }

                var perfil = await _usuarioService.ObtenerPerfilAsync(idUsuario);

                if (perfil == null)
                    return NotFound(new { success = false, mensaje = "El usuario no existe." });

                return Ok(perfil);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener el perfil del usuario autenticado.");
                return StatusCode(500, new { success = false, mensaje = "Error interno al obtener el perfil." });
            }
        }

        // ─── TAREA 119: Actualizar perfil de usuario autenticado ───
        // PUT api/usuario/perfil
        [Authorize]
        [HttpPut("perfil")]
        public async Task<IActionResult> ActualizarPerfil([FromBody] ActualizarPerfilDTO dto)
        {
            try
            {
                // Extraer el ID del usuario directamente del token JWT
                var userIdClaim = User.FindFirst("sub")?.Value 
                            ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int idUsuario))
                {
                    return Unauthorized(new { success = false, mensaje = "Token inválido o no proporcionado." });
                }

                var (exito, mensaje) = await _usuarioService.ActualizarPerfilAsync(idUsuario, dto);

                if (!exito)
                {
                    return BadRequest(new { success = false, mensaje });
                }

                return Ok(new { success = true, mensaje });
            }
            catch (Exception ex)
            {
                // El error real se queda en el backend
                _logger.LogError(ex, "Error interno al actualizar el perfil del usuario.");
                return StatusCode(500, new { success = false, mensaje = "Ocurrió un error interno al intentar actualizar el perfil." });
            }
        }

        // ─── NUEVO: Registro Rápido ───
        [HttpPost("registro-rapido")]
        public async Task<IActionResult> RegistroRapido([FromBody] RegistroRapidoDTO request)
        {
            try
            {
                // Usamos _usuarioService, que ya está inyectado
                var token = await _usuarioService.RegistrarUsuarioRapidoAsync(request);
                
                // Devolvemos el token para que el frontend lo guarde y pase al checkout
                return Ok(new { token, mensaje = "Registro rápido exitoso" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { mensaje = ex.Message });
            }
        }

        [Authorize]
        [HttpPost("vincular-google")]
        public async Task<IActionResult> VincularGoogle(
            [FromBody] LoginSocialRequest request)
        {
            try
            {
                var userIdClaim =
                    User.FindFirst("sub")?.Value
                    ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                if (string.IsNullOrEmpty(userIdClaim) ||
                    !int.TryParse(userIdClaim, out int idUsuario))
                {
                    return Unauthorized(new
                    {
                        success = false,
                        mensaje = "Token inválido o no proporcionado."
                    });
                }

                if (request == null || string.IsNullOrEmpty(request.Token))
                {
                    return BadRequest(new
                    {
                        success = false,
                        mensaje = "El token de Google es obligatorio."
                    });
                }

                var resultado = await _usuarioService.VincularGoogleAsync(
                    idUsuario,
                    request.Token
                );

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
                _logger.LogError(
                    ex,
                    "Error al vincular Google con el usuario."
                );

                return StatusCode(500, new
                {
                    success = false,
                    mensaje = "Ocurrió un error al vincular la cuenta de Google."
                });
            }
        }

        [Authorize]
        [HttpPost("vincular-facebook")]
        public async Task<IActionResult> VincularFacebook(
            [FromBody] LoginSocialRequest request)
        {
            try
            {
                var userIdClaim =
                    User.FindFirst("sub")?.Value
                    ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                if (string.IsNullOrEmpty(userIdClaim) ||
                    !int.TryParse(userIdClaim, out int idUsuario))
                {
                    return Unauthorized(new
                    {
                        success = false,
                        mensaje = "Token inválido o no proporcionado."
                    });
                }

                if (request == null || string.IsNullOrEmpty(request.Token))
                {
                    return BadRequest(new
                    {
                        success = false,
                        mensaje = "El token de Facebook es obligatorio."
                    });
                }

                var resultado =
                    await _usuarioService.VincularFacebookAsync(
                        idUsuario,
                        request.Token);

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
                _logger.LogError(
                    ex,
                    "Error al vincular Facebook con el usuario."
                );

                return StatusCode(500, new
                {
                    success = false,
                    mensaje = "Ocurrió un error al vincular la cuenta de Facebook."
                });
            }
        }

        [Authorize]
        [HttpGet("proveedores-vinculados")]
        public async Task<IActionResult> ObtenerProveedoresVinculados()
        {
            try
            {
                var userIdClaim =
                    User.FindFirst("sub")?.Value
                    ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                if (string.IsNullOrEmpty(userIdClaim) ||
                    !int.TryParse(userIdClaim, out int idUsuario))
                {
                    return Unauthorized(new
                    {
                        success = false,
                        mensaje = "Token inválido o no proporcionado."
                    });
                }

                var proveedores =
                    await _usuarioService.ObtenerProveedoresVinculadosAsync(idUsuario);

                return Ok(new
                {
                    success = true,
                    google = proveedores.Any(p =>
                        p.Equals("Google", StringComparison.OrdinalIgnoreCase)),
                    facebook = proveedores.Any(p =>
                        p.Equals("Facebook", StringComparison.OrdinalIgnoreCase))
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Error al obtener las cuentas vinculadas del usuario."
                );

                return StatusCode(500, new
                {
                    success = false,
                    mensaje = "No fue posible obtener las cuentas vinculadas."
                });
            }
        }






    }
}