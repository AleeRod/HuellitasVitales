namespace HuellasVitalesAPI.Backend.Models.DTOs
{
    public class MascotaDTO
    {
        public int IdMascota { get; set; }
        public int IdUsuario { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public short? IdEspecie { get; set; }
        public string Especie { get; set; } = string.Empty;
        public string? Raza { get; set; }
        public DateTime? FechaNacimiento { get; set; }
        public bool Activo { get; set; }
    }
}
