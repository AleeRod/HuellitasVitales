namespace HuellasVitalesAPI.Backend.Models.DTOs
{
    public class UsuarioBusquedaDTO
    {
        public int IdUsuario { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public string Apellidos { get; set; } = string.Empty;
        public string Correo { get; set; } = string.Empty;
    }
}