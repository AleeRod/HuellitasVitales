using System.ComponentModel.DataAnnotations;

namespace HuellasVitalesAPI.Backend.Models.DTOs
{
    public class SolicitudComercioRequest
    {
        [Required]
        public int IdUsuario { get; set; } // El ID del usuario logueado que hace la solicitud

        [Required]
        public byte IdTipoPersona { get; set; } // 1 = FÍSICA, 2 = JURÍDICA

        [Required]
        public string Identificacion { get; set; } = string.Empty;

        public string? RazonSocial { get; set; }

        [Required]
        [MinLength(1, ErrorMessage = "Debes registrar al menos un comercio (veterinaria o almacén).")]
        public List<ComercioDetalleDTO> Comercios { get; set; } = new List<ComercioDetalleDTO>();
    }

    public class ComercioDetalleDTO
    {
        [Required]
        public byte IdTipoComercio { get; set; } // 1 = VETERINARIA, 2 = ALMACEN

        [Required]
        public string NombreComercial { get; set; } = string.Empty;

        public string? Direccion { get; set; }
        public string? Telefono { get; set; }
    }
}