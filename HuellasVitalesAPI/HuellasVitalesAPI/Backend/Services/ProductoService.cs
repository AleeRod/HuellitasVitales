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

                var producto = new Producto
                {
                    IdComercio = request.IdComercio,
                    IdCategoria = request.IdCategoria,
                    Nombre = request.Nombre.Trim(),
                    Descripcion = string.IsNullOrWhiteSpace(request.Descripcion)
                        ? null
                        : request.Descripcion.Trim(),
                    Precio = request.Precio,
                    Stock = request.Stock,
                    ImagenUrl = string.IsNullOrWhiteSpace(request.ImagenUrl)
                        ? null
                        : request.ImagenUrl.Trim(),
                    Activo = true,
                    FechaCreacion = DateTime.UtcNow
                };

                _context.Productos.Add(producto);
                await _context.SaveChangesAsync();

                _logger.LogInformation(
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
    }
}
