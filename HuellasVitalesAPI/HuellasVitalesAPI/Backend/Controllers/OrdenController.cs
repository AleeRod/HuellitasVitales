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
            // La orden se asocia al usuario del token, nunca a un id que mande
            // el navegador: si no, cualquiera podría comprar a nombre de otro.
            if (!TryObtenerIdUsuario(out var idUsuario))
                return Unauthorized(new { success = false, mensaje = "Token inválido o sin identificador de usuario." });

            var resultado = await _ordenService.CrearOrdenAsync(
                idUsuario, request?.Items ?? new List<ItemOrdenRequest>(), request?.MetodoPago);

            if (!resultado.Exito)
                return StatusCode(resultado.Codigo, new { success = false, mensaje = resultado.Mensaje });

            return Ok(new { success = true, mensaje = resultado.Mensaje, orden = resultado.Orden });
        }

        // GET api/orden
        // "Mis compras": historial de órdenes del usuario autenticado.
        [Authorize]
        [HttpGet]
        public async Task<IActionResult> MisOrdenes()
        {
            if (!TryObtenerIdUsuario(out var idUsuario))
                return Unauthorized(new { success = false, mensaje = "Token inválido o sin identificador de usuario." });

            var ordenes = await _ordenService.ObtenerMisOrdenesAsync(idUsuario);
            return Ok(new { success = true, ordenes });
        }

        // GET api/orden/{id}
        // Recibo/factura interna de una orden puntual, siempre y cuando sea del usuario del token.
        [Authorize]
        [HttpGet("{id:int}")]
        public async Task<IActionResult> Factura(int id)
        {
            if (!TryObtenerIdUsuario(out var idUsuario))
                return Unauthorized(new { success = false, mensaje = "Token inválido o sin identificador de usuario." });

            var factura = await _ordenService.ObtenerFacturaAsync(idUsuario, id);

            if (factura == null)
                return NotFound(new { success = false, mensaje = "No encontramos esa compra." });

            return Ok(new { success = true, factura });
        }

        private bool TryObtenerIdUsuario(out long idUsuario)
        {
            var subClaim = User.FindFirst("sub")?.Value
                          ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return long.TryParse(subClaim, out idUsuario);
        }
    }
}
