namespace HuellasVitalesAPI.Backend.Models.DTOs
{
    // Vista de un usuario para el panel de Administración — a diferencia de PerfilUsuarioDTO
    // (que es lo que el propio usuario ve de sí mismo), este DTO lo usa un Admin para listar o
    // inspeccionar la cuenta de CUALQUIER usuario de la plataforma.
    public class UsuarioAdminDTO
    {
        public int IdUsuario { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public string Apellidos { get; set; } = string.Empty;
        public string Correo { get; set; } = string.Empty;
        public string? Telefono { get; set; }
        public byte IdRol { get; set; }
        public string NombreRol { get; set; } = string.Empty;
        public byte IdEstadoCuenta { get; set; }
        public string? AvatarIcono { get; set; }
        public DateTime FechaRegistro { get; set; }
    }
}
