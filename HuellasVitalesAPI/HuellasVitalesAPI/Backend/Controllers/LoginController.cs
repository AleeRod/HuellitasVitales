using Google.Apis.Auth;
using HuellasVitalesAPI.Backend.Models.DTOs;
using HuellitasVitalesAPI.Services;
using Microsoft.AspNetCore.Mvc;

namespace HuellitasVitalesAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class LoginController : ControllerBase
    {
        private readonly UsuarioService _usuarioService;

        public LoginController(UsuarioService usuarioService)
        {
            _usuarioService = usuarioService;
        }

        [HttpPost("registrar")]
        public IActionResult RegistrarUsuario([FromBody] RegistroRequest request)
        {
            try
            {
                var resultado = _usuarioService.RegistrarNuevoUsuario(request);
                if (!resultado.Exito)
                {
                    return BadRequest(new { mensaje = resultado.Mensaje });
                }
                return Ok(new { mensaje = resultado.Mensaje });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = "Error interno: " + ex.Message });
            }
        }

        [HttpPost("google")]
        public async Task<IActionResult> LoginConGoogle([FromBody] LoginSocialRequest request)
        {
            if (request == null || string.IsNullOrEmpty(request.Token))
                return BadRequest(new { success = false, mensaje = "El token es requerido." });
            try
            {
                var usuario = await _usuarioService.AutenticarGoogleAsync(request.Token);

                if (usuario == null)
                    return Unauthorized(new { success = false, mensaje = "Autenticación de Google inválida." });

                var tokenJwt = _usuarioService.GenerarTokenJWT(usuario);
                return Ok(new
                {
                    success = true,
                    mensaje = "¡Bienvenido!",
                    token = tokenJwt,
                    usuario = new { usuario.Nombre, usuario.Correo, usuario.IdRol }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, mensaje = "Error interno: " + ex.Message });
            }
        }

        [HttpPost("local")]
        public async Task<IActionResult> LoginLocal([FromBody] LoginRequest request)
        {
            try
            {
                var usuario = await _usuarioService.AutenticarLocalAsync(request);
                if (usuario == null)
                    return Unauthorized(new { success = false, mensaje = "Correo o contraseña incorrectos." });

                var tokenJwt = _usuarioService.GenerarTokenJWT(usuario);
                return Ok(new
                {
                    success = true,
                    mensaje = "¡Bienvenido de vuelta a Huellitas Vitales!",
                    token = tokenJwt,
                    usuario = new { usuario.Nombre, usuario.Correo, usuario.IdRol }
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, mensaje = ex.Message });
            }
        }

        [HttpPost("facebook")]
        public async Task<IActionResult> LoginFacebook([FromBody] LoginSocialRequest request)
        {
            try
            {
                if (string.IsNullOrEmpty(request.Token))
                {
                    return BadRequest(new { success = false, mensaje = "El token de Facebook es obligatorio." });
                }

                var usuario = await _usuarioService.AutenticarFacebookAsync(request.Token);
                if (usuario == null)
                {
                    return Unauthorized(new { success = false, mensaje = "No se pudo obtener información del usuario de Facebook." });
                }

                var jwtToken = _usuarioService.GenerarTokenJWT(usuario);
                return Ok(new
                {
                    success = true,
                    mensaje = "¡Bienvenido a Huellitas Vitales!",
                    token = jwtToken,
                    usuario = new { usuario.Nombre, usuario.Correo, usuario.IdRol }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, mensaje = "Error interno: " + ex.Message });
            }
        }
    }
}