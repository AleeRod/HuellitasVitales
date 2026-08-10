using HuellasVitalesAPI.Backend.Models.DTOs;
using HuellasVitalesAPI.Backend.Models.Entidades;
using HuellitasVitalesAPI.Data;
using Microsoft.EntityFrameworkCore;

namespace HuellitasVitalesAPI.Services
{
    /// <summary>
    /// Guarda la compra en la base de datos.
    ///
    /// El carrito vive en el navegador, así que esta es la primera vez que la
    /// compra toca el servidor. Por eso acá se vuelven a calcular los precios y
    /// se revisan las existencias: nada de lo que manda el navegador se toma
    /// como cierto salvo qué producto y cuántas unidades.
    /// </summary>
    public class OrdenService
    {
        private readonly ConexionDB _context;
        private readonly ILogger<OrdenService> _logger;

        // ESTADO_ORDEN_CAT no está mapeada; 1 es el primer estado del catálogo
        // (orden recién creada), igual criterio que el resto de las tablas *_CAT.
        private const short EstadoOrdenInicial = 1;

        public OrdenService(ConexionDB context, ILogger<OrdenService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<(bool Exito, string Mensaje, int Codigo, OrdenCreadaDTO? Orden)> CrearOrdenAsync(
            long idUsuario, List<ItemOrdenRequest> items)
        {
            if (items == null || items.Count == 0)
                return (false, "Tu carrito está vacío.", 400, null);

            if (items.Any(i => i.Cantidad <= 0))
                return (false, "Hay una cantidad inválida en tu carrito.", 400, null);

            // Un mismo producto repetido se junta en una sola línea.
            var pedido = items
                .GroupBy(i => i.IdProducto)
                .ToDictionary(g => g.Key, g => g.Sum(i => i.Cantidad));

            using var transaccion = await _context.Database.BeginTransactionAsync();

            try
            {
                var idsProducto = pedido.Keys.ToList();

                var productos = await _context.Productos
                    .Where(p => idsProducto.Contains(p.IdProducto) && p.Activo == true)
                    .ToListAsync();

                if (productos.Count != idsProducto.Count)
                    return (false, "Alguno de los productos ya no está disponible. Revisá tu carrito.", 409, null);

                var detalles = new List<OrdenDetalle>();
                decimal total = 0;

                foreach (var producto in productos)
                {
                    var cantidad = pedido[producto.IdProducto];

                    if (producto.Stock.HasValue && producto.Stock.Value < cantidad)
                        return (false, $"Solo quedan {producto.Stock.Value} unidades de {producto.Nombre}.", 409, null);

                    // El precio se toma de la base, no del navegador.
                    var precioUnitario = producto.PrecioDescuento ?? producto.Precio;
                    total += precioUnitario * cantidad;

                    detalles.Add(new OrdenDetalle
                    {
                        IdProducto = producto.IdProducto,
                        Cantidad = cantidad,
                        PrecioUnitario = precioUnitario
                    });

                    // Se descuenta lo vendido para no vender dos veces lo mismo.
                    if (producto.Stock.HasValue)
                        producto.Stock = producto.Stock.Value - cantidad;
                }

                var orden = new Orden
                {
                    IdUsuario = idUsuario,
                    IdEstadoOrden = EstadoOrdenInicial,
                    Total = total,
                    FechaOrden = DateTime.UtcNow,
                    Detalles = detalles
                };

                _context.Ordenes.Add(orden);
                await _context.SaveChangesAsync();
                await transaccion.CommitAsync();

                return (true, "Compra registrada con éxito.", 200, new OrdenCreadaDTO
                {
                    IdOrden = orden.IdOrden,
                    Total = orden.Total,
                    FechaOrden = orden.FechaOrden,
                    CantidadProductos = detalles.Sum(d => d.Cantidad)
                });
            }
            catch (Exception ex)
            {
                await transaccion.RollbackAsync();
                _logger.LogError(ex, "Error al crear la orden del usuario {IdUsuario}", idUsuario);
                return (false, "Ocurrió un error al registrar tu compra.", 500, null);
            }
        }
    }
}
