namespace HuellasVitalesAPI.Backend.Models.DTOs
{
    public class CrearMascotaRequest
    {
        public string Nombre { get; set; } = string.Empty;
        public short? IdEspecie { get; set; }
        public string? Raza { get; set; }
        public DateTime? FechaNacimiento { get; set; }
        public bool Activo { get; set; } = true;
    }

    public class ActualizarMascotaRequest
    {
        public string Nombre { get; set; } = string.Empty;
        public short? IdEspecie { get; set; }
        public string? Raza { get; set; }
        public DateTime? FechaNacimiento { get; set; }
        public bool Activo { get; set; } = true;
    }

    /// <summary>
    /// Igual que <see cref="CrearMascotaRequest"/>, pero para cuando el Admin registra la
    /// mascota a nombre de otro usuario: acá el dueño lo manda el panel (no se resuelve del
    /// JWT, como sí ocurre en el alta que hace el propio cliente).
    /// </summary>
    public class CrearMascotaAdminRequest
    {
        public int IdUsuario { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public short? IdEspecie { get; set; }
        public string? Raza { get; set; }
        public DateTime? FechaNacimiento { get; set; }
        public bool Activo { get; set; } = true;
    }
}
