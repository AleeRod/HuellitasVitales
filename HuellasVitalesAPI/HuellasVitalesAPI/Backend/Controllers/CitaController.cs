using HuellasVitalesAPI.Backend.Models.DTOs;
using HuellitasVitalesAPI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace HuellitasVitalesAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CitaController : ControllerBase
    {
        private readonly CitaService _citaService;

        public CitaController(CitaService citaService)
        {
            _citaService = citaService;
        }

        // POST api/cita
        [HttpPost]
        [Authorize]
        public async Task<IActionResult> CrearCita([FromBody] CrearCitaRequest request)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var subClaim = User.FindFirst("sub")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(subClaim, out var idUsuario))
                return Unauthorized(new { success = false, mensaje = "Token inválido o sin identificador de usuario." });

            var resultado = await _citaService.CrearAsync(idUsuario, request);

            if (!resultado.Exito)
                return StatusCode(resultado.Codigo, new { success = false, mensaje = resultado.Mensaje });

            return StatusCode(StatusCodes.Status201Created,
                new { success = true, mensaje = resultado.Mensaje, cita = resultado.Cita });
        }

        [HttpGet("mis-citas")]
        [Authorize]
        public async Task<IActionResult> ObtenerMisCitas()
        {
            var subClaim = User.FindFirst("sub")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(subClaim, out var idUsuario))
                return Unauthorized(new { success = false, mensaje = "Token inválido o sin identificador de usuario." });

            var citas = await _citaService.ObtenerPorUsuarioAsync(idUsuario);
            return Ok(new { success = true, citas });
        }

        [HttpGet("veterinario")]
        [Authorize]
        public async Task<IActionResult> ObtenerAgendaVeterinario([FromQuery] int? idVeterinario = null)
        {
            var usuarioId = ObtenerUsuarioActual();
            if (usuarioId is null) return Unauthorized(new { success = false, mensaje = "Token inválido o sin identificador de usuario." });

            var rol = ObtenerRolUsuario();
            var veterinarioActual = idVeterinario.HasValue
                ? await _citaService.ObtenerVeterinarioPorUsuarioAsync(usuarioId.Value)
                : null;

            if (idVeterinario.HasValue)
            {
                if (rol != 1 && rol != 2)
                    return Forbid();

                var citas = await _citaService.ObtenerPorVeterinarioAsync(idVeterinario.Value);
                return Ok(new { success = true, citas });
            }

            if (rol != 2)
                return Forbid();

            var veterinario = await _citaService.ObtenerVeterinarioPorUsuarioAsync(usuarioId.Value);
            if (veterinario == null)
                return NotFound(new { success = false, mensaje = "No se encontró el veterinario asociado a este usuario." });

            var agenda = await _citaService.ObtenerPorVeterinarioAsync(veterinario.IdVeterinario);
            return Ok(new { success = true, citas = agenda });
        }

        [HttpPut("{id:int}/confirmar")]
        [Authorize]
        public async Task<IActionResult> ConfirmarCita(int id)
        {
            var usuarioId = ObtenerUsuarioActual();
            if (usuarioId is null) return Unauthorized(new { success = false, mensaje = "Token inválido o sin identificador de usuario." });

            var rol = ObtenerRolUsuario();
            var resultado = await _citaService.ConfirmarAsync(id, usuarioId.Value, rol);

            if (!resultado.Exito)
                return StatusCode(resultado.Codigo, new { success = false, mensaje = resultado.Mensaje });

            return Ok(new { success = true, mensaje = resultado.Mensaje, cita = resultado.Cita });
        }

        [HttpPut("{id:int}/reprogramar")]
        [Authorize]
        public async Task<IActionResult> ReprogramarCita(int id, [FromBody] ReprogramarCitaRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var usuarioId = ObtenerUsuarioActual();
            if (usuarioId is null) return Unauthorized(new { success = false, mensaje = "Token inválido o sin identificador de usuario." });

            var rol = ObtenerRolUsuario();
            var resultado = await _citaService.ReprogramarAsync(id, request, usuarioId.Value, rol);

            if (!resultado.Exito)
                return StatusCode(resultado.Codigo, new { success = false, mensaje = resultado.Mensaje });

            return Ok(new { success = true, mensaje = resultado.Mensaje, cita = resultado.Cita });
        }

        [HttpPut("{id:int}/cancelar")]
        [Authorize]
        public async Task<IActionResult> CancelarCita(int id, [FromBody] CancelarCitaRequest? request = null)
        {
            var usuarioId = ObtenerUsuarioActual();
            if (usuarioId is null) return Unauthorized(new { success = false, mensaje = "Token inválido o sin identificador de usuario." });

            var rol = ObtenerRolUsuario();
            var resultado = await _citaService.CancelarAsync(id, request?.Motivo, usuarioId.Value, rol);

            if (!resultado.Exito)
                return StatusCode(resultado.Codigo, new { success = false, mensaje = resultado.Mensaje });

            return Ok(new { success = true, mensaje = resultado.Mensaje, cita = resultado.Cita });
        }

        private int? ObtenerUsuarioActual()
        {
            var subClaim = User.FindFirst("sub")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(subClaim, out var usuarioId) ? usuarioId : null;
        }

        private byte ObtenerRolUsuario()
        {
            var rolClaim = User.FindFirst("rol")?.Value;
            return byte.TryParse(rolClaim, out var rol) ? rol : (byte)0;
        }
    }

    public class ReprogramarCitaRequest
    {
        public DateTime Fecha { get; set; }
        public TimeSpan HoraInicio { get; set; }
        public string? Notas { get; set; }
    }

    public class CancelarCitaRequest
    {
        public string? Motivo { get; set; }
    }
}