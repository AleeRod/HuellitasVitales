namespace HuellasVitalesAPI.Backend.Models.DTOs
{
    // Vista de una mascota para el panel de Administración: la mascota + quién es su dueño.
    // La entidad Mascota es mínima (sin foto/color/sexo) — este DTO no inventa campos que el
    // sistema no tiene.
    public class MascotaAdminDTO
    {
        public int IdMascota { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public string Especie { get; set; } = string.Empty;
        public string? Raza { get; set; }
        public DateTime? FechaNacimiento { get; set; }
        public bool Activo { get; set; }
        public int IdUsuario { get; set; }
        public string NombreDueno { get; set; } = string.Empty;
        public string CorreoDueno { get; set; } = string.Empty;
    }
}
