using HuellasVitalesAPI.Backend.Models.DTOs;
using HuellitasVitalesAPI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace HuellitasVitalesAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ServicioController : ControllerBase
    {
        private readonly ServicioService _servicioService;

        public ServicioController(ServicioService servicioService)
        {
            _servicioService = servicioService;
        }

        // ─── Registrar un servicio (solo en comercios de tipo Clínica Veterinaria) ───
        // POST api/servicio
        [HttpPost]
        [Authorize] // Requiere JWT válido
        public async Task<IActionResult> CrearServicio([FromBody] CrearServicioRequest request)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            // ID del funcionario que registra (claim "sub" = IdUsuario)
            var subClaim = User.FindFirst("sub")?.Value
                        ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(subClaim, out var idUsuario))
                return Unauthorized(new { success = false, mensaje = "Token inválido o sin identificador de usuario." });

            var resultado = await _servicioService.CrearAsync(idUsuario, request);

            if (!resultado.Exito)
                return StatusCode(resultado.Codigo, new { success = false, mensaje = resultado.Mensaje });

            return StatusCode(StatusCodes.Status201Created,
                new { success = true, mensaje = resultado.Mensaje, idServicio = resultado.IdServicio });
        }
    }
}
