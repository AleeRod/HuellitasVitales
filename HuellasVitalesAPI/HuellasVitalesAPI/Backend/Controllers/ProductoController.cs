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

        // ==========================================
        // 1. CREAR PRODUCTO
        // POST api/producto
        // ==========================================
        [Authorize]
        [HttpPost]
        public async Task<IActionResult> CrearProducto([FromBody] CrearProductoRequest request)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            int? idUsuario = ObtenerIdUsuario();
            if (idUsuario == null) return Unauthorized(new { success = false, mensaje = "Token inválido." });

            var resultado = await _productoService.CrearProductoAsync(idUsuario.Value, request, EsUsuarioAdmin());
            if (!resultado.Exito) return StatusCode(resultado.Codigo, new { success = false, mensaje = resultado.Mensaje });

            return StatusCode(StatusCodes.Status201Created, new { success = true, mensaje = resultado.Mensaje, producto = resultado.Producto });
        }

        // ==========================================
        // 2. EDITAR PRODUCTO
        // PUT api/producto/{id}
        // ==========================================
        [Authorize]
        [HttpPut("{id:int}")]
        public async Task<IActionResult> EditarProducto(int id, [FromBody] EditarProductoRequest request)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            int? idUsuario = ObtenerIdUsuario();
            if (idUsuario == null) return Unauthorized(new { success = false, mensaje = "Token inválido." });

            var resultado = await _productoService.EditarProductoAsync(idUsuario.Value, id, request, EsUsuarioAdmin());
            if (!resultado.Exito) return StatusCode(resultado.Codigo, new { success = false, mensaje = resultado.Mensaje });

            return Ok(new { success = true, mensaje = resultado.Mensaje, producto = resultado.Producto });
        }

        // ==========================================
        // 3. ELIMINAR PRODUCTO (BORRADO LÓGICO)
        // DELETE api/producto/{id}
        // ==========================================
        [Authorize]
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> EliminarProducto(int id)
        {
            int? idUsuario = ObtenerIdUsuario();
            if (idUsuario == null) return Unauthorized(new { success = false, mensaje = "Token inválido." });

            var resultado = await _productoService.EliminarProductoAsync(idUsuario.Value, id, EsUsuarioAdmin());
            if (!resultado.Exito) return StatusCode(resultado.Codigo, new { success = false, mensaje = resultado.Mensaje });

            return Ok(new { success = true, mensaje = resultado.Mensaje });
        }

        // ==========================================
        // 4. CONSULTAS DE PRODUCTOS
        // ==========================================
        
        // GET api/producto/comercio/{idComercio}
        [HttpGet("comercio/{idComercio:int}")]
        public async Task<IActionResult> ObtenerProductosPorComercio(int idComercio)
        {
            var resultado = await _productoService.ObtenerProductosPorComercioAsync(idComercio);
            if (!resultado.Exito) return StatusCode(resultado.Codigo, new { success = false, mensaje = resultado.Mensaje });

            return Ok(new { success = true, productos = resultado.Productos });
        }

        // GET api/producto/{id}
        [HttpGet("{id:int}")]
        public async Task<IActionResult> ObtenerProducto(int id)
        {
            var resultado = await _productoService.ObtenerProductoPorIdAsync(id);
            if (!resultado.Exito) return StatusCode(resultado.Codigo, new { success = false, mensaje = resultado.Mensaje });

            return Ok(new { success = true, producto = resultado.Producto });
        }

        // GET api/producto/todos-global (VISTA ADMIN GLOBAL)
        [Authorize]
        [HttpGet("todos-global")]
        public async Task<IActionResult> ObtenerTodosGlobal()
        {
            if (!EsUsuarioAdmin())
                return StatusCode(StatusCodes.Status403Forbidden, new { success = false, mensaje = "Acceso denegado. Se requieren permisos de Administrador." });

            var resultado = await _productoService.ObtenerTodosLosProductosGlobalAsync();
            return Ok(new { success = true, productos = resultado.Productos });
        }

        // ==========================================
        // 5. AUXILIARES, ALMACÉN E IMÁGENES
        // ==========================================

        // GET api/producto/mi-almacen (AUTO-FETCH DEL ID SEGÚN EL USUARIO)
        [Authorize]
        [HttpGet("mi-almacen")]
        public async Task<IActionResult> ObtenerMiAlmacen()
        {
            int? idUsuario = ObtenerIdUsuario();
            if (idUsuario == null) return Unauthorized(new { success = false, mensaje = "Token inválido." });

            var idAlmacen = await _productoService.ObtenerIdAlmacenPorUsuarioAsync(idUsuario.Value);
            
            if (idAlmacen == null) 
                return NotFound(new { success = false, mensaje = "No tienes un almacén asignado a tu cuenta." });

            return Ok(new { success = true, idComercio = idAlmacen.Value });
        }

        // GET api/producto/almacenes-lista (LISTA PARA SELECTOR DEL ADMIN)
        [Authorize]
        [HttpGet("almacenes-lista")]
        public async Task<IActionResult> ObtenerAlmacenesLista()
        {
            var almacenes = await _productoService.ObtenerAlmacenesAprobadosAsync();
            return Ok(new { success = true, almacenes });
        }

        // POST api/producto/subir-imagen (GUARDAR ARCHIVO FÍSICO Y RETORNAR RUTA)
        [Authorize]
        [HttpPost("subir-imagen")]
        public async Task<IActionResult> SubirImagen(IFormFile imagen)
        {
            if (imagen == null || imagen.Length == 0)
                return BadRequest(new { success = false, mensaje = "No se envió ninguna imagen." });

            try
            {
                var urlImagen = await _productoService.GuardarImagenAsync(imagen);
                return Ok(new { success = true, url = urlImagen });
            }
            catch (Exception)
            {
                return StatusCode(500, new { success = false, mensaje = "Error al guardar la imagen en el servidor." });
            }
        }

        // ==========================================
        // 6. CATÁLOGOS (COMBOS FRONTEND)
        // ==========================================

        // GET api/producto/categorias
        [HttpGet("categorias")]
        public async Task<IActionResult> ObtenerCategorias()
        {
            var data = await _productoService.ObtenerCategoriasAsync();
            return Ok(new { success = true, categorias = data });
        }

        // GET api/producto/especies
        [HttpGet("especies")]
        public async Task<IActionResult> ObtenerEspecies()
        {
            var data = await _productoService.ObtenerEspeciesAsync();
            return Ok(new { success = true, especies = data });
        }

        // GET api/producto/marcas
        [HttpGet("marcas")]
        public async Task<IActionResult> ObtenerMarcas()
        {
            var data = await _productoService.ObtenerMarcasAsync();
            return Ok(new { success = true, marcas = data });
        }

        // ==========================================
        // MÉTODOS AUXILIARES PRIVADOS
        // ==========================================
        private int? ObtenerIdUsuario()
        {
            var subClaim = User.FindFirst("sub")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(subClaim, out var id) ? id : null;
        }

        private bool EsUsuarioAdmin()
        {
            var rolUsuario = User.FindFirst(ClaimTypes.Role)?.Value 
                            ?? User.FindFirst("rol")?.Value
                            ?? User.FindFirst("IdRol")?.Value
                            ?? User.FindFirst("idRol")?.Value
                            ?? User.FindFirst("http://schemas.microsoft.com/ws/2008/06/identity/claims/role")?.Value;

            if (string.IsNullOrEmpty(rolUsuario)) return false;

            // Acepta "1" (el IdRol de administrador) o el texto "ADMINISTRADOR" / "Admin"
            return rolUsuario == "1"
                || string.Equals(rolUsuario, "ADMINISTRADOR", StringComparison.OrdinalIgnoreCase)
                || string.Equals(rolUsuario, "Admin", StringComparison.OrdinalIgnoreCase);
        }
    }
}
