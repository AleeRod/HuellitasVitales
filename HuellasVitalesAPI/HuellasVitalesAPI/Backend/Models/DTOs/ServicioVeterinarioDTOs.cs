using System.ComponentModel.DataAnnotations;
using HuellasVitalesAPI.Backend.Models.Enums;

namespace HuellasVitalesAPI.Backend.Models.DTOs
{
    /// <summary>Datos de entrada para crear o actualizar un servicio.</summary>
    public class ServicioVeterinarioRequest
    {
        [Required(ErrorMessage = "El nombre es obligatorio.")]
        [StringLength(120, MinimumLength = 3, ErrorMessage = "El nombre debe tener entre 3 y 120 caracteres.")]
        public string Nombre { get; set; } = string.Empty;

        [StringLength(500, ErrorMessage = "La descripción no puede superar los 500 caracteres.")]
        public string? Descripcion { get; set; }

        [Range(5, 600, ErrorMessage = "La duración debe estar entre 5 y 600 minutos.")]
        public int DuracionMinutos { get; set; }

        [Range(0, 9999999.99, ErrorMessage = "El precio no puede ser negativo.")]
        public decimal Precio { get; set; }

        // Consulta = 1, Grooming = 2, Procedimiento Quirúrgico = 3.
        // El 0 (valor por defecto de un enum) no está definido, así que obliga a elegir.
        [EnumDataType(typeof(TipoServicio), ErrorMessage = "El tipo de servicio no es válido.")]
        public TipoServicio Tipo { get; set; }
    }

    /// <summary>Representación de salida de un servicio hacia el cliente.</summary>
    public class ServicioVeterinarioResponse
    {
        public int IdServicioVeterinario { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public string? Descripcion { get; set; }
        public int DuracionMinutos { get; set; }
        public decimal Precio { get; set; }
        public TipoServicio Tipo { get; set; }
        public string TipoNombre { get; set; } = string.Empty;
        public bool IsActive { get; set; }
    }
}
