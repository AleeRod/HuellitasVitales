using HuellasVitalesAPI.Backend.Models.DTOs;
using HuellitasVitalesAPI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace HuellitasVitalesAPI.Controllers
{
    // Vistas de plataforma completa para el panel de Administración (Mascotas y Citas) — ver
    // AdminService para el detalle de por qué estas viven acá y no en UsuarioController/
    // CitaController (no tienen un dueño natural en ningún controller existente: no están
    // acotadas a un usuario, un veterinario ni un comercio puntual).
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class AdminController : ControllerBase
    {
        private readonly AdminService _adminService;
        private readonly ILogger<AdminController> _logger;

        public AdminController(AdminService adminService, ILogger<AdminController> logger)
        {
            _adminService = adminService;
            _logger = logger;
        }

        // GET api/admin/mascotas?busqueda=
        [HttpGet("mascotas")]
        public async Task<IActionResult> ListarMascotas([FromQuery] string? busqueda)
        {
            if (!EsUsuarioAdmin())
                return StatusCode(403, new { success = false, mensaje = "Acceso denegado. Se requieren permisos de Administrador." });

            try
            {
                var mascotas = await _adminService.ListarMascotasAsync(busqueda);
                return Ok(new { success = true, mascotas });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al listar mascotas para el panel de Administración.");
                return StatusCode(500, new { success = false, mensaje = "Ocurrió un error al obtener las mascotas." });
            }
        }

        // POST api/admin/mascotas
        // El admin registra una mascota a nombre de cualquier usuario existente.
        [HttpPost("mascotas")]
        public async Task<IActionResult> CrearMascotaParaUsuario([FromBody] CrearMascotaAdminRequest request)
        {
            if (!EsUsuarioAdmin())
                return StatusCode(403, new { success = false, mensaje = "Acceso denegado. Se requieren permisos de Administrador." });

            try
            {
                var (exito, mensaje, mascota) = await _adminService.CrearMascotaParaUsuarioAsync(request);
                if (!exito)
                    return BadRequest(new { success = false, mensaje });

                return Ok(new { success = true, mensaje, mascota });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al crear una mascota desde el panel de Administración.");
                return StatusCode(500, new { success = false, mensaje = "Ocurrió un error al registrar la mascota." });
            }
        }

        // DELETE api/admin/mascotas/{idMascota}
        // El admin da de baja la mascota de cualquier cliente (borrado lógico, Activo = false).
        [HttpDelete("mascotas/{idMascota:int}")]
        public async Task<IActionResult> EliminarMascota(int idMascota)
        {
            if (!EsUsuarioAdmin())
                return StatusCode(403, new { success = false, mensaje = "Acceso denegado. Se requieren permisos de Administrador." });

            try
            {
                var (exito, mensaje) = await _adminService.EliminarMascotaAsync(idMascota);
                if (!exito)
                    return BadRequest(new { success = false, mensaje });

                return Ok(new { success = true, mensaje });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al eliminar la mascota {IdMascota} desde el panel de Administración.", idMascota);
                return StatusCode(500, new { success = false, mensaje = "Ocurrió un error al eliminar la mascota." });
            }
        }

        // GET api/admin/citas?estado=&idComercio=&desde=&hasta=
        [HttpGet("citas")]
        public async Task<IActionResult> ListarCitas(
            [FromQuery] short? estado,
            [FromQuery] int? idComercio,
            [FromQuery] DateTime? desde,
            [FromQuery] DateTime? hasta)
        {
            if (!EsUsuarioAdmin())
                return StatusCode(403, new { success = false, mensaje = "Acceso denegado. Se requieren permisos de Administrador." });

            try
            {
                var citas = await _adminService.ListarCitasAsync(estado, idComercio, desde, hasta);
                return Ok(new { success = true, citas });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al listar citas para el panel de Administración.");
                return StatusCode(500, new { success = false, mensaje = "Ocurrió un error al obtener las citas." });
            }
        }

        // GET api/admin/citas/estadisticas
        [HttpGet("citas/estadisticas")]
        public async Task<IActionResult> ObtenerEstadisticasCitas()
        {
            if (!EsUsuarioAdmin())
                return StatusCode(403, new { success = false, mensaje = "Acceso denegado. Se requieren permisos de Administrador." });

            try
            {
                var estadisticas = await _adminService.ObtenerEstadisticasCitasAsync();
                return Ok(new { success = true, estadisticas });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener estadísticas de citas para el panel de Administración.");
                return StatusCode(500, new { success = false, mensaje = "Ocurrió un error al obtener las estadísticas de citas." });
            }
        }

        private bool EsUsuarioAdmin()
        {
            var rolUsuario = User.FindFirst("rol")?.Value
                            ?? User.FindFirst(ClaimTypes.Role)?.Value
                            ?? User.FindFirst("IdRol")?.Value
                            ?? User.FindFirst("idRol")?.Value
                            ?? User.FindFirst("http://schemas.microsoft.com/ws/2008/06/identity/claims/role")?.Value;

            if (string.IsNullOrEmpty(rolUsuario)) return false;

            return rolUsuario == "1"
                || string.Equals(rolUsuario, "ADMINISTRADOR", StringComparison.OrdinalIgnoreCase)
                || string.Equals(rolUsuario, "Admin", StringComparison.OrdinalIgnoreCase);
        }
    }
}
