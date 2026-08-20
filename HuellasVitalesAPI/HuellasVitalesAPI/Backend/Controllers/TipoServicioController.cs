using HuellasVitalesAPI.Backend.Models.DTOs;
using HuellitasVitalesAPI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace HuellitasVitalesAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TipoServicioController : ControllerBase
    {
        private readonly TipoServicioService _tipoServicioService;

        public TipoServicioController(TipoServicioService tipoServicioService)
        {
            _tipoServicioService = tipoServicioService;
        }

        // GET api/tiposervicio
        // Público: el buscador del Marketplace también lo necesita para armar el filtro por tipo.
        [HttpGet]
        public async Task<IActionResult> Listar()
        {
            var tipos = await _tipoServicioService.ListarAsync();
            return Ok(new { success = true, tipos });
        }

        // POST api/tiposervicio
        // Solo Admin: crea el tipo directamente, ya aprobado. El funcionario debe usar
        // POST api/tiposervicio/solicitar en su lugar.
        [HttpPost]
        [Authorize]
        public async Task<IActionResult> Crear([FromBody] CrearTipoServicioRequest request)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var rolUsuario = ObtenerRolUsuario();
            if (rolUsuario == null)
                return Unauthorized(new { success = false, mensaje = "Token inválido o sin rol identificado." });

            var resultado = await _tipoServicioService.CrearAsync(request.Nombre, rolUsuario.Value);
            if (!resultado.Exito)
                return StatusCode(resultado.Codigo, new { success = false, mensaje = resultado.Mensaje });

            return StatusCode(StatusCodes.Status201Created, new { success = true, mensaje = resultado.Mensaje, tipo = resultado.Tipo });
        }

        // PUT api/tiposervicio/{id}/estado
        // Solo Admin.
        [HttpPut("{id:int}/estado")]
        [Authorize]
        public async Task<IActionResult> CambiarEstado(int id, [FromBody] CambiarEstadoFuncionarioRequest request)
        {
            var resultado = await _tipoServicioService.CambiarEstadoAsync(id, request.Activo, EsUsuarioAdmin());
            if (!resultado.Exito)
                return StatusCode(resultado.Codigo, new { success = false, mensaje = resultado.Mensaje });

            return Ok(new { success = true, mensaje = resultado.Mensaje });
        }

        // ==========================================
        // SOLICITUDES DE TIPO DE SERVICIO
        // ==========================================

        // POST api/tiposervicio/solicitar
        // Solo Funcionario.
        [HttpPost("solicitar")]
        [Authorize]
        public async Task<IActionResult> Solicitar([FromBody] SolicitarTipoServicioRequest request)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            if (!TryObtenerIdUsuario(out var idUsuario))
                return Unauthorized(new { success = false, mensaje = "Token inválido o sin identificador de usuario." });

            var rolUsuario = ObtenerRolUsuario();
            if (rolUsuario == null)
                return Unauthorized(new { success = false, mensaje = "Token inválido o sin rol identificado." });

            var resultado = await _tipoServicioService.SolicitarAsync(idUsuario, request, rolUsuario.Value);
            if (!resultado.Exito)
                return StatusCode(resultado.Codigo, new { success = false, mensaje = resultado.Mensaje });

            return StatusCode(StatusCodes.Status201Created, new { success = true, mensaje = resultado.Mensaje });
        }

        // GET api/tiposervicio/solicitudes/pendientes
        // Solo Admin.
        [HttpGet("solicitudes/pendientes")]
        [Authorize]
        public async Task<IActionResult> ListarPendientes()
        {
            if (!EsUsuarioAdmin())
                return StatusCode(StatusCodes.Status403Forbidden, new { success = false, mensaje = "Acceso denegado. Se requieren permisos de Administrador." });

            var solicitudes = await _tipoServicioService.ListarPendientesAsync();
            return Ok(new { success = true, solicitudes });
        }

        // GET api/tiposervicio/solicitudes/mias
        // El funcionario ve el estado de lo que él mismo solicitó.
        [HttpGet("solicitudes/mias")]
        [Authorize]
        public async Task<IActionResult> ListarMias()
        {
            if (!TryObtenerIdUsuario(out var idUsuario))
                return Unauthorized(new { success = false, mensaje = "Token inválido o sin identificador de usuario." });

            var solicitudes = await _tipoServicioService.ListarMiasAsync(idUsuario);
            return Ok(new { success = true, solicitudes });
        }

        // PUT api/tiposervicio/solicitudes/{id}/aprobar
        // Solo Admin.
        [HttpPut("solicitudes/{id:int}/aprobar")]
        [Authorize]
        public async Task<IActionResult> AprobarSolicitud(int id)
        {
            if (!EsUsuarioAdmin())
                return StatusCode(StatusCodes.Status403Forbidden, new { success = false, mensaje = "Acceso denegado. Se requieren permisos de Administrador." });

            if (!TryObtenerIdUsuario(out var idAdmin))
                return Unauthorized(new { success = false, mensaje = "Token inválido o sin identificador de usuario." });

            var resultado = await _tipoServicioService.AprobarSolicitudAsync(id, idAdmin);
            if (!resultado.Exito)
                return StatusCode(resultado.Codigo, new { success = false, mensaje = resultado.Mensaje });

            return Ok(new { success = true, mensaje = resultado.Mensaje });
        }

        // PUT api/tiposervicio/solicitudes/{id}/rechazar
        // Solo Admin.
        [HttpPut("solicitudes/{id:int}/rechazar")]
        [Authorize]
        public async Task<IActionResult> RechazarSolicitud(int id)
        {
            if (!EsUsuarioAdmin())
                return StatusCode(StatusCodes.Status403Forbidden, new { success = false, mensaje = "Acceso denegado. Se requieren permisos de Administrador." });

            if (!TryObtenerIdUsuario(out var idAdmin))
                return Unauthorized(new { success = false, mensaje = "Token inválido o sin identificador de usuario." });

            var resultado = await _tipoServicioService.RechazarSolicitudAsync(id, idAdmin);
            if (!resultado.Exito)
                return StatusCode(resultado.Codigo, new { success = false, mensaje = resultado.Mensaje });

            return Ok(new { success = true, mensaje = resultado.Mensaje });
        }

        // ==========================================
        // MÉTODOS AUXILIARES PRIVADOS
        // ==========================================
        private byte? ObtenerRolUsuario()
        {
            var rolClaim = User.FindFirst("rol")?.Value ?? User.FindFirst(ClaimTypes.Role)?.Value;
            return byte.TryParse(rolClaim, out var rol) ? rol : (byte?)null;
        }

        private bool TryObtenerIdUsuario(out int idUsuario)
        {
            var subClaim = User.FindFirst("sub")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(subClaim, out idUsuario);
        }

        private bool EsUsuarioAdmin()
        {
            var rolUsuario = User.FindFirst("rol")?.Value
                            ?? User.FindFirst(ClaimTypes.Role)?.Value
                            ?? User.FindFirst("IdRol")?.Value
                            ?? User.FindFirst("idRol")?.Value;

            if (string.IsNullOrEmpty(rolUsuario)) return false;

            return rolUsuario == "1"
                || string.Equals(rolUsuario, "ADMINISTRADOR", StringComparison.OrdinalIgnoreCase)
                || string.Equals(rolUsuario, "Admin", StringComparison.OrdinalIgnoreCase);
        }
    }
}
