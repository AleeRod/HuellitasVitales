using HuellitasVitalesAPI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace HuellitasVitalesAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ReporteController : ControllerBase
{
    private const byte RolCliente = 3;

    private readonly ReporteService _service;
    public ReporteController(ReporteService service) => _service = service;

    // GET api/reporte/resumen
    // Admin/Veterinario/Funcionario ven la actividad de sus veterinarias; el Cliente ve el
    // resumen de sus propias mascotas.
    [HttpGet("resumen")]
    public async Task<IActionResult> Resumen()
    {
        var idUsuario = ObtenerIdUsuario();
        if (idUsuario == null)
            return Unauthorized(new { success = false, mensaje = "Token inválido." });

        var rol = ObtenerRol();
        var resumen = rol == RolCliente
            ? await _service.ObtenerResumenClienteAsync(idUsuario.Value)
            : await _service.ObtenerResumenAsync(idUsuario.Value, rol);

        return Ok(new { success = true, reporte = resumen });
    }

    // GET api/reporte/historial-clinico
    // Solo Cliente: línea de tiempo de citas completadas, atenciones externas y emergencias
    // finalizadas de todas sus mascotas.
    [HttpGet("historial-clinico")]
    public async Task<IActionResult> HistorialClinico()
    {
        var idUsuario = ObtenerIdUsuario();
        if (idUsuario == null)
            return Unauthorized(new { success = false, mensaje = "Token inválido." });

        var historial = await _service.ObtenerHistorialClinicoAsync(idUsuario.Value);
        return Ok(new { success = true, historial });
    }

    private int? ObtenerIdUsuario()
    {
        var claim = User.FindFirst("sub")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(claim, out var id) ? id : null;
    }

    private byte ObtenerRol() => byte.TryParse(User.FindFirst("rol")?.Value, out var r) ? r : (byte)0;
}
