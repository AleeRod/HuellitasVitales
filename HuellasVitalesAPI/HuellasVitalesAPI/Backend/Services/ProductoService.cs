using HuellasVitalesAPI.Backend.Models.DTOs;
using HuellasVitalesAPI.Backend.Models.Entidades;
using HuellitasVitalesAPI.Data;

namespace HuellitasVitalesAPI.Services
{
    public class ProductoService
    {
        private readonly ConexionDB _context;
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

                _logger.LogInformation(
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
