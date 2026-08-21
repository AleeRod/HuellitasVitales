using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HuellasVitalesAPI.Backend.Models.Entidades;

[Table("DOCUMENTO_ATENCION_EXTERNA")]
public class DocumentoAtencionExterna
{
    [Key] public int IdDocumentoAtencionExterna { get; set; }
    public int IdAtencionExterna { get; set; }
    public string NombreOriginal { get; set; } = string.Empty;
    public string RutaArchivo { get; set; } = string.Empty;
    public string TipoContenido { get; set; } = string.Empty;
    public long TamanoBytes { get; set; }
    public DateTime FechaCarga { get; set; } = DateTime.UtcNow;
}
