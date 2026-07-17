using HuellasVitalesAPI.Backend.Models.DTOs;
using HuellitasVitalesAPI.Services;
using Microsoft.AspNetCore.Mvc;

namespace HuellitasVitalesAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ComercioController : ControllerBase
    {
        private readonly ComercioService _comercioService;

        public ComercioController(ComercioService comercioService)
        {
            _comercioService = comercioService;
        }

        [HttpPost("solicitud")]
        public async Task<IActionResult> RegistrarSolicitud([FromBody] SolicitudComercioRequest request)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var resultado = await _comercioService.CrearSolicitudRegistroAsync(request);

            if (!resultado.Exito)
            {
                return BadRequest(new { success = false, mensaje = resultado.Mensaje });
            }

            return Ok(new { success = true, mensaje = resultado.Mensaje });
        }
    }
}