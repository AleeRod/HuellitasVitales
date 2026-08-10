using HuellasVitalesAPI.Backend.Models.DTOs;
using HuellitasVitalesAPI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace HuellitasVitalesAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ProductoController : ControllerBase
    {
        private readonly ProductoService _productoService;

        public ProductoController(ProductoService productoService)
        {
            _productoService = productoService;
        }

        // ─── Registrar un producto (solo en comercios de tipo Almacén) ───
        // POST api/producto
        [HttpPost]
        [Authorize] // Requiere JWT válido
        public async Task<IActionResult> CrearProducto([FromBody] CrearProductoRequest request)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            // ID del funcionario que registra (claim "sub" = IdUsuario)
            var subClaim = User.FindFirst("sub")?.Value
                           ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(subClaim, out var idUsuario))
                return Unauthorized(new { success = false, mensaje = "Token inválido o sin identificador de usuario." });

            var resultado = await _productoService.CrearAsync(idUsuario, request);

            if (!resultado.Exito)
                return StatusCode(resultado.Codigo, new { success = false, mensaje = resultado.Mensaje });

            return StatusCode(StatusCodes.Status201Created,
                new { success = true, mensaje = resultado.Mensaje, idProducto = resultado.IdProducto });
        }
    }
}
