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
}
