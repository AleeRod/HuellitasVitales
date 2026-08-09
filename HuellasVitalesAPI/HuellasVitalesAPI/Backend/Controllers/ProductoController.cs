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

        // POST api/producto
        [Authorize]
        [HttpPost]
        public async Task<IActionResult> CrearProducto(
            [FromBody] CrearProductoRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            // Mismo patrón de seguridad utilizado por CarritoController.
            var subClaim = User.FindFirst("sub")?.Value
                           ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (!int.TryParse(subClaim, out var idUsuario))
            {
                return Unauthorized(new
                {
                    success = false,
                    mensaje = "Token inválido o sin identificador de usuario."
                });
            }

            var resultado = await _productoService
                .CrearProductoAsync(idUsuario, request);

            if (!resultado.Exito)
            {
                return StatusCode(resultado.Codigo, new
                {
                    success = false,
                    mensaje = resultado.Mensaje
                });
            }

            var producto = resultado.Producto!;

            return StatusCode(StatusCodes.Status201Created, new
            {
                success = true,
                mensaje = resultado.Mensaje,
                producto = new
                {
                    producto.IdProducto,
                    producto.IdComercio,
                    producto.IdCategoria,
                    producto.Nombre,
                    producto.Descripcion,
                    producto.Precio,
                    producto.Stock,
                    agotado = (producto.Stock ?? 0) <= 0,
                    producto.ImagenUrl,
                    producto.Activo,
                    producto.FechaCreacion
                }
            });
        }
      [Authorize]
[HttpPut("{id:int}")]
public async Task<IActionResult> EditarProducto(
    int id,
    [FromBody] EditarProductoRequest request)
{
    if (!ModelState.IsValid)
        return BadRequest(ModelState);

    var subClaim = User.FindFirst("sub")?.Value
                   ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

    if (!int.TryParse(subClaim, out var idUsuario))
    {
        return Unauthorized(new
        {
            success = false,
            mensaje = "Token inválido o sin identificador de usuario."
        });
    }

    var resultado = await _productoService
        .EditarProductoAsync(idUsuario, id, request);

    if (!resultado.Exito)
    {
        return StatusCode(resultado.Codigo, new
        {
            success = false,
            mensaje = resultado.Mensaje
        });
    }

    var producto = resultado.Producto!;

    return Ok(new
    {
        success = true,
        mensaje = resultado.Mensaje,
        producto = new
        {
            producto.IdProducto,
            producto.IdComercio,
            producto.IdCategoria,
            producto.Nombre,
            producto.Descripcion,
            producto.Precio,
            producto.PrecioDescuento,
            producto.Stock,
            agotado = (producto.Stock ?? 0) <= 0,
            producto.ImagenUrl,
            producto.Activo
        }
    });
}

}

}