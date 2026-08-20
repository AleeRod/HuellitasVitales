using HuellasVitalesAPI.Backend.Models.DTOs;
using HuellitasVitalesAPI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace HuellitasVitalesAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class VeterinarioController : ControllerBase
    {
        private readonly VeterinarioService _service;

        public VeterinarioController(VeterinarioService service)
        {
            _service = service;
        }

        // GET api/veterinario/buscar-usuario?correo=juan@mail.com
        [HttpGet("buscar-usuario")]
        [Authorize]
        public async Task<IActionResult> BuscarUsuario([FromQuery] string correo)
        {
            if (string.IsNullOrWhiteSpace(correo))
                return BadRequest(new { success = false, mensaje = "Debes indicar un correo para buscar." });

            var resultado = await _service.BuscarUsuarioPorCorreoAsync(correo);
            if (!resultado.Exito)
                return StatusCode(resultado.Codigo, new { success = false, mensaje = resultado.Mensaje });

            return Ok(resultado.Usuario);
        }

        // GET api/veterinario/comercio/{idComercio}
        [HttpGet("comercio/{idComercio:int}")]
        [Authorize]
        public async Task<IActionResult> ListarPorComercio(int idComercio)
        {
            if (!TryObtenerIdUsuario(out var idUsuario))
                return Unauthorized(new { success = false, mensaje = "Token inválido o sin identificador de usuario." });

            var resultado = await _service.ListarPorComercioAsync(idUsuario, idComercio, EsUsuarioAdmin());
            if (!resultado.Exito)
                return StatusCode(resultado.Codigo, new { success = false, mensaje = resultado.Mensaje });

            return Ok(new { success = true, veterinarios = resultado.Veterinarios });
        }

        // POST api/veterinario
        [HttpPost]
        [Authorize]
        public async Task<IActionResult> Vincular([FromBody] VincularVeterinarioRequest request)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            if (!TryObtenerIdUsuario(out var idUsuario))
                return Unauthorized(new { success = false, mensaje = "Token inválido o sin identificador de usuario." });

            var resultado = await _service.VincularAsync(idUsuario, request, EsUsuarioAdmin());
            if (!resultado.Exito)
                return StatusCode(resultado.Codigo, new { success = false, mensaje = resultado.Mensaje });

            return StatusCode(StatusCodes.Status201Created, new { success = true, mensaje = resultado.Mensaje });
        }

        // DELETE api/veterinario/{id}
        [HttpDelete("{id:int}")]
        [Authorize]
        public async Task<IActionResult> Desvincular(int id)
        {
            if (!TryObtenerIdUsuario(out var idUsuario))
                return Unauthorized(new { success = false, mensaje = "Token inválido o sin identificador de usuario." });

            var resultado = await _service.DesvincularAsync(idUsuario, id, EsUsuarioAdmin());
            if (!resultado.Exito)
                return StatusCode(resultado.Codigo, new { success = false, mensaje = resultado.Mensaje });

            return Ok(new { success = true, mensaje = resultado.Mensaje });
        }

        // ==========================================
        // MÉTODOS AUXILIARES PRIVADOS
        // ==========================================
        private bool TryObtenerIdUsuario(out int idUsuario)
        {
            var subClaim = User.FindFirst("sub")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(subClaim, out idUsuario);
        }

        private bool EsUsuarioAdmin()
        {
            var rolUsuario = User.FindFirst("rol")?.Value
                            ?? User.FindFirst(ClaimTypes.Role)?.Value
                            ?? User.FindFirst("IdRol")?.Value
                            ?? User.FindFirst("idRol")?.Value;

            if (string.IsNullOrEmpty(rolUsuario)) return false;

            return rolUsuario == "1"
                || string.Equals(rolUsuario, "ADMINISTRADOR", StringComparison.OrdinalIgnoreCase)
                || string.Equals(rolUsuario, "Admin", StringComparison.OrdinalIgnoreCase);
        }
    }
}
