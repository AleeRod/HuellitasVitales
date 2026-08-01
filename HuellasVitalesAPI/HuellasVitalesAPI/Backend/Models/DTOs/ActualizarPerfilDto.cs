namespace HuellasVitalesAPI.Backend.Models.DTOs
{
    public class ActualizarPerfilDTO
    {
        public string Nombre { get; set; } = string.Empty;
        public string Apellidos { get; set; } = string.Empty;
        public string Correo { get; set; } = string.Empty;
        public string Telefono { get; set; } = string.Empty;
    }
}