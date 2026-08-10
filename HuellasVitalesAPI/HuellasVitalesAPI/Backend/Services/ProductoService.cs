using HuellasVitalesAPI.Backend.Models.DTOs;
using HuellasVitalesAPI.Backend.Models.Entidades;
using HuellitasVitalesAPI.Data;
<<<<<<< HEAD
using Microsoft.EntityFrameworkCore;
=======
>>>>>>> feature-GestionCarrito

namespace HuellitasVitalesAPI.Services
{
    public class ProductoService
    {
        private readonly ConexionDB _context;
<<<<<<< HEAD
        private readonly ILogger<ProductoService> _logger;

        public ProductoService(ConexionDB context, ILogger<ProductoService> logger)
        {
            _context = context;
            _logger = logger;
        }

        // Crea un producto únicamente si el usuario autenticado
        // es propietario del comercio indicado.
        public async Task<(bool Exito, string Mensaje, int Codigo, Producto? Producto)>
            CrearProductoAsync(int idUsuario, CrearProductoRequest request)
        {
            try
            {
                // Seguridad: NO se confía solamente en IdComercio enviado por el frontend.
                // Se valida que ese comercio pertenezca a una PersonaLegal del usuario logueado.
                var comercio = await (
                    from c in _context.Comercios
                    join p in _context.PersonasLegales
                        on c.IdPersonaLegal equals p.IdPersonaLegal
                    where c.IdComercio == request.IdComercio
                          && p.IdUsuario == idUsuario
                    select c
                ).FirstOrDefaultAsync();

                if (comercio == null)
                {
                    return (
                        false,
                        "No tienes permisos para registrar productos en este comercio.",
                        StatusCodes.Status403Forbidden,
                        null
                    );
                }

                // 2 = APROBADO, según la lógica actual de ComercioService.
                if (comercio.IdEstadoSolicitud != 2)
                {
                    return (
                        false,
                        "El comercio debe estar aprobado antes de registrar productos.",
                        StatusCodes.Status403Forbidden,
                        null
                    );
                }

                var categoriaExiste = await _context.CategoriasProductoCat
                    .AnyAsync(c => c.IdCategoria == request.IdCategoria);

                if (!categoriaExiste)
                {
                    return (
                        false,
                        "La categoría indicada no existe.",
                        StatusCodes.Status400BadRequest,
                        null
                    );
                }
=======
        private readonly ComercioValidacionService _validacion;
        private readonly ILogger<ProductoService> _logger;

        public ProductoService(
            ConexionDB context,
            ComercioValidacionService validacion,
            ILogger<ProductoService> logger)
        {
            _context = context;
            _validacion = validacion;
            _logger = logger;
        }

        // ─── REGISTRAR UN PRODUCTO EN UN ALMACÉN ───
        // Codigo = código HTTP sugerido para que el controlador lo retorne.
        public async Task<(bool Exito, string Mensaje, int Codigo, int IdProducto)> CrearAsync(
            int idUsuario, CrearProductoRequest request)
        {
            try
            {
                // REGLA DE NEGOCIO: los productos solo existen en almacenes.
                var validacion = await _validacion.ValidarComercioHabilitadoAsync(
                    idUsuario, request.IdComercio, ComercioValidacionService.TIPO_COMERCIO_ALMACEN);

                if (!validacion.Exito)
                    return (false, validacion.Mensaje, validacion.Codigo, 0);

                // El descuento nunca puede quedar por encima del precio base.
                if (request.PrecioDescuento.HasValue && request.PrecioDescuento.Value >= request.Precio)
                    return (false, "El precio de descuento debe ser menor que el precio base.", 400, 0);
>>>>>>> feature-GestionCarrito

                var producto = new Producto
                {
                    IdComercio = request.IdComercio,
                    IdCategoria = request.IdCategoria,
<<<<<<< HEAD
                    Nombre = request.Nombre.Trim(),
                    Descripcion = string.IsNullOrWhiteSpace(request.Descripcion)
                        ? null
                        : request.Descripcion.Trim(),
                    Precio = request.Precio,
                    Stock = request.Stock,
                    ImagenUrl = string.IsNullOrWhiteSpace(request.ImagenUrl)
                        ? null
                        : request.ImagenUrl.Trim(),
=======
                    IdEspecie = request.IdEspecie,
                    IdMarca = request.IdMarca,
                    Sku = string.IsNullOrWhiteSpace(request.Sku) ? null : request.Sku.Trim(),
                    Nombre = request.Nombre.Trim(),
                    Descripcion = string.IsNullOrWhiteSpace(request.Descripcion) ? null : request.Descripcion.Trim(),
                    Precio = request.Precio,
                    PrecioDescuento = request.PrecioDescuento,
                    Stock = request.Stock,
                    ImagenUrl = string.IsNullOrWhiteSpace(request.ImagenUrl) ? null : request.ImagenUrl.Trim(),
>>>>>>> feature-GestionCarrito
                    Activo = true,
                    FechaCreacion = DateTime.UtcNow
                };

                _context.Productos.Add(producto);
                await _context.SaveChangesAsync();

                _logger.LogInformation(
<<<<<<< HEAD
                    "Producto {IdProducto} creado por usuario {IdUsuario} en comercio {IdComercio}.",
                    producto.IdProducto,
                    idUsuario,
                    producto.IdComercio
                );

                return (
                    true,
                    "Producto creado correctamente.",
                    StatusCodes.Status201Created,
                    producto
                );
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Error al crear producto para usuario {IdUsuario}.",
                    idUsuario
                );

                return (
                    false,
                    "Ocurrió un error interno al crear el producto.",
                    StatusCodes.Status500InternalServerError,
                    null
                );
            }
        }
      public async Task<(bool Exito, string Mensaje, int Codigo, Producto? Producto)>
    EditarProductoAsync(int idUsuario, int idProducto, EditarProductoRequest request)
{
    try
    {
        var producto = await (
            from prod in _context.Productos
            join com in _context.Comercios
                on prod.IdComercio equals com.IdComercio
            join persona in _context.PersonasLegales
                on com.IdPersonaLegal equals persona.IdPersonaLegal
            where prod.IdProducto == idProducto
                  && persona.IdUsuario == idUsuario
                  && prod.Activo
            select prod
        ).FirstOrDefaultAsync();

        if (producto == null)
        {
            return (
                false,
                "El producto no existe o no pertenece a tu comercio.",
                StatusCodes.Status404NotFound,
                null
            );
        }

        var categoriaExiste = await _context.CategoriasProductoCat
            .AnyAsync(c => c.IdCategoria == request.IdCategoria);

        if (!categoriaExiste)
        {
            return (
                false,
                "La categoría indicada no existe.",
                StatusCodes.Status400BadRequest,
                null
            );
        }

        if (request.PrecioDescuento.HasValue &&
            request.PrecioDescuento.Value < 0)
        {
            return (
                false,
                "El precio de descuento no puede ser negativo.",
                StatusCodes.Status400BadRequest,
                null
            );
        }

        if (request.PrecioDescuento.HasValue &&
            request.PrecioDescuento.Value > request.Precio)
        {
            return (
                false,
                "El precio de descuento no puede ser mayor que el precio normal.",
                StatusCodes.Status400BadRequest,
                null
            );
        }

        producto.IdCategoria = request.IdCategoria;
        producto.Nombre = request.Nombre.Trim();
        producto.Descripcion = string.IsNullOrWhiteSpace(request.Descripcion)
            ? null
            : request.Descripcion.Trim();
        producto.Precio = request.Precio;
        producto.PrecioDescuento = request.PrecioDescuento;
        producto.Stock = request.Stock;
        producto.ImagenUrl = string.IsNullOrWhiteSpace(request.ImagenUrl)
            ? null
            : request.ImagenUrl.Trim();

        await _context.SaveChangesAsync();

        _logger.LogInformation(
            "Producto {IdProducto} editado por usuario {IdUsuario}.",
            idProducto,
            idUsuario
        );

        return (
            true,
            "Producto actualizado correctamente.",
            StatusCodes.Status200OK,
            producto
        );
    }
    catch (Exception ex)
    {
        _logger.LogError(
            ex,
            "Error al editar producto {IdProducto} para usuario {IdUsuario}.",
            idProducto,
            idUsuario
        );

        return (
            false,
            "Ocurrió un error interno al actualizar el producto.",
            StatusCodes.Status500InternalServerError,
            null
        );
    }
}

}
}
=======
                    "Producto {Producto} creado en el comercio {Comercio} por el usuario {Usuario}.",
                    producto.IdProducto, request.IdComercio, idUsuario);

                return (true, "Producto registrado con éxito.", 201, producto.IdProducto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al crear el producto en el comercio {Comercio}", request.IdComercio);
                return (false, "Ocurrió un error interno al registrar el producto.", 500, 0);
            }
        }
    }
}
>>>>>>> feature-GestionCarrito
