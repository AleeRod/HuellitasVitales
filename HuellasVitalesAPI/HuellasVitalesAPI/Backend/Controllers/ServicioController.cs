using HuellasVitalesAPI.Backend.Models.DTOs;
using HuellitasVitalesAPI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace HuellitasVitalesAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ServicioController : ControllerBase
    {
        private readonly ServicioService _servicioService;

        public ServicioController(ServicioService servicioService)
        {
            _servicioService = servicioService;
        }

        // ==========================================
        // 1. CREAR SERVICIO
        // POST api/servicio
        // ==========================================
        [HttpPost]
        [Authorize]
        public async Task<IActionResult> CrearServicio([FromBody] CrearServicioRequest request)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            int? idUsuario = ObtenerIdUsuario();
            if (idUsuario == null)
                return Unauthorized(new { success = false, mensaje = "Token inválido o sin identificador de usuario." });

            var resultado = await _servicioService.CrearAsync(idUsuario.Value, request, EsUsuarioAdmin());

            if (!resultado.Exito)
                return StatusCode(resultado.Codigo, new { success = false, mensaje = resultado.Mensaje });

            return StatusCode(StatusCodes.Status201Created,
                new { success = true, mensaje = resultado.Mensaje, idServicio = resultado.IdServicio });
        }

        // ==========================================
        // 2. EDITAR SERVICIO
        // PUT api/servicio/{id}
        // ==========================================
        [HttpPut("{id:int}")]
        [Authorize]
        public async Task<IActionResult> EditarServicio(int id, [FromBody] EditarServicioRequest request)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            int? idUsuario = ObtenerIdUsuario();
            if (idUsuario == null)
                return Unauthorized(new { success = false, mensaje = "Token inválido o sin identificador de usuario." });

            var resultado = await _servicioService.EditarAsync(idUsuario.Value, id, request, EsUsuarioAdmin());
            if (!resultado.Exito)
                return StatusCode(resultado.Codigo, new { success = false, mensaje = resultado.Mensaje });

            return Ok(new { success = true, mensaje = resultado.Mensaje, servicio = resultado.Servicio });
        }

        // ==========================================
        // 3. DESACTIVAR SERVICIO (BORRADO LÓGICO)
        // DELETE api/servicio/{id}
        // ==========================================
        [HttpDelete("{id:int}")]
        [Authorize]
        public async Task<IActionResult> EliminarServicio(int id)
        {
            int? idUsuario = ObtenerIdUsuario();
            if (idUsuario == null)
                return Unauthorized(new { success = false, mensaje = "Token inválido o sin identificador de usuario." });

            var resultado = await _servicioService.EliminarAsync(idUsuario.Value, id, EsUsuarioAdmin());
            if (!resultado.Exito)
                return StatusCode(resultado.Codigo, new { success = false, mensaje = resultado.Mensaje });

            return Ok(new { success = true, mensaje = resultado.Mensaje });
        }

        // ==========================================
        // 4. CONSULTAS DE SERVICIOS
        // ==========================================

        // GET api/servicio/comercio/{idComercio}
        [HttpGet("comercio/{idComercio:int}")]
        public async Task<IActionResult> ObtenerServiciosPorComercio(int idComercio)
        {
            var resultado = await _servicioService.ObtenerPorComercioAsync(idComercio);
            if (!resultado.Exito)
                return StatusCode(resultado.Codigo, new { success = false, mensaje = resultado.Mensaje });

            return Ok(new { success = true, servicios = resultado.Servicios });
        }

        // GET api/servicio/{id}
        [HttpGet("{id:int}")]
        public async Task<IActionResult> ObtenerServicio(int id)
        {
            var resultado = await _servicioService.ObtenerPorIdAsync(id);
            if (!resultado.Exito)
                return StatusCode(resultado.Codigo, new { success = false, mensaje = resultado.Mensaje });

            return Ok(new { success = true, servicio = resultado.Servicio });
        }

        // GET api/servicio/todos-global (VISTA ADMIN GLOBAL)
        [HttpGet("todos-global")]
        [Authorize]
        public async Task<IActionResult> ObtenerTodosGlobal()
        {
            if (!EsUsuarioAdmin())
                return StatusCode(StatusCodes.Status403Forbidden, new { success = false, mensaje = "Acceso denegado. Se requieren permisos de Administrador." });

            var servicios = await _servicioService.ObtenerTodosGlobalAsync();
            return Ok(new { success = true, servicios });
        }

        // ==========================================
        // 5. AUXILIARES (VETERINARIAS)
        // ==========================================

        // GET api/servicio/mis-veterinarias
        [HttpGet("mis-veterinarias")]
        [Authorize]
        public async Task<IActionResult> ObtenerMisVeterinarias()
        {
            int? idUsuario = ObtenerIdUsuario();
            if (idUsuario == null)
                return Unauthorized(new { success = false, mensaje = "Token inválido o sin identificador de usuario." });

            var veterinarias = await _servicioService.ObtenerVeterinariasDelUsuarioAsync(idUsuario.Value);
            return Ok(new { success = true, veterinarias });
        }

        // GET api/servicio/veterinarias-lista (LISTA PARA SELECTOR DEL ADMIN)
        [HttpGet("veterinarias-lista")]
        [Authorize]
        public async Task<IActionResult> ObtenerVeterinariasLista()
        {
            var veterinarias = await _servicioService.ObtenerVeterinariasAprobadasAsync();
            return Ok(new { success = true, veterinarias });
        }

        // GET api/servicio/veterinarios-comercio/{idComercio}
        // Veterinarios que ejercen en ESA veterinaria puntual, para el selector al crear/editar
        // un servicio (nunca se ofrece un veterinario de otra clínica).
        [HttpGet("veterinarios-comercio/{idComercio:int}")]
        [Authorize]
        public async Task<IActionResult> ObtenerVeterinariosPorComercio(int idComercio)
        {
            var veterinarios = await _servicioService.ObtenerVeterinariosPorComercioAsync(idComercio);
            return Ok(new { success = true, veterinarios });
        }

        // ==========================================
        // MÉTODOS AUXILIARES PRIVADOS
        // ==========================================
        private int? ObtenerIdUsuario()
        {
            var subClaim = User.FindFirst("sub")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(subClaim, out var id) ? id : null;
        }

        private bool EsUsuarioAdmin()
        {
            var rolUsuario = User.FindFirst("rol")?.Value
                            ?? User.FindFirst(ClaimTypes.Role)?.Value
                            ?? User.FindFirst("IdRol")?.Value
                            ?? User.FindFirst("idRol")?.Value
                            ?? User.FindFirst("http://schemas.microsoft.com/ws/2008/06/identity/claims/role")?.Value;

            if (string.IsNullOrEmpty(rolUsuario)) return false;

            // Acepta "1" (el IdRol de administrador) o el texto "ADMINISTRADOR" / "Admin"
            return rolUsuario == "1"
                || string.Equals(rolUsuario, "ADMINISTRADOR", StringComparison.OrdinalIgnoreCase)
                || string.Equals(rolUsuario, "Admin", StringComparison.OrdinalIgnoreCase);
        }
    }
}
