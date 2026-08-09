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

        // GET api/Comercio/pendientes
        [HttpGet("pendientes")]
        public async Task<IActionResult> ObtenerComerciosPendientes()
        {
            try
            {
                var comercios = await _comercioService.ObtenerComerciosPendientesAsync();

                return Ok(new
                {
                    success = true,
                    cantidad = comercios.Count,
                    comercios
                });
            }
            catch (Exception)
            {
                return StatusCode(500, new
                {
                    success = false,
                    mensaje = "Error al obtener los comercios pendientes."
                });
            }
        }

    } 
}         
