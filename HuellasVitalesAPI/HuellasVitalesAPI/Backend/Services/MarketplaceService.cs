using HuellasVitalesAPI.Backend.Models.DTOs;
using HuellitasVitalesAPI.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace HuellitasVitalesAPI.Services
{
    public interface IMarketplaceService
    {
        Task<List<ResultadoBusquedaDto>> BuscarEnMarketplaceAsync(string termino);
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
                
                // CAMBIO TEMPORAL: Retornar el error exacto para depurar en Swagger
                throw new Exception($"Error real: {ex.Message} -> Inner: {ex.InnerException?.Message}");
            }
        }
    }
}