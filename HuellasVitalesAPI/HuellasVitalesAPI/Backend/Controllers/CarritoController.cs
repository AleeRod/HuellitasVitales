using HuellitasVitalesAPI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace HuellitasVitalesAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CarritoController : ControllerBase
    {
        private readonly CarritoService _carritoService;

        public CarritoController(CarritoService carritoService)
        {
            _carritoService = carritoService;
        }

        public class AgregarCarritoRequest
        {
            public int IdProducto { get; set; }
            public int Cantidad { get; set; } = 1;
        }

        // POST api/carrito/agregar
        [Authorize]
        [HttpPost("agregar")]
        public async Task<IActionResult> Agregar([FromBody] AgregarCarritoRequest request)
        {
            var subClaim = User.FindFirst("sub")?.Value
                          ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (!long.TryParse(subClaim, out var idUsuario))
                return Unauthorized(new { success = false, mensaje = "Token inválido o sin identificador de usuario." });

            var resultado = await _carritoService.AgregarProductoAsync(idUsuario, request.IdProducto, request.Cantidad);

            if (!resultado.Exito)
                return StatusCode(resultado.Codigo, new { success = false, mensaje = resultado.Mensaje });

            return Ok(new { success = true, mensaje = resultado.Mensaje });
        }
    }
}