using HuellasVitalesAPI.Backend.Models.DTOs;
using HuellitasVitalesAPI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace HuellitasVitalesAPI.Controllers;

[ApiController]
[Route("api/expedientes/{idExpediente:int}/atenciones-externas")]
[Authorize]
public class AtencionExternaController : ControllerBase
{
    private readonly AtencionExternaService _service;
    public AtencionExternaController(AtencionExternaService service) => _service = service;

    [HttpPost]
    public async Task<IActionResult> Registrar(int idExpediente, RegistrarAtencionExternaRequest request)
    {
        var idUsuario = UsuarioActual();
        if (idUsuario is null) return Unauthorized(new { success = false, mensaje = "Token inválido." });
        var resultado = await _service.RegistrarAsync(idExpediente, idUsuario.Value, request);
        return StatusCode(resultado.Codigo, new { success = resultado.Exito, mensaje = resultado.Mensaje, datos = resultado.Datos });
    }

    [HttpGet]
    public async Task<IActionResult> Listar(int idExpediente)
    {
        var idUsuario = UsuarioActual();
        if (idUsuario is null) return Unauthorized(new { success = false, mensaje = "Token inválido." });
        var atenciones = await _service.ListarAsync(idExpediente, idUsuario.Value);
        return Ok(new { success = true, atenciones });
    }

    [HttpPost("{idAtencion:int}/documentos")]
    [RequestSizeLimit(10 * 1024 * 1024)]
    public async Task<IActionResult> Adjuntar(int idExpediente, int idAtencion, IFormFile archivo)
    {
        var idUsuario = UsuarioActual();
        if (idUsuario is null) return Unauthorized(new { success = false, mensaje = "Token inválido." });
        var resultado = await _service.AdjuntarAsync(idAtencion, idUsuario.Value, archivo);
        return StatusCode(resultado.Codigo, new { success = resultado.Exito, mensaje = resultado.Mensaje, datos = resultado.Datos });
    }

    private int? UsuarioActual()
    {
        var claim = User.FindFirst("sub")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(claim, out var id) ? id : null;
    }
}
