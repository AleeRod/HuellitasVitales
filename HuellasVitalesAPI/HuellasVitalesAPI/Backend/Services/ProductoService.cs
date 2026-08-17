using HuellasVitalesAPI.Backend.Models.DTOs;
using HuellasVitalesAPI.Backend.Models.Entidades;
using HuellitasVitalesAPI.Data;
using Microsoft.EntityFrameworkCore;

namespace HuellitasVitalesAPI.Services
{
    public class ProductoService
    {
        private readonly ConexionDB _context;
        private readonly ILogger<ProductoService> _logger;
        private readonly ComercioValidacionService _validacionService;

        public ProductoService(
            ConexionDB context, 
            ILogger<ProductoService> logger,
            ComercioValidacionService validacionService)
        {
            _context = context;
            _logger = logger;
            _validacionService = validacionService;
        }

        // ==========================================
        // 1. CREAR PRODUCTO
        // ==========================================
        public async Task<(bool Exito, string Mensaje, int Codigo, Producto? Producto)>
            CrearProductoAsync(int idUsuario, CrearProductoRequest request, bool esAdmin)
        {
            try
            {
                var validacion = await _validacionService.ValidarComercioHabilitadoAsync(
                    idUsuario, request.IdComercio, ComercioValidacionService.TIPO_COMERCIO_ALMACEN, esAdmin);

                if (!validacion.Exito)
                    return (false, validacion.Mensaje, validacion.Codigo, null);

                if (!await _context.CategoriasProductoCat.AnyAsync(c => c.IdCategoria == request.IdCategoria))
                    return (false, "La categoría indicada no existe.", StatusCodes.Status400BadRequest, null);

                var producto = new Producto
                {
                    IdComercio = request.IdComercio,
                    IdCategoria = request.IdCategoria,
                    IdEspecie = request.IdEspecie, 
                    IdMarca = request.IdMarca,     
                    Sku = string.IsNullOrWhiteSpace(request.Sku) ? null : request.Sku.Trim(),
                    Nombre = request.Nombre.Trim(),
                    Descripcion = string.IsNullOrWhiteSpace(request.Descripcion) ? null : request.Descripcion.Trim(),
                    Precio = request.Precio,
                    PrecioDescuento = request.PrecioDescuento,
                    Stock = request.Stock,
                    ImagenUrl = string.IsNullOrWhiteSpace(request.ImagenUrl) ? null : request.ImagenUrl.Trim(),
                    Activo = true,
                    FechaCreacion = DateTime.UtcNow
                };

                _context.Productos.Add(producto);
                await _context.SaveChangesAsync();

                return (true, "Producto creado correctamente.", StatusCodes.Status201Created, producto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al crear producto para usuario {IdUsuario}.", idUsuario);
                return (false, "Ocurrió un error interno al crear el producto.", StatusCodes.Status500InternalServerError, null);
            }
        }

        // ==========================================
        // 2. EDITAR PRODUCTO
        // ==========================================
        public async Task<(bool Exito, string Mensaje, int Codigo, Producto? Producto)>
            EditarProductoAsync(int idUsuario, int idProducto, EditarProductoRequest request, bool esAdmin)
        {
            try
            {
                var producto = await _context.Productos.FirstOrDefaultAsync(p => p.IdProducto == idProducto && p.Activo);
                if (producto == null)
                    return (false, "El producto no existe o está inactivo.", StatusCodes.Status404NotFound, null);

                var validacion = await _validacionService.ValidarPropietarioComercioAsync(
                    idUsuario, producto.IdComercio, esAdmin);

                if (!validacion.Exito)
                    return (false, validacion.Mensaje, validacion.Codigo, null);

                if (!await _context.CategoriasProductoCat.AnyAsync(c => c.IdCategoria == request.IdCategoria))
                    return (false, "La categoría indicada no existe.", StatusCodes.Status400BadRequest, null);

                producto.IdCategoria = request.IdCategoria;
                producto.IdEspecie = request.IdEspecie;
                producto.IdMarca = request.IdMarca;
                producto.Sku = string.IsNullOrWhiteSpace(request.Sku) ? null : request.Sku.Trim();
                producto.Nombre = request.Nombre.Trim();
                producto.Descripcion = string.IsNullOrWhiteSpace(request.Descripcion) ? null : request.Descripcion.Trim();
                producto.Precio = request.Precio;
                producto.PrecioDescuento = request.PrecioDescuento;
                producto.Stock = request.Stock;
                producto.ImagenUrl = string.IsNullOrWhiteSpace(request.ImagenUrl) ? null : request.ImagenUrl.Trim();

                await _context.SaveChangesAsync();

                return (true, "Producto actualizado correctamente.", StatusCodes.Status200OK, producto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al editar producto {IdProducto}.", idProducto);
                return (false, "Ocurrió un error interno al actualizar el producto.", StatusCodes.Status500InternalServerError, null);
            }
        }

        // ==========================================
        // 3. ELIMINAR PRODUCTO (BORRADO LÓGICO)
        // ==========================================
        public async Task<(bool Exito, string Mensaje, int Codigo)> EliminarProductoAsync(int idUsuario, int idProducto, bool esAdmin)
        {
            try
            {
                var producto = await _context.Productos.FirstOrDefaultAsync(p => p.IdProducto == idProducto && p.Activo);
                if (producto == null)
                    return (false, "El producto no existe o ya fue eliminado.", StatusCodes.Status404NotFound);

                var validacion = await _validacionService.ValidarPropietarioComercioAsync(
                    idUsuario, producto.IdComercio, esAdmin);

                if (!validacion.Exito)
                    return (false, validacion.Mensaje, validacion.Codigo);

                producto.Activo = false;
                await _context.SaveChangesAsync();

                return (true, "Producto eliminado correctamente.", StatusCodes.Status200OK);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al eliminar producto {IdProducto}.", idProducto);
                return (false, "Ocurrió un error interno al eliminar el producto.", StatusCodes.Status500InternalServerError);
            }
        }

        // ==========================================
        // 4. CONSULTAS DE PRODUCTOS
        // ==========================================
        public async Task<(bool Exito, string Mensaje, int Codigo, object? Productos)> ObtenerProductosPorComercioAsync(int idComercio)
        {
            var comercioExiste = await _context.Comercios.AnyAsync(c => c.IdComercio == idComercio);
            if (!comercioExiste)
                return (false, "El comercio indicado no existe.", StatusCodes.Status404NotFound, null);

            var productos = await _context.Productos
                .Where(p => p.IdComercio == idComercio && p.Activo)
                .OrderByDescending(p => p.FechaCreacion)
                .ToListAsync();

            return (true, "Productos obtenidos correctamente.", StatusCodes.Status200OK, productos);
        }

        public async Task<(bool Exito, string Mensaje, int Codigo, Producto? Producto)> ObtenerProductoPorIdAsync(int idProducto)
        {
            var producto = await _context.Productos.FirstOrDefaultAsync(p => p.IdProducto == idProducto && p.Activo);
            if (producto == null)
                return (false, "Producto no encontrado.", StatusCodes.Status404NotFound, null);

            return (true, "Producto obtenido correctamente.", StatusCodes.Status200OK, producto);
        }

        public async Task<(bool Exito, string Mensaje, int Codigo, object? Productos)> ObtenerTodosLosProductosGlobalAsync()
        {
            var productos = await (
                from p in _context.Productos
                join c in _context.Comercios on p.IdComercio equals c.IdComercio
                where p.Activo
                orderby p.FechaCreacion descending
                select new
                {
                    p.IdProducto,
                    p.IdComercio,
                    NombreComercio = c.NombreComercial,
                    p.IdCategoria,
                    p.IdEspecie,
                    p.IdMarca,
                    p.Sku,
                    p.Nombre,
                    p.Descripcion,
                    p.Precio,
                    p.PrecioDescuento,
                    p.Stock,
                    p.ImagenUrl,
                    p.Activo,
                    p.FechaCreacion
                }
            ).ToListAsync();

            return (true, "Productos globales obtenidos correctamente.", StatusCodes.Status200OK, productos);
        }

        // ==========================================
        // 5. AUXILIARES Y CATÁLOGOS
        // ==========================================
        public async Task<int?> ObtenerIdAlmacenPorUsuarioAsync(int idUsuario)
        {
            var idAlmacen = await (from c in _context.Comercios
                                   join p in _context.PersonasLegales on c.IdPersonaLegal equals p.IdPersonaLegal
                                   where p.IdUsuario == idUsuario && c.IdTipoComercio == ComercioValidacionService.TIPO_COMERCIO_ALMACEN
                                   select c.IdComercio).FirstOrDefaultAsync();
                                   
            return idAlmacen > 0 ? idAlmacen : null;
        }

        public async Task<object> ObtenerAlmacenesAprobadosAsync()
        {
            return await _context.Comercios
                .Where(c => c.IdTipoComercio == ComercioValidacionService.TIPO_COMERCIO_ALMACEN 
                         && c.IdEstadoSolicitud == 2)
                .Select(c => new { idComercio = c.IdComercio, nombreComercial = c.NombreComercial })
                .ToListAsync();
        }

        public async Task<string> GuardarImagenAsync(IFormFile archivo)
        {
            var carpetaDestino = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "productos");
            
            if (!Directory.Exists(carpetaDestino))
                Directory.CreateDirectory(carpetaDestino);

            var nombreArchivo = $"{Guid.NewGuid()}{Path.GetExtension(archivo.FileName)}";
            var rutaFisica = Path.Combine(carpetaDestino, nombreArchivo);

            using (var stream = new FileStream(rutaFisica, FileMode.Create))
            {
                await archivo.CopyToAsync(stream);
            }

            return $"/uploads/productos/{nombreArchivo}";
        }

        public async Task<object> ObtenerCategoriasAsync()
        {
            return await _context.CategoriasProductoCat
                .Select(c => new { idCategoria = c.IdCategoria, nombre = c.Nombre }) 
                .ToListAsync();
        }

        public async Task<object> ObtenerEspeciesAsync()
        {
            return await _context.EspeciesCat
                .Select(e => new { idEspecie = e.IdEspecie, nombre = e.Nombre })
                .ToListAsync();
        }

        public async Task<object> ObtenerMarcasAsync()
        {
            return await _context.MarcasCat
                .Select(m => new { idMarca = m.IdMarca, nombre = m.Nombre })
                .ToListAsync();
        }
    }
}