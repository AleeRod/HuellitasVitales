using HuellasVitalesAPI.Backend.Models.Entidades;
using HuellitasVitalesAPI.Data;
using Microsoft.EntityFrameworkCore;

namespace HuellitasVitalesAPI.Services
{
    public class CarritoService
    {
        private readonly ConexionDB _context;
        private readonly ILogger<CarritoService> _logger;

        public CarritoService(ConexionDB context, ILogger<CarritoService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<(bool Exito, string Mensaje, int Codigo)> AgregarProductoAsync(
            long idUsuario, int idProducto, int cantidad)
        {
            try
            {
                if (cantidad <= 0)
                    return (false, "La cantidad debe ser mayor a cero.", 400);

                var producto = await _context.Productos
                    .FirstOrDefaultAsync(p => p.IdProducto == idProducto && p.Activo == true);

                if (producto == null)
                    return (false, "El producto no existe o no está disponible.", 404);

                if (producto.Stock.HasValue && producto.Stock.Value < cantidad)
                    return (false, "No hay suficiente stock disponible para esa cantidad.", 409);

                // Busca el carrito del usuario, o lo crea si es su primera vez
                var carrito = await _context.Carritos
                    .FirstOrDefaultAsync(c => c.IdUsuario == idUsuario);

                if (carrito == null)
                {
                    carrito = new Carrito
                    {
                        IdUsuario = idUsuario,
                        FechaCreacion = DateTime.UtcNow
                    };
                    _context.Carritos.Add(carrito);
                    await _context.SaveChangesAsync();
                }

                // Si el producto ya estaba en el carrito, solo suma la cantidad
                var itemExistente = await _context.CarritoItems
                    .FirstOrDefaultAsync(i => i.IdCarrito == carrito.IdCarrito && i.IdProducto == idProducto);

                var precioVigente = producto.PrecioDescuento ?? producto.Precio;

                if (itemExistente != null)
                {
                    itemExistente.Cantidad += cantidad;
                    itemExistente.PrecioUnitario = precioVigente;
                }
                else
                {
                    _context.CarritoItems.Add(new CarritoItem
                    {
                        IdCarrito = carrito.IdCarrito,
                        IdProducto = idProducto,
                        Cantidad = cantidad,
                        PrecioUnitario = precioVigente,
                        FechaAgregado = DateTime.UtcNow
                    });
                }

                await _context.SaveChangesAsync();

                return (true, "Producto agregado al carrito.", 200);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al agregar producto {IdProducto} al carrito del usuario {IdUsuario}", idProducto, idUsuario);
                return (false, "Ocurrió un error interno al agregar el producto al carrito.", 500);
            }
        }
    }
}