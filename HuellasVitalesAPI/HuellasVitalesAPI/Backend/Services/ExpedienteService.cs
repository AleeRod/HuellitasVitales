using HuellasVitalesAPI.Backend.Models.Entidades;
using HuellitasVitalesAPI.Data;
using Microsoft.EntityFrameworkCore;

namespace HuellitasVitalesAPI.Services;

public class ExpedienteService
{
    private readonly ConexionDB _context;
    public ExpedienteService(ConexionDB context) => _context = context;

    public async Task<(bool Exito, string Mensaje, int Codigo, Expediente? Expediente)> ObtenerOCrearAsync(int idMascota, int idUsuario)
    {
        var mascota = await _context.Mascotas.FirstOrDefaultAsync(m => m.IdMascota == idMascota && m.Activo);
        if (mascota == null) return (false, "La mascota no existe o está inactiva.", 404, null);
        if (mascota.IdUsuario != idUsuario) return (false, "No tienes permisos sobre esta mascota.", 403, null);
        var existente = await _context.Expedientes.FirstOrDefaultAsync(e => e.IdMascota == idMascota && e.Activo);
        if (existente != null) return (true, "Expediente encontrado.", 200, existente);
        return (false, "La mascota aún no tiene expediente. Debe abrirlo una veterinaria al realizar la primera atención.", 404, null);
    }
}
