using HuellasVitalesAPI.Backend.Models.DTOs;
using HuellasVitalesAPI.Backend.Models.Entidades;
using HuellasVitalesAPI.Backend.Models.Enums;
using HuellitasVitalesAPI.Data;
using Microsoft.EntityFrameworkCore;

namespace HuellitasVitalesAPI.Services
{
    /// <summary>
    /// Lógica de negocio del catálogo de servicios veterinarios.
    /// La eliminación es siempre lógica (IsActive = false): nunca se borra la fila,
    /// para no romper las citas históricas que referencian el servicio.
    /// </summary>
    public class ServicioVeterinarioService
    {
        private readonly ConexionDB _context;
        private readonly ILogger<ServicioVeterinarioService> _logger;

        public ServicioVeterinarioService(ConexionDB context, ILogger<ServicioVeterinarioService> logger)
        {
            _context = context;
            _logger = logger;
        }

        // ─── LISTAR ───
        // soloActivos = true  -> catálogo público (lo que se puede agendar)
        // soloActivos = false -> vista de gestión del administrador (activos + inactivos)
        public async Task<List<ServicioVeterinarioResponse>> ListarAsync(bool soloActivos)
        {
            var query = _context.ServiciosVeterinarios.AsNoTracking();
            if (soloActivos) query = query.Where(s => s.IsActive);

            // Se materializa primero y se mapea en memoria: la etiqueta del tipo
            // (Tipo.Nombre()) no es traducible a SQL.
            var entidades = await query.OrderBy(s => s.Nombre).ToListAsync();
            return entidades.Select(Mapear).ToList();
        }

        // ─── OBTENER UNO ───
        public async Task<ServicioVeterinarioResponse?> ObtenerAsync(int id, bool soloActivos)
        {
            var query = _context.ServiciosVeterinarios.AsNoTracking().Where(s => s.IdServicioVeterinario == id);
            if (soloActivos) query = query.Where(s => s.IsActive);

            var entidad = await query.FirstOrDefaultAsync();
            return entidad == null ? null : Mapear(entidad);
        }

        // ─── CREAR ───
        public async Task<(bool Exito, string Mensaje, int Codigo, ServicioVeterinarioResponse? Datos)> CrearAsync(ServicioVeterinarioRequest req)
        {
            try
            {
                // Evita duplicados por nombre (case-insensitive) entre los servicios vigentes.
                var yaExiste = await _context.ServiciosVeterinarios
                    .AnyAsync(s => s.IsActive && s.Nombre.ToLower() == req.Nombre.Trim().ToLower());
                if (yaExiste)
                    return (false, "Ya existe un servicio activo con ese nombre.", 409, null);

                var servicio = new VeterinaryService
                {
                    Nombre = req.Nombre.Trim(),
                    Descripcion = string.IsNullOrWhiteSpace(req.Descripcion) ? null : req.Descripcion.Trim(),
                    DuracionMinutos = req.DuracionMinutos,
                    Precio = req.Precio,
                    Tipo = req.Tipo,
                    IsActive = true,
                    FechaCreacion = DateTime.Now
                };

                _context.ServiciosVeterinarios.Add(servicio);
                await _context.SaveChangesAsync();

                return (true, "Servicio creado con éxito.", 201, Mapear(servicio));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al crear el servicio {Nombre}", req.Nombre);
                return (false, "Ocurrió un error interno al crear el servicio.", 500, null);
            }
        }

        // ─── ACTUALIZAR ───
        public async Task<(bool Exito, string Mensaje, int Codigo)> ActualizarAsync(int id, ServicioVeterinarioRequest req)
        {
            try
            {
                var servicio = await _context.ServiciosVeterinarios.FirstOrDefaultAsync(s => s.IdServicioVeterinario == id);
                if (servicio == null)
                    return (false, "El servicio indicado no existe.", 404);

                var nombreDuplicado = await _context.ServiciosVeterinarios.AnyAsync(s =>
                    s.IdServicioVeterinario != id &&
                    s.IsActive &&
                    s.Nombre.ToLower() == req.Nombre.Trim().ToLower());
                if (nombreDuplicado)
                    return (false, "Ya existe otro servicio activo con ese nombre.", 409);

                servicio.Nombre = req.Nombre.Trim();
                servicio.Descripcion = string.IsNullOrWhiteSpace(req.Descripcion) ? null : req.Descripcion.Trim();
                servicio.DuracionMinutos = req.DuracionMinutos;
                servicio.Precio = req.Precio;
                servicio.Tipo = req.Tipo;

                await _context.SaveChangesAsync();
                return (true, "Servicio actualizado con éxito.", 200);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al actualizar el servicio {Id}", id);
                return (false, "Ocurrió un error interno al actualizar el servicio.", 500);
            }
        }

        // ─── DESACTIVAR (borrado lógico) ───
        public async Task<(bool Exito, string Mensaje, int Codigo)> DesactivarAsync(int id)
        {
            try
            {
                var servicio = await _context.ServiciosVeterinarios.FirstOrDefaultAsync(s => s.IdServicioVeterinario == id);
                if (servicio == null)
                    return (false, "El servicio indicado no existe.", 404);

                if (!servicio.IsActive)
                    return (false, "El servicio ya se encuentra desactivado.", 409);

                servicio.IsActive = false; // No se elimina la fila: se conservan las citas históricas.
                await _context.SaveChangesAsync();

                _logger.LogInformation("Servicio {Id} desactivado (borrado lógico).", id);
                return (true, "Servicio desactivado. Ya no aparecerá al agendar citas nuevas.", 200);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al desactivar el servicio {Id}", id);
                return (false, "Ocurrió un error interno al desactivar el servicio.", 500);
            }
        }

        // ─── REACTIVAR ───
        public async Task<(bool Exito, string Mensaje, int Codigo)> ReactivarAsync(int id)
        {
            try
            {
                var servicio = await _context.ServiciosVeterinarios.FirstOrDefaultAsync(s => s.IdServicioVeterinario == id);
                if (servicio == null)
                    return (false, "El servicio indicado no existe.", 404);

                if (servicio.IsActive)
                    return (false, "El servicio ya se encuentra activo.", 409);

                servicio.IsActive = true;
                await _context.SaveChangesAsync();
                return (true, "Servicio reactivado. Vuelve a estar disponible al agendar.", 200);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al reactivar el servicio {Id}", id);
                return (false, "Ocurrió un error interno al reactivar el servicio.", 500);
            }
        }

        // Proyección entidad -> DTO de respuesta (incluye la etiqueta legible del tipo).
        private static ServicioVeterinarioResponse Mapear(VeterinaryService s) => new()
        {
            IdServicioVeterinario = s.IdServicioVeterinario,
            Nombre = s.Nombre,
            Descripcion = s.Descripcion,
            DuracionMinutos = s.DuracionMinutos,
            Precio = s.Precio,
            Tipo = s.Tipo,
            TipoNombre = s.Tipo.Nombre(),
            IsActive = s.IsActive
        };
    }
}
