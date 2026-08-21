namespace HuellasVitalesAPI.Backend.Models.DTOs;

// Datos ya aplanados que necesita el generador de PDF del expediente. Se arma aparte del
// detalle JSON (ObtenerDetalleAsync) para no arriesgar el shape que ya consume el frontend —
// consulta lo mismo, pero en un tipo fuerte en vez de un objeto anónimo.
public class ExpedienteExportDTO
{
    public int IdExpediente { get; set; }
    public string NombreMascota { get; set; } = string.Empty;
    public string? NombreComercioActual { get; set; }
    public DateTime FechaApertura { get; set; }
    public List<HistorialComercioExportItem> HistorialComercios { get; set; } = new();
    public List<AtencionExternaExportItem> AtencionesExternas { get; set; } = new();
    public List<EmergenciaExportItem> Emergencias { get; set; } = new();
}

public class HistorialComercioExportItem
{
    public string NombreComercio { get; set; } = string.Empty;
    public bool PuedeConsultar { get; set; }
    public bool PuedeModificar { get; set; }
    public DateTime FechaDesde { get; set; }
    public DateTime? FechaHasta { get; set; }
}

public class AtencionExternaExportItem
{
    public string NombreVeterinaria { get; set; } = string.Empty;
    public DateTime FechaAtencion { get; set; }
    public string Motivo { get; set; } = string.Empty;
    public string? Diagnostico { get; set; }
    public string? Tratamiento { get; set; }
}

public class EmergenciaExportItem
{
    public string Estado { get; set; } = string.Empty;
    public string Motivo { get; set; } = string.Empty;
    public DateTime FechaSolicitud { get; set; }
    public bool EsAtencionExterna { get; set; }
    public string? Diagnostico { get; set; }
    public string? Tratamiento { get; set; }
}
