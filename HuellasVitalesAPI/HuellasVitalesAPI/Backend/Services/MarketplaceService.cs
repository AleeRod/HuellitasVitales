using HuellasVitalesAPI.Backend.Models.DTOs;
using HuellasVitalesAPI.Backend.Models.Entidades;   // 👈 NUEVO
using HuellitasVitalesAPI.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace HuellitasVitalesAPI.Services
{
    public interface IMarketplaceService
    {
        Task<List<ResultadoBusquedaDto>> BuscarEnMarketplaceAsync(string termino);
        Task<object> ObtenerCatalogoCompletoAsync();
    }

    public class MarketplaceService : IMarketplaceService
    {
        private readonly ConexionDB _context;
        private readonly ILogger<MarketplaceService> _logger;

        public MarketplaceService(ConexionDB context, ILogger<MarketplaceService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<object> ObtenerCatalogoCompletoAsync()
        {
            try
            {
                if (_context.CategoriasProductoCat == null)
                {
                    return new { categorias = new List<object>(), servicios = new List<object>() };
                }

                var listaProductosSegura = _context.Productos != null
                    ? (IQueryable<Producto>)_context.Productos
                    : Enumerable.Empty<Producto>().AsQueryable();

                var listaComerciosSegura = _context.Comercios != null
                    ? (IQueryable<Comercio>)_context.Comercios
                    : Enumerable.Empty<Comercio>().AsQueryable();

                var categoriasConProductos = await _context.CategoriasProductoCat
                    .Select(c => new
                    {
                        IdCategoriaProducto = c.IdCategoria,
                        NombreCategoria = c.Nombre,
                        Productos = listaProductosSegura
                            .Where(p => p.IdCategoria == c.IdCategoria && p.Activo == true)
                            .Join(listaComerciosSegura, p => p.IdComercio, com => com.IdComercio, (p, com) => new { p, com })
                            .Select(x => new
                            {
                                IdProducto = x.p.IdProducto,
                                NombreProducto = x.p.Nombre,
                                IdComercio = x.com.IdComercio,
                                NombreComercio = x.com.NombreComercial,
                                IdCategoriaProducto = x.p.IdCategoria,
                                IdMarca = 1,
                                NombreMarca = x.com.NombreComercial,
                                Precio = x.p.Precio,
                                PrecioDescuento = x.p.PrecioDescuento,
                                ImagenUrl = x.p.ImagenUrl ?? "",
                                Agotado = false
                            }).ToList()
                    })
                    .Where(cat => cat.Productos.Any())
                    .ToListAsync();

                List<object> servicios = new List<object>();
                if (_context.Servicios != null && _context.Comercios != null && _context.TipoServicioCat != null)
                {
                    servicios = await (from s in _context.Servicios
                                     join com in _context.Comercios on s.IdComercio equals com.IdComercio
                                     join t in _context.TipoServicioCat on s.IdTipoServicio equals t.IdTipoServicio
                                     where s.Activo == true
                                     select new
                                     {
                                         IdServicio = s.IdServicio,
                                         NombreServicio = s.Nombre,
                                         IdTipoServicio = (int)s.IdTipoServicio,
                                         TipoServicio = t.Nombre,
                                         IdComercio = com.IdComercio,
                                         NombreComercio = com.NombreComercial,
                                         Precio = s.Precio,
                                         DuracionMinutos = s.DuracionMinutos
                                     }).ToListAsync<object>();
                }

                return new
                {
                    categorias = categoriasConProductos,
                    servicios = servicios
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener el catálogo completo del marketplace.");
                throw new Exception($"Error real: {ex.Message}");
            }
        }

        public async Task<List<ResultadoBusquedaDto>> BuscarEnMarketplaceAsync(string termino)
        {
            try
            {
                string terminoLower = termino.ToLower();

                var resultados = await (from p in _context.Productos
                                        join c in _context.CategoriasProductoCat on p.IdCategoria equals c.IdCategoria
                                        join com in _context.Comercios on p.IdComercio equals com.IdComercio
                                        where (p.Nombre.ToLower().Contains(terminoLower) || 
                                               com.NombreComercial.ToLower().Contains(terminoLower)) 
                                           && p.Activo == true
                                        select new ResultadoBusquedaDto
                                        {
                                            IdProducto = p.IdProducto,
                                            NombreProducto = p.Nombre,
                                            Descripcion = p.Descripcion ?? "",
                                            Precio = p.Precio,
                                            PrecioDescuento = p.PrecioDescuento,
                                            ImagenUrl = p.ImagenUrl ?? "",
                                            Categoria = c.Nombre,
                                            NombreComercio = com.NombreComercial,
                                            TipoResultado = p.Nombre.ToLower().Contains(terminoLower) ? "Producto" : "Comercio"
                                        }).ToListAsync();

                return resultados;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al buscar en el marketplace con el término: {Termino}", termino);
                throw new Exception($"Error real: {ex.Message} -> Inner: {ex.InnerException?.Message}");
            }
        }
    }
}