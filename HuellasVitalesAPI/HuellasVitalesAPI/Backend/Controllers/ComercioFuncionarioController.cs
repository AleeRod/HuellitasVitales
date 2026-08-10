using HuellasVitalesAPI.Backend.Models.DTOs;
using HuellitasVitalesAPI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace HuellitasVitalesAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ComercioFuncionarioController : ControllerBase
    {
        private readonly ComercioFuncionarioService _service;

        public ComercioFuncionarioController(ComercioFuncionarioService service)
        {
            _service = service;
        }

        private bool TryObtenerIdUsuario(out int idUsuario)
        {
            var subClaim = User.FindFirst("sub")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(subClaim, out idUsuario);
        }

        // GET api/comerciofuncionario?idComercio=5
        [HttpGet]
        [Authorize]
        public async Task<IActionResult> Listar([FromQuery] int idComercio)
        {
            if (!TryObtenerIdUsuario(out var idUsuario))
                return Unauthorized(new { success = false, mensaje = "Token inválido o sin identificador de usuario." });

            var resultado = await _service.ListarPorComercioAsync(idUsuario, idComercio);
            if (!resultado.Exito)
                return StatusCode(resultado.Codigo, new { success = false, mensaje = resultado.Mensaje });

            return Ok(resultado.Funcionarios);
        }

        // GET api/comerciofuncionario/buscar-usuario?correo=juan@mail.com
        [HttpGet("buscar-usuario")]
        [Authorize]
        public async Task<IActionResult> BuscarUsuario([FromQuery] string correo)
        {
            if (string.IsNullOrWhiteSpace(correo))
                return BadRequest(new { success = false, mensaje = "Debes indicar un correo para buscar." });

            var resultado = await _service.BuscarUsuarioPorCorreoAsync(correo);
            if (!resultado.Exito)
                return StatusCode(resultado.Codigo, new { success = false, mensaje = resultado.Mensaje });

            return Ok(resultado.Usuario);
        }

        // POST api/comerciofuncionario
        [HttpPost]
        [Authorize]
        public async Task<IActionResult> Vincular([FromBody] VincularFuncionarioRequest request)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            if (!TryObtenerIdUsuario(out var idUsuario))
                return Unauthorized(new { success = false, mensaje = "Token inválido o sin identificador de usuario." });

            var resultado = await _service.VincularAsync(idUsuario, request);
            if (!resultado.Exito)
                return StatusCode(resultado.Codigo, new { success = false, mensaje = resultado.Mensaje });

            return StatusCode(StatusCodes.Status201Created, new { success = true, mensaje = resultado.Mensaje });
        }

        // PUT api/comerciofuncionario/{id}/estado
        [HttpPut("{id:int}/estado")]
        [Authorize]
        public async Task<IActionResult> CambiarEstado(int id, [FromBody] CambiarEstadoFuncionarioRequest request)
        {
            if (!TryObtenerIdUsuario(out var idUsuario))
                return Unauthorized(new { success = false, mensaje = "Token inválido o sin identificador de usuario." });

            var resultado = await _service.CambiarEstadoAsync(idUsuario, id, request.Activo);
            if (!resultado.Exito)
                return StatusCode(resultado.Codigo, new { success = false, mensaje = resultado.Mensaje });

            return Ok(new { success = true, mensaje = resultado.Mensaje });
        }
    }
}