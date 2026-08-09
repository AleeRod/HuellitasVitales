using HuellasVitalesAPI.Backend.Models.DTOs;
using HuellasVitalesAPI.Backend.Models.Entidades;
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

                // Aplicamos el LEFT JOIN para las marcas, así no perdemos los productos genéricos (IdMarca = null)
                var categoriasConProductos = await _context.CategoriasProductoCat
                    .Select(c => new
                    {
                        IdCategoriaProducto = c.IdCategoria,
                        NombreCategoria = c.Nombre,
                        Productos = (from p in _context.Productos
                                     join com in _context.Comercios on p.IdComercio equals com.IdComercio
                                     // 👇 Left Join con MarcasCat
                                     join m in _context.MarcasCat on p.IdMarca equals m.IdMarca into marcaGroup
                                     from m in marcaGroup.DefaultIfEmpty()
                                     where p.IdCategoria == c.IdCategoria && p.Activo == true
                                     select new
                                     {
                                         IdProducto = p.IdProducto,
                                         NombreProducto = p.Nombre,
                                         IdComercio = com.IdComercio,
                                         NombreComercio = com.NombreComercial,
                                         IdCategoriaProducto = p.IdCategoria,
                                         // 👇 Manejo de nulos para la marca
                                         IdMarca = p.IdMarca ?? 0,
                                         NombreMarca = m != null ? m.Nombre : "Genérica",
                                         Precio = p.Precio,
                                         PrecioDescuento = p.PrecioDescuento,
                                         ImagenUrl = p.ImagenUrl ?? "",
                                         Agotado = false
                                     }).ToList()
                    })
                    .Where(cat => cat.Productos.Any())
                    .ToListAsync();

                List<object> servicios = new List<object>();
                
                if (_context.Servicios != null && _context.Comercios != null && _context.TiposServicioCat != null)
                {
                    servicios = await (from s in _context.Servicios
                                     join com in _context.Comercios on s.IdComercio equals com.IdComercio
                                     join t in _context.TiposServicioCat on (int)s.IdTipoServicio equals (int)t.IdTipoServicio
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
                // Protegemos contra nulos o espacios en blanco
                string terminoLower = string.IsNullOrWhiteSpace(termino) ? "" : termino.ToLower();

                // 1. Buscar coincidencias en PRODUCTOS
                var resultadosProductos = await (from p in _context.Productos
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
                                            TipoResultado = "Producto" 
                                        }).ToListAsync();

                // 2. Buscar coincidencias en SERVICIOS
                var resultadosServicios = await (from s in _context.Servicios
                                        join t in _context.TiposServicioCat on (int)s.IdTipoServicio equals (int)t.IdTipoServicio
                                        join com in _context.Comercios on s.IdComercio equals com.IdComercio
                                        where (s.Nombre.ToLower().Contains(terminoLower) || 
                                               com.NombreComercial.ToLower().Contains(terminoLower)) 
                                           && s.Activo == true
                                        select new ResultadoBusquedaDto
                                        {
                                            IdProducto = s.IdServicio, 
                                            NombreProducto = s.Nombre,
                                            Descripcion = s.Descripcion ?? $"Duración: {s.DuracionMinutos} min", 
                                            Precio = s.Precio,
                                            PrecioDescuento = s.Precio, 
                                            ImagenUrl = "", 
                                            Categoria = t.Nombre, 
                                            NombreComercio = com.NombreComercial,
                                            TipoResultado = "Servicio" 
                                        }).ToListAsync();

                // 3. Unir las dos listas y devolverlas juntas
                resultadosProductos.AddRange(resultadosServicios);
                
                return resultadosProductos;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al buscar en el marketplace con el término: {Termino}", termino);
                throw new Exception($"Error real: {ex.Message} -> Inner: {ex.InnerException?.Message}");
            }
        }
    }
}