using HuellitasVitalesAPI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace HuellitasVitalesAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class NotificacionController : ControllerBase
{
    private readonly NotificacionService _notificacionService;

    public NotificacionController(NotificacionService notificacionService) => _notificacionService = notificacionService;

    [HttpGet]
    public async Task<IActionResult> Listar()
    {
        var idUsuario = ObtenerUsuarioActual();
        if (idUsuario is null) return Unauthorized(new { success = false, mensaje = "Token inválido." });

        var notificaciones = await _notificacionService.ObtenerPendientesAsync(idUsuario.Value);
        return Ok(new { success = true, notificaciones });
    }

    [HttpPut("{id:int}/leida")]
    public async Task<IActionResult> MarcarLeida(int id)
    {
        var idUsuario = ObtenerUsuarioActual();
        if (idUsuario is null) return Unauthorized(new { success = false, mensaje = "Token inválido." });

        if (!await _notificacionService.MarcarLeidaAsync(id, idUsuario.Value))
            return NotFound(new { success = false, mensaje = "La notificación no existe." });

        return Ok(new { success = true, mensaje = "Notificación marcada como leída." });
    }

    private int? ObtenerUsuarioActual()
    {
        var claim = User.FindFirst("sub")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(claim, out var idUsuario) ? idUsuario : null;
    }
}
