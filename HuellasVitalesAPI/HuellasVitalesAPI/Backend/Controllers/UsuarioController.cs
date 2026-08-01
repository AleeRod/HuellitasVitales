using HuellasVitalesAPI.Backend.Models.DTOs;
using HuellitasVitalesAPI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace HuellitasVitalesAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UsuarioController : ControllerBase
    {
        private readonly UsuarioService _usuarioService;

        public UsuarioController(UsuarioService usuarioService)
        {
            _usuarioService = usuarioService;
        }

        // ─── TAREA 3: Datos del perfil de usuario ───
        // GET api/usuario/{id}
        [HttpGet("{id:int}")]
        public async Task<IActionResult> ObtenerPerfil(int id)
        {
            try
            {
                var perfil = await _usuarioService.ObtenerPerfilAsync(id);

                if (perfil == null)
                    return NotFound(new { success = false, mensaje = "El usuario no existe." });

                return Ok(perfil);
            }
            catch (Exception)
            {
                return StatusCode(500, new { success = false, mensaje = "Error al obtener el perfil del usuario." });
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
                Console.WriteLine("--- TOTAL CLAIMS RECIBIDOS: " + User.Claims.Count() + " ---");
                foreach (var claim in User.Claims)
                {
                    Console.WriteLine($"TIPO: {claim.Type} | VALOR: {claim.Value}");
                }

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
                return StatusCode(500, new { success = false, mensaje = "Error interno: " + ex.Message });
            }
        }
    }
}