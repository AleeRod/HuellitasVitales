using HuellasVitalesAPI.Backend.Common;
using HuellasVitalesAPI.Backend.Models.DTOs;
using HuellitasVitalesAPI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HuellitasVitalesAPI.Controllers
{
    /// <summary>
    /// CRUD del catálogo de servicios veterinarios.
    /// Lectura pública (solo activos); creación/edición/borrado reservados al Administrador.
    /// </summary>
    [Route("api/[controller]")]
    [ApiController]
    public class ServicioVeterinarioController : ControllerBase
    {
        private readonly ServicioVeterinarioService _service;

        public ServicioVeterinarioController(ServicioVeterinarioService service)
        {
            _service = service;
        }

        // ─── GET público: solo servicios ACTIVOS (lo que se puede agendar) ───
        // GET api/servicioveterinario
        [HttpGet]
        public async Task<IActionResult> Listar()
        {
            var servicios = await _service.ListarAsync(soloActivos: true);
            return Ok(servicios);
        }

        // ─── GET público de un servicio activo ───
        // GET api/servicioveterinario/{id}
        [HttpGet("{id:int}")]
        public async Task<IActionResult> Obtener(int id)
        {
            var servicio = await _service.ObtenerAsync(id, soloActivos: true);
            if (servicio == null)
                return NotFound(RespuestaApi.Fallo("El servicio no existe o no está disponible."));

            return Ok(servicio);
        }

        // ─── GET de gestión (Admin): incluye activos e inactivos ───
        // GET api/servicioveterinario/gestion
        [HttpGet("gestion")]
        [Authorize(Roles = "Administrador")]
        public async Task<IActionResult> ListarGestion()
        {
            var servicios = await _service.ListarAsync(soloActivos: false);
            return Ok(servicios);
        }

        // ─── POST: crear (Admin) ───
        // Si el DTO es inválido, [ApiController] devuelve 400 automáticamente.
        [HttpPost]
        [Authorize(Roles = "Administrador")]
        public async Task<IActionResult> Crear([FromBody] ServicioVeterinarioRequest request)
        {
            var r = await _service.CrearAsync(request);
            if (!r.Exito)
                return StatusCode(r.Codigo, RespuestaApi.Fallo(r.Mensaje));

            return StatusCode(StatusCodes.Status201Created, RespuestaApi.Ok(r.Mensaje, r.Datos));
        }

        // ─── PUT: actualizar (Admin) ───
        [HttpPut("{id:int}")]
        [Authorize(Roles = "Administrador")]
        public async Task<IActionResult> Actualizar(int id, [FromBody] ServicioVeterinarioRequest request)
        {
            var r = await _service.ActualizarAsync(id, request);
            return this.DesdeResultado(r);
        }

        // ─── DELETE: borrado lógico / desactivar (Admin) ───
        [HttpDelete("{id:int}")]
        [Authorize(Roles = "Administrador")]
        public async Task<IActionResult> Desactivar(int id)
        {
            var r = await _service.DesactivarAsync(id);
            return this.DesdeResultado(r);
        }

        // ─── PATCH: reactivar un servicio desactivado (Admin) ───
        [HttpPatch("{id:int}/reactivar")]
        [Authorize(Roles = "Administrador")]
        public async Task<IActionResult> Reactivar(int id)
        {
            var r = await _service.ReactivarAsync(id);
            return this.DesdeResultado(r);
        }
    }
}
