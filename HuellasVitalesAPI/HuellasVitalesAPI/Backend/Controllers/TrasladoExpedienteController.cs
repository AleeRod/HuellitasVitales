using HuellasVitalesAPI.Backend.Models.DTOs;
using HuellitasVitalesAPI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace HuellitasVitalesAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TrasladoExpedienteController : ControllerBase
{
    private readonly TrasladoExpedienteService _service;
    public TrasladoExpedienteController(TrasladoExpedienteService service) => _service = service;

    [HttpPost("expedientes/{idExpediente:int}/solicitudes")]
    public async Task<IActionResult> Solicitar(int idExpediente, SolicitarTrasladoExpedienteRequest request)
    {
        var usuario = UsuarioActual();
        if (usuario is null) return Unauthorized(new { success = false, mensaje = "Token inválido." });
        var resultado = await _service.SolicitarAsync(idExpediente, usuario.Value, RolActual(), request);
        return StatusCode(resultado.Codigo, new { success = resultado.Exito, mensaje = resultado.Mensaje, datos = resultado.Datos });
    }

    [HttpGet("solicitudes/pendientes")]
    public async Task<IActionResult> Pendientes()
    {
        var usuario = UsuarioActual();
        if (usuario is null) return Unauthorized(new { success = false, mensaje = "Token inválido." });
        return Ok(new { success = true, solicitudes = await _service.PendientesAsync(usuario.Value, RolActual()) });
    }

    // GET api/trasladoexpediente/mis-solicitudes
    // El cliente ve el estado de las solicitudes que él mismo envió.
    [HttpGet("mis-solicitudes")]
    public async Task<IActionResult> MisSolicitudes()
    {
        var usuario = UsuarioActual();
        if (usuario is null) return Unauthorized(new { success = false, mensaje = "Token inválido." });
        return Ok(new { success = true, solicitudes = await _service.ObtenerMisSolicitudesAsync(usuario.Value) });
    }

    [HttpPut("solicitudes/{idSolicitud:int}/aceptar")]
    public Task<IActionResult> Aceptar(int idSolicitud, ResolverTrasladoExpedienteRequest request) => Resolver(idSolicitud, true, request);

    [HttpPut("solicitudes/{idSolicitud:int}/rechazar")]
    public Task<IActionResult> Rechazar(int idSolicitud, ResolverTrasladoExpedienteRequest request) => Resolver(idSolicitud, false, request);

    private async Task<IActionResult> Resolver(int idSolicitud, bool aceptar, ResolverTrasladoExpedienteRequest request)
    {
        var usuario = UsuarioActual();
        if (usuario is null) return Unauthorized(new { success = false, mensaje = "Token inválido." });
        var resultado = await _service.ResolverAsync(idSolicitud, usuario.Value, RolActual(), aceptar, request);
        return StatusCode(resultado.Codigo, new { success = resultado.Exito, mensaje = resultado.Mensaje, datos = resultado.Datos });
    }

    private int? UsuarioActual()
    {
        var claim = User.FindFirst("sub")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(claim, out var id) ? id : null;
    }
    private byte RolActual() => byte.TryParse(User.FindFirst("rol")?.Value, out var rol) ? rol : (byte)0;
}
