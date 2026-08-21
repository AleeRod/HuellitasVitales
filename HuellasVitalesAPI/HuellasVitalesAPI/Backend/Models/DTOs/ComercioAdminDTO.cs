namespace HuellasVitalesAPI.Backend.Models.DTOs
{
    /// <summary>
    /// Un comercio para la vista "Comercios" del Admin: incluye TODOS los estados (pendiente,
    /// aprobado, rechazado), a diferencia de <see cref="ComercioPendienteDTO"/> (solo
    /// pendientes) y <see cref="ComercioBusquedaDTO"/> (solo aprobados, para el marketplace).
    /// </summary>
    public class ComercioAdminDTO
    {
        public int IdComercio { get; set; }
        public string NombreComercial { get; set; } = string.Empty;
        public byte IdTipoComercio { get; set; }
        public string TipoComercio { get; set; } = string.Empty;
        public string? Direccion { get; set; }
        public string? Telefono { get; set; }
        public byte IdEstadoSolicitud { get; set; }
        public string EstadoSolicitud { get; set; } = string.Empty;
        public DateTime FechaSolicitud { get; set; }
        public DateTime? FechaResolucion { get; set; }

        // Datos de la persona legal / solicitante, mismo criterio que ComercioPendienteDTO.
        public string TipoPersona { get; set; } = string.Empty; // "Física" o "Jurídica"
        public string? Identificacion { get; set; }
        public string NombrePersonaLegal { get; set; } = string.Empty;
        public string? CorreoSolicitante { get; set; }
        public string? TelefonoSolicitante { get; set; }
    }

    /// <summary>Edición de los datos básicos de un comercio, por parte del Admin.</summary>
    public class EditarComercioRequest
    {
        public string NombreComercial { get; set; } = string.Empty;
        public byte IdTipoComercio { get; set; }
        public string? Direccion { get; set; }
        public string? Telefono { get; set; }
    }
}
