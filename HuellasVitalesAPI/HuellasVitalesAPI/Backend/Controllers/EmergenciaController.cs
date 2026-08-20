using HuellasVitalesAPI.Backend.Models.DTOs;
using HuellitasVitalesAPI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
namespace HuellitasVitalesAPI.Controllers;
[ApiController, Route("api/expedientes/{idExpediente:int}/emergencias"), Authorize]
public class EmergenciaController : ControllerBase
{
    private readonly EmergenciaService _service; public EmergenciaController(EmergenciaService service) => _service = service;
    [HttpPost] public async Task<IActionResult> Solicitar(int idExpediente, EmergenciaRequest r) { var u = Usuario(); if (u is null) return Unauthorized(); var x = await _service.SolicitarAsync(idExpediente, u.Value, r); return StatusCode(x.Item3, new { success = x.Item1, mensaje = x.Item2, datos = x.Item4 }); }
    [HttpPut("{id:int}/aceptar")] public Task<IActionResult> Aceptar(int id) => Resolver(id, 0, null);
    [HttpPut("{id:int}/iniciar")] public Task<IActionResult> Iniciar(int id) => Resolver(id, 1, null);
    [HttpPut("{id:int}/finalizar")] public Task<IActionResult> Finalizar(int id, CerrarEmergenciaRequest r) => Resolver(id, 2, r);
    private async Task<IActionResult> Resolver(int id, int accion, CerrarEmergenciaRequest? r) { var u = Usuario(); if (u is null) return Unauthorized(); var rol = byte.TryParse(User.FindFirst("rol")?.Value, out var v) ? v : (byte)0; var x = accion switch { 0 => await _service.AceptarAsync(id, u.Value, rol), 1 => await _service.IniciarAsync(id, u.Value, rol), _ => await _service.FinalizarAsync(id, u.Value, rol, r!) }; return StatusCode(x.Item3, new { success = x.Item1, mensaje = x.Item2, datos = x.Item4 }); }
    private int? Usuario() { var c = User.FindFirst("sub")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value; return int.TryParse(c, out var id) ? id : null; }
}
