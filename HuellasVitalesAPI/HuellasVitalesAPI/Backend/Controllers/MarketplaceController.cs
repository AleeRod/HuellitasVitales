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

        [HttpGet("catalogo")]
        public async Task<IActionResult> GetCatalogo()
        {
            try
            {
                var catalogo = await _marketplaceService.ObtenerCatalogoCompletoAsync();
                return Ok(catalogo);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = "Error interno al obtener el catálogo.", detalle = ex.Message });
            }
        }

       [HttpGet("buscar")]
        public async Task<IActionResult> BuscarDinamico([FromQuery] string? termino, [FromQuery] string? q)
        {
            string criterioBusqueda = !string.IsNullOrWhiteSpace(termino) ? termino : (q ?? "");

            if (string.IsNullOrWhiteSpace(criterioBusqueda))
            {
                return BadRequest(new { mensaje = "Ingresa un término de búsqueda." });
            }

            try
            {
                var resultados = await _marketplaceService.BuscarEnMarketplaceAsync(criterioBusqueda);

                if (resultados == null || !resultados.Any())
                {
                    return Ok(new { mensaje = "No se encontraron resultados.", data = new List<ResultadoBusquedaDto>() });
                }

                return Ok(new { mensaje = "Búsqueda exitosa", data = resultados });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = "Error interno al realizar la búsqueda.", detalle = ex.Message });
            }
        }
    }
}