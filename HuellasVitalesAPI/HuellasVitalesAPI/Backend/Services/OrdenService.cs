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

        // El checkout es una simulación: el pago (elegido en ModalMetodoPago) ya "ocurrió"
        // antes de que exista la orden, así que el único estado que este servicio produce hoy
        // es el de compra completada. Mismo criterio hardcodeado que ya usa el proyecto para
        // ESPECIE_CAT en UsuarioService, mientras ESTADO_ORDEN_CAT no tenga una entidad propia.
        private static string NombreEstadoOrden(short idEstadoOrden) =>
            idEstadoOrden == EstadoOrdenInicial ? "Completada" : $"Estado #{idEstadoOrden}";

        public OrdenService(ConexionDB context, ILogger<OrdenService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<(bool Exito, string Mensaje, int Codigo, OrdenCreadaDTO? Orden)> CrearOrdenAsync(
            long idUsuario, List<ItemOrdenRequest> items, string? metodoPago = null)
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
                    MetodoPago = metodoPago,
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

        /// <summary>"Mis compras": historial de órdenes del usuario, más reciente primero.</summary>
        public async Task<List<OrdenResumenDTO>> ObtenerMisOrdenesAsync(long idUsuario)
        {
            var ordenes = await _context.Ordenes
                .Where(o => o.IdUsuario == idUsuario)
                .OrderByDescending(o => o.FechaOrden)
                .Select(o => new
                {
                    o.IdOrden,
                    o.FechaOrden,
                    o.Total,
                    o.MetodoPago,
                    o.IdEstadoOrden,
                    CantidadProductos = o.Detalles.Sum(d => d.Cantidad)
                })
                .ToListAsync();

            return ordenes.Select(o => new OrdenResumenDTO
            {
                IdOrden = o.IdOrden,
                FechaOrden = o.FechaOrden,
                Total = o.Total,
                CantidadProductos = o.CantidadProductos,
                MetodoPago = o.MetodoPago,
                EstadoOrden = NombreEstadoOrden(o.IdEstadoOrden)
            }).ToList();
        }

        /// <summary>
        /// Recibo/factura interna completa de una orden puntual. Devuelve null si la orden no
        /// existe o no pertenece al usuario que la pide (nunca se muestra la compra de otro).
        /// </summary>
        public async Task<FacturaDTO?> ObtenerFacturaAsync(long idUsuario, int idOrden)
        {
            var orden = await _context.Ordenes
                .Include(o => o.Detalles)
                .FirstOrDefaultAsync(o => o.IdOrden == idOrden && o.IdUsuario == idUsuario);

            if (orden == null) return null;

            var usuario = await _context.Usuarios.FirstOrDefaultAsync(u => u.IdUsuario == (int)idUsuario);

            var idsProducto = orden.Detalles.Select(d => d.IdProducto).ToList();
            var productos = await _context.Productos
                .Where(p => idsProducto.Contains(p.IdProducto))
                .ToDictionaryAsync(p => p.IdProducto);

            return new FacturaDTO
            {
                IdOrden = orden.IdOrden,
                FechaOrden = orden.FechaOrden,
                Total = orden.Total,
                MetodoPago = orden.MetodoPago,
                EstadoOrden = NombreEstadoOrden(orden.IdEstadoOrden),
                NombreCliente = usuario != null ? $"{usuario.Nombre} {usuario.Apellidos}".Trim() : "Cliente",
                CorreoCliente = usuario?.Correo ?? string.Empty,
                Items = orden.Detalles.Select(d => new ItemFacturaDTO
                {
                    IdProducto = d.IdProducto,
                    NombreProducto = productos.TryGetValue(d.IdProducto, out var producto) ? producto.Nombre : "Producto eliminado",
                    ImagenUrl = productos.TryGetValue(d.IdProducto, out var prod2) ? prod2.ImagenUrl : null,
                    Cantidad = d.Cantidad,
                    PrecioUnitario = d.PrecioUnitario
                }).ToList()
            };
        }
    }
}
