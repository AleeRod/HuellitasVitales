using HuellasVitalesAPI.Backend.Models.DTOs;
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
    private readonly ExpedientePdfService _pdf;
    public ExpedienteController(ExpedienteService service, ExpedientePdfService pdf)
    {
        _service = service;
        _pdf = pdf;
    }

    [HttpGet("mascota/{idMascota:int}")]
    public async Task<IActionResult> ObtenerPorMascota(int idMascota)
    {
        var claim = User.FindFirst("sub")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!int.TryParse(claim, out var idUsuario)) return Unauthorized(new { success = false, mensaje = "Token inválido." });
        var resultado = await _service.ObtenerOCrearAsync(idMascota, idUsuario);
        return StatusCode(resultado.Codigo, new { success = resultado.Exito, mensaje = resultado.Mensaje, expediente = resultado.Expediente });
    }

    // POST api/expediente/abrir
    // Para el flujo de emergencia: si la mascota no tiene expediente (nunca tuvo una cita), el
    // cliente elige directamente la veterinaria y el expediente se abre anclado ahí.
    [HttpPost("abrir")]
    public async Task<IActionResult> Abrir(AbrirExpedienteRequest request)
    {
        var claim = User.FindFirst("sub")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!int.TryParse(claim, out var idUsuario)) return Unauthorized(new { success = false, mensaje = "Token inválido." });
        var resultado = await _service.AbrirEligiendoVeterinariaAsync(request.IdMascota, idUsuario, request.IdComercio);
        return StatusCode(resultado.Codigo, new { success = resultado.Exito, mensaje = resultado.Mensaje, expediente = resultado.Expediente });
    }

    // POST api/expediente/abrir-sin-veterinaria
    // Para el flujo de Atención Externa: la mascota nunca tuvo cita, pero a diferencia de
    // Emergencia/Traslado acá no tiene sentido pedirle al cliente que elija una veterinaria de
    // la plataforma para registrar algo que pasó fuera de ella.
    [HttpPost("abrir-sin-veterinaria")]
    public async Task<IActionResult> AbrirSinVeterinaria([FromBody] AbrirExpedienteSinVeterinariaRequest request)
    {
        var claim = User.FindFirst("sub")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!int.TryParse(claim, out var idUsuario)) return Unauthorized(new { success = false, mensaje = "Token inválido." });
        var resultado = await _service.AbrirSinVeterinariaAsync(request.IdMascota, idUsuario);
        return StatusCode(resultado.Codigo, new { success = resultado.Exito, mensaje = resultado.Mensaje, expediente = resultado.Expediente });
    }

    // GET api/expediente/{id}
    // Detalle completo para el propietario, una veterinaria con acceso vigente, o un admin.
    [HttpGet("{idExpediente:int}")]
    public async Task<IActionResult> ObtenerDetalle(int idExpediente)
    {
        var claim = User.FindFirst("sub")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!int.TryParse(claim, out var idUsuario)) return Unauthorized(new { success = false, mensaje = "Token inválido." });
        var rol = byte.TryParse(User.FindFirst("rol")?.Value, out var r) ? r : (byte)0;

        var resultado = await _service.ObtenerDetalleAsync(idExpediente, idUsuario, rol);
        return StatusCode(resultado.Codigo, new { success = resultado.Exito, mensaje = resultado.Mensaje, expediente = resultado.Datos });
    }

    // GET api/expediente/{id}/exportar-pdf
    // Mismo control de acceso que el detalle: dueño de la mascota, veterinaria con acceso
    // vigente, o admin.
    [HttpGet("{idExpediente:int}/exportar-pdf")]
    public async Task<IActionResult> ExportarPdf(int idExpediente)
    {
        var claim = User.FindFirst("sub")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!int.TryParse(claim, out var idUsuario)) return Unauthorized(new { success = false, mensaje = "Token inválido." });
        var rol = byte.TryParse(User.FindFirst("rol")?.Value, out var r) ? r : (byte)0;

        var resultado = await _service.ObtenerParaExportarAsync(idExpediente, idUsuario, rol);
        if (!resultado.Exito || resultado.Datos == null)
            return StatusCode(resultado.Codigo, new { success = false, mensaje = resultado.Mensaje });

        var bytes = _pdf.Generar(resultado.Datos);
        var nombreArchivo = $"expediente-{resultado.Datos.NombreMascota.Replace(" ", "-")}.pdf";
        return File(bytes, "application/pdf", nombreArchivo);
    }
}
