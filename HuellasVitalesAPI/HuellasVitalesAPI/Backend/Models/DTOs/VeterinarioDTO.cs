namespace HuellasVitalesAPI.Backend.Models.DTOs
{
    public class VeterinarioDTO
    {
        public int IdVeterinario { get; set; }
        public int IdUsuario { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public string Apellidos { get; set; } = string.Empty;
        public string Correo { get; set; } = string.Empty;
        public string? Especialidad { get; set; }
        public string? Descripcion { get; set; }
    }
}
