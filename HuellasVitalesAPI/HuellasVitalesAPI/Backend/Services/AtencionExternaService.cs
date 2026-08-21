using HuellasVitalesAPI.Backend.Models.DTOs;
using HuellasVitalesAPI.Backend.Models.Entidades;
using HuellitasVitalesAPI.Data;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace HuellitasVitalesAPI.Services;

public class AtencionExternaService
{
    private static readonly HashSet<string> TiposPermitidos = new(StringComparer.OrdinalIgnoreCase)
    { "application/pdf", "image/jpeg", "image/png", "image/webp" };
    private const long TamanoMaximo = 10 * 1024 * 1024;
    private readonly ConexionDB _context;
    private readonly IWebHostEnvironment _environment;

    public AtencionExternaService(ConexionDB context, IWebHostEnvironment environment)
    {
        _context = context;
        _environment = environment;
    }

    public async Task<(bool Exito, string Mensaje, int Codigo, object? Datos)> RegistrarAsync(int idExpediente,
        int idUsuario, RegistrarAtencionExternaRequest request)
    {
        var expediente = await ObtenerExpedientePropietarioAsync(idExpediente, idUsuario);
        if (expediente == null) return (false, "No tienes permisos para registrar información en este expediente.", 403, null);
        if (request.FechaAtencion > DateTime.UtcNow) return (false, "La fecha de atención no puede estar en el futuro.", 400, null);

        var atencion = new AtencionExterna
        {
            IdExpediente = idExpediente, IdUsuarioRegistro = idUsuario,
            NombreVeterinaria = request.NombreVeterinaria.Trim(),
            NombreProfesional = Limpiar(request.NombreProfesional), FechaAtencion = request.FechaAtencion,
            Motivo = request.Motivo.Trim(), Diagnostico = Limpiar(request.Diagnostico),
            Tratamiento = Limpiar(request.Tratamiento), FechaRegistro = DateTime.UtcNow
        };
        _context.AtencionesExternas.Add(atencion);
        await _context.SaveChangesAsync();
        return (true, "Atención externa registrada correctamente.", 201, atencion);
    }

    public async Task<(bool Exito, string Mensaje, int Codigo, object? Datos)> AdjuntarAsync(int idAtencion,
        int idUsuario, IFormFile archivo)
    {
        var atencion = await (from a in _context.AtencionesExternas
                              join e in _context.Expedientes on a.IdExpediente equals e.IdExpediente
                              join m in _context.Mascotas on e.IdMascota equals m.IdMascota
                              where a.IdAtencionExterna == idAtencion && m.IdUsuario == idUsuario
                              select a).FirstOrDefaultAsync();
        if (atencion == null) return (false, "No tienes permisos para adjuntar documentos a esta atención.", 403, null);
        if (archivo.Length == 0 || archivo.Length > TamanoMaximo) return (false, "El archivo debe pesar entre 1 byte y 10 MB.", 400, null);
        if (!TiposPermitidos.Contains(archivo.ContentType)) return (false, "Solo se permiten PDF, JPG, PNG o WEBP.", 400, null);

        var extension = Path.GetExtension(archivo.FileName).ToLowerInvariant();
        if (extension is not (".pdf" or ".jpg" or ".jpeg" or ".png" or ".webp")) return (false, "La extensión del archivo no está permitida.", 400, null);
        var carpeta = Path.Combine(_environment.WebRootPath ?? Path.Combine(_environment.ContentRootPath, "wwwroot"), "uploads", "atenciones-externas");
        Directory.CreateDirectory(carpeta);
        var nombreGuardado = $"{Guid.NewGuid():N}{extension}";
        await using (var destino = File.Create(Path.Combine(carpeta, nombreGuardado))) await archivo.CopyToAsync(destino);

        var documento = new DocumentoAtencionExterna { IdAtencionExterna = idAtencion,
            NombreOriginal = Path.GetFileName(archivo.FileName), RutaArchivo = $"/uploads/atenciones-externas/{nombreGuardado}",
            TipoContenido = archivo.ContentType, TamanoBytes = archivo.Length, FechaCarga = DateTime.UtcNow };
        _context.DocumentosAtencionExterna.Add(documento);
        await _context.SaveChangesAsync();
        return (true, "Documento adjuntado correctamente.", 201, documento);
    }

    public async Task<List<object>> ListarAsync(int idExpediente, int idUsuario)
    {
        if (await ObtenerExpedientePropietarioAsync(idExpediente, idUsuario) == null) return new List<object>();
        var atenciones = await _context.AtencionesExternas.Where(a => a.IdExpediente == idExpediente)
            .OrderByDescending(a => a.FechaAtencion).ToListAsync();
        var ids = atenciones.Select(a => a.IdAtencionExterna).ToList();
        var documentos = await _context.DocumentosAtencionExterna.Where(d => ids.Contains(d.IdAtencionExterna)).ToListAsync();
        return atenciones.Select(a => (object)new { a.IdAtencionExterna, a.NombreVeterinaria, a.NombreProfesional,
            a.FechaAtencion, a.Motivo, a.Diagnostico, a.Tratamiento,
            Documentos = documentos.Where(d => d.IdAtencionExterna == a.IdAtencionExterna).Select(d => new { d.IdDocumentoAtencionExterna, d.NombreOriginal, d.RutaArchivo, d.TipoContenido, d.TamanoBytes }) }).ToList();
    }

    private async Task<Expediente?> ObtenerExpedientePropietarioAsync(int idExpediente, int idUsuario) =>
        await (from e in _context.Expedientes join m in _context.Mascotas on e.IdMascota equals m.IdMascota
               where e.IdExpediente == idExpediente && e.Activo && m.IdUsuario == idUsuario select e).FirstOrDefaultAsync();
    private static string? Limpiar(string? valor) => string.IsNullOrWhiteSpace(valor) ? null : valor.Trim();
}
