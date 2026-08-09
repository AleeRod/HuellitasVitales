using Microsoft.AspNetCore.Mvc;
using HuellitasVitalesAPI.Services;

namespace HuellasVitalesAPI.Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AgendaController : ControllerBase
    {
        private readonly AgendaService _agendaService;
        private readonly ILogger<AgendaController> _logger;

        public AgendaController(AgendaService agendaService, ILogger<AgendaController> logger)
        {
            _agendaService = agendaService;
            _logger = logger;
        }

        // GET: api/agenda/disponibilidad?idVeterinario=1&fecha=2026-08-15&duracionMinutos=30
        [HttpGet("disponibilidad")]
        public async Task<IActionResult> GetDisponibilidad(
            [FromQuery] int idVeterinario,
            [FromQuery] DateTime fecha,
            [FromQuery] int duracionMinutos = 30)
        {
            var resultado = await _agendaService.ObtenerDisponibilidadAsync(idVeterinario, fecha, duracionMinutos);

            if (!resultado.Exito)
            {
                return StatusCode(resultado.Codigo, new { mensaje = resultado.Mensaje });
            }

            return StatusCode(resultado.Codigo, resultado.Datos);
        }
    }
}