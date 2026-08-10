using HuellasVitalesAPI.Backend.Models.DTOs;
using HuellitasVitalesAPI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
namespace HuellitasVitalesAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ComercioController : ControllerBase
    {
        private readonly ComercioService _comercioService;

        public ComercioController(ComercioService comercioService)
        {
            _comercioService = comercioService;
        }

        [HttpPost("solicitud")]
        public async Task<IActionResult> RegistrarSolicitud([FromBody] SolicitudComercioRequest request)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var resultado = await _comercioService.CrearSolicitudRegistroAsync(request);

            if (!resultado.Exito)
            {
                return BadRequest(new { success = false, mensaje = resultado.Mensaje });
            }

            return Ok(new { success = true, mensaje = resultado.Mensaje });
        }

        // ─── TAREA 1: Aprobar un comercio (solo administradores) ───
        // PUT api/comercio/{id}/aprobar
        [HttpPut("{id:int}/aprobar")]
        [Authorize] // Requiere JWT válido
        public async Task<IActionResult> AprobarComercio(int id)
        {
            // Validación básica: solo el rol Administrador (1) puede aprobar.
            // El token JWT incluye el claim "rol" (ver UsuarioService.GenerarTokenJWT).
            var rolClaim = User.FindFirst("rol")?.Value;
            if (rolClaim != "1")
                return StatusCode(StatusCodes.Status403Forbidden,
                    new { success = false, mensaje = "No tienes permisos para realizar esta acción." });

            // ID del administrador que resuelve (claim "sub" = IdUsuario)
            var subClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                        ?? User.FindFirst("sub")?.Value;
            if (!int.TryParse(subClaim, out var idAdmin))
                return Unauthorized(new { success = false, mensaje = "Token inválido o sin identificador de usuario." });

            var resultado = await _comercioService.AprobarComercioAsync(id, idAdmin);

            if (!resultado.Exito)
                return StatusCode(resultado.Codigo, new { success = false, mensaje = resultado.Mensaje });

            return Ok(new { success = true, mensaje = resultado.Mensaje });
        }

        // ─── TAREA 2: Búsqueda dinámica de comercios del marketplace ───
        // GET api/comercio/buscar?q=texto
        [HttpGet("buscar")]
        public async Task<IActionResult> BuscarComercios([FromQuery] string q = "")
        {
            try
            {
                var resultados = await _comercioService.BuscarComerciosAprobadosAsync(q);
                return Ok(resultados);
            }
            catch (Exception)
            {
                // No se filtran detalles internos (stack trace) al cliente.
                return StatusCode(500, new { success = false, mensaje = "Error al realizar la búsqueda." });
            }
        }

                // Rechazar un comercio (solo administradores) 
        // PUT api/comercio/{id}/rechazar
        [HttpPut("{id:int}/rechazar")]
        [Authorize]
        public async Task<IActionResult> RechazarComercio(int id)
        {
            var rolClaim = User.FindFirst("rol")?.Value;
            if (rolClaim != "1")
                return StatusCode(StatusCodes.Status403Forbidden,
                    new { success = false, mensaje = "No tienes permisos para realizar esta acción." });

            var subClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                        ?? User.FindFirst("sub")?.Value;
            if (!int.TryParse(subClaim, out var idAdmin))
                return Unauthorized(new { success = false, mensaje = "Token inválido o sin identificador de usuario." });

            var resultado = await _comercioService.RechazarComercioAsync(id, idAdmin);

            if (!resultado.Exito)
                return StatusCode(resultado.Codigo, new { success = false, mensaje = resultado.Mensaje });

            return Ok(new { success = true, mensaje = resultado.Mensaje });
        }

        //  Listar solicitudes pendientes (panel del administrador)
        // GET api/comercio/pendientes
        [HttpGet("pendientes")]
        [Authorize]
        public async Task<IActionResult> ListarPendientes()
        {
            var rolClaim = User.FindFirst("rol")?.Value;
            if (rolClaim != "1")
                return StatusCode(StatusCodes.Status403Forbidden,
                    new { success = false, mensaje = "No tienes permisos para realizar esta acción." });

            var pendientes = await _comercioService.ListarPendientesAsync();
            return Ok(pendientes);
        }

                // ─── Listar los comercios aprobados que le pertenecen al usuario logueado ───
        // GET api/comercio/mios
        [HttpGet("mios")]
        [Authorize]
        public async Task<IActionResult> MisComercios()
        {
            var subClaim = User.FindFirst("sub")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(subClaim, out var idUsuario))
                return Unauthorized(new { success = false, mensaje = "Token inválido o sin identificador de usuario." });

            var comercios = await _comercioService.ListarMiosAsync(idUsuario);
            return Ok(comercios);
        }
    }
}