using HuellitasVitalesAPI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace HuellitasVitalesAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ExpedienteController : ControllerBase
{
    private readonly ExpedienteService _service;
    public ExpedienteController(ExpedienteService service) => _service = service;
    [HttpGet("mascota/{idMascota:int}")]
    public async Task<IActionResult> ObtenerPorMascota(int idMascota)
    {
        var claim = User.FindFirst("sub")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!int.TryParse(claim, out var idUsuario)) return Unauthorized(new { success = false, mensaje = "Token inválido." });
        var resultado = await _service.ObtenerOCrearAsync(idMascota, idUsuario);
        return StatusCode(resultado.Codigo, new { success = resultado.Exito, mensaje = resultado.Mensaje, expediente = resultado.Expediente });
    }
}
