using HuellasVitalesAPI.Backend.Models.DTOs;
using HuellitasVitalesAPI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace HuellitasVitalesAPI.Controllers;

[ApiController, Route("api/expedientes/{idExpediente:int}/emergencias"), Authorize]
public class EmergenciaController : ControllerBase
{
    private readonly EmergenciaService _service;
    public EmergenciaController(EmergenciaService service) => _service = service;

    [HttpPost]
    public async Task<IActionResult> Solicitar(int idExpediente, EmergenciaRequest r)
    {
        var u = Usuario();
        if (u is null) return Unauthorized(new { success = false, mensaje = "Token inválido." });
        var x = await _service.SolicitarAsync(idExpediente, u.Value, r);
        return StatusCode(x.Item3, new { success = x.Item1, mensaje = x.Item2, datos = x.Item4 });
    }

    [HttpGet]
    public async Task<IActionResult> ListarPorExpediente(int idExpediente)
    {
        var emergencias = await _service.ListarPorExpedienteAsync(idExpediente);
        return Ok(new { success = true, emergencias });
    }

    [HttpPut("{id:int}/aceptar")] public Task<IActionResult> Aceptar(int idExpediente, int id) => Resolver(id, 0, null);
    [HttpPut("{id:int}/iniciar")] public Task<IActionResult> Iniciar(int idExpediente, int id) => Resolver(id, 1, null);
    [HttpPut("{id:int}/finalizar")] public Task<IActionResult> Finalizar(int idExpediente, int id, CerrarEmergenciaRequest r) => Resolver(id, 2, r);

    // PUT api/expedientes/{idExpediente}/emergencias/{id}/atencion-externa
    // "Atención por veterinario no registrado": el propio solicitante cierra la emergencia
    // registrando quién lo atendió fuera de la plataforma.
    [HttpPut("{id:int}/atencion-externa")]
    public async Task<IActionResult> RegistrarAtencionExterna(int idExpediente, int id, RegistrarEmergenciaExternaRequest request)
    {
        var u = Usuario();
        if (u is null) return Unauthorized(new { success = false, mensaje = "Token inválido." });
        var x = await _service.RegistrarAtencionExternaAsync(id, u.Value, request);
        return StatusCode(x.Item3, new { success = x.Item1, mensaje = x.Item2, datos = x.Item4 });
    }

    private async Task<IActionResult> Resolver(int id, int accion, CerrarEmergenciaRequest? r)
    {
        var u = Usuario();
        if (u is null) return Unauthorized(new { success = false, mensaje = "Token inválido." });
        var rol = byte.TryParse(User.FindFirst("rol")?.Value, out var v) ? v : (byte)0;
        var x = accion switch
        {
            0 => await _service.AceptarAsync(id, u.Value, rol),
            1 => await _service.IniciarAsync(id, u.Value, rol),
            _ => await _service.FinalizarAsync(id, u.Value, rol, r!)
        };
        return StatusCode(x.Item3, new { success = x.Item1, mensaje = x.Item2, datos = x.Item4 });
    }

    private int? Usuario()
    {
        var c = User.FindFirst("sub")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(c, out var id) ? id : null;
    }
}

// GET api/emergencias/pendientes — panel del veterinario/admin.
[ApiController, Route("api/emergencias"), Authorize]
public class EmergenciasPendientesController : ControllerBase
{
    private readonly EmergenciaService _service;
    public EmergenciasPendientesController(EmergenciaService service) => _service = service;

    [HttpGet("pendientes")]
    public async Task<IActionResult> Pendientes()
    {
        var c = User.FindFirst("sub")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!int.TryParse(c, out var idUsuario)) return Unauthorized(new { success = false, mensaje = "Token inválido." });
        var rol = byte.TryParse(User.FindFirst("rol")?.Value, out var r) ? r : (byte)0;
        return Ok(new { success = true, emergencias = await _service.PendientesAsync(idUsuario, rol) });
    }

    // GET api/emergencias/en-curso — las que este veterinario aceptó y todavía no finalizó
    // (o todas, para el admin).
    [HttpGet("en-curso")]
    public async Task<IActionResult> EnCurso()
    {
        var c = User.FindFirst("sub")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!int.TryParse(c, out var idUsuario)) return Unauthorized(new { success = false, mensaje = "Token inválido." });
        var rol = byte.TryParse(User.FindFirst("rol")?.Value, out var r) ? r : (byte)0;
        return Ok(new { success = true, emergencias = await _service.EnCursoAsync(idUsuario, rol) });
    }

    // GET api/emergencias/mis-emergencias — historial completo del cliente, de todas sus
    // mascotas, sin importar cuál tenga seleccionada en el momento.
    [HttpGet("mis-emergencias")]
    public async Task<IActionResult> MisEmergencias()
    {
        var c = User.FindFirst("sub")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!int.TryParse(c, out var idUsuario)) return Unauthorized(new { success = false, mensaje = "Token inválido." });
        return Ok(new { success = true, emergencias = await _service.ObtenerMisEmergenciasAsync(idUsuario) });
    }
}

// GET api/comercios/{idComercio}/veterinarios-disponibles — para el flujo de emergencia.
[ApiController, Route("api/comercios/{idComercio:int}/veterinarios-disponibles"), Authorize]
public class VeterinariosDisponiblesController : ControllerBase
{
    private readonly EmergenciaService _service;
    public VeterinariosDisponiblesController(EmergenciaService service) => _service = service;

    [HttpGet]
    public async Task<IActionResult> Listar(int idComercio)
    {
        var (veterinarios, fueraDeHorario) = await _service.ObtenerVeterinariosDisponiblesAsync(idComercio);
        return Ok(new { success = true, veterinarios, fueraDeHorario });
    }
}
