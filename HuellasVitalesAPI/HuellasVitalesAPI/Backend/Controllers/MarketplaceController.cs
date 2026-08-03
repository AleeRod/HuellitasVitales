using Microsoft.AspNetCore.Mvc;
using HuellasVitalesAPI.Backend.Models.DTOs;
using HuellitasVitalesAPI.Services;

namespace HuellitasVitalesAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class MarketplaceController : ControllerBase
    {
        private readonly IMarketplaceService _marketplaceService;

        public MarketplaceController(IMarketplaceService marketplaceService)
        {
            _marketplaceService = marketplaceService;
        }

        [HttpGet("buscar")]
        public async Task<IActionResult> BuscarDinamico([FromQuery] string termino)
        {
            if (string.IsNullOrWhiteSpace(termino) || termino.Length < 3)
            {
                return BadRequest(new { mensaje = "Ingresa al menos 3 caracteres para buscar." });
            }

            try
            {
                var resultados = await _marketplaceService.BuscarEnMarketplaceAsync(termino);

                if (resultados == null || !resultados.Any())
                {
                    return Ok(new { mensaje = "No se encontraron resultados.", data = new List<ResultadoBusquedaDto>() });
                }

                return Ok(new { mensaje = "Búsqueda exitosa", data = resultados });
            }
            catch (Exception)
            {
                return StatusCode(500, new { mensaje = "Error interno del servidor al realizar la búsqueda. Por favor, intenta de nuevo." });
            }
        }
    }
}