using HuellasVitalesAPI.Backend.Models.DTOs;
using HuellitasVitalesAPI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace HuellitasVitalesAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class OrdenController : ControllerBase
    {
        private readonly OrdenService _ordenService;

        public OrdenController(OrdenService ordenService)
        {
            _ordenService = ordenService;
        }

        // POST api/orden
        // Único punto del carrito que pide sesión: armarlo es libre, pagarlo no.
        [Authorize]
        [HttpPost]
        public async Task<IActionResult> Crear([FromBody] CrearOrdenRequest request)
        {
            var subClaim = User.FindFirst("sub")?.Value
                          ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            // La orden se asocia al usuario del token, nunca a un id que mande
            // el navegador: si no, cualquiera podría comprar a nombre de otro.
            if (!long.TryParse(subClaim, out var idUsuario))
                return Unauthorized(new { success = false, mensaje = "Token inválido o sin identificador de usuario." });

            var resultado = await _ordenService.CrearOrdenAsync(idUsuario, request?.Items ?? new List<ItemOrdenRequest>());

            if (!resultado.Exito)
                return StatusCode(resultado.Codigo, new { success = false, mensaje = resultado.Mensaje });

            return Ok(new { success = true, mensaje = resultado.Mensaje, orden = resultado.Orden });
        }
    }
}
