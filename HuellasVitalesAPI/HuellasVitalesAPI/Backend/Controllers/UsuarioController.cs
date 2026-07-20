using HuellitasVitalesAPI.Services;
using Microsoft.AspNetCore.Mvc;

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
                // Se devuelve un JSON limpio en lugar del stack trace crudo.
                return StatusCode(500, new { success = false, mensaje = "Error al obtener el perfil del usuario." });
            }
        }
    }
}
