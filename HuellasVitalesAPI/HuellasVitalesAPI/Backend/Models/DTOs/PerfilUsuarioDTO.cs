namespace HuellasVitalesAPI.Backend.Models.DTOs
{
    // Datos públicos del perfil de usuario.
    // NO incluye PasswordHash ni Proveedor_Id por seguridad.
    public class PerfilUsuarioDTO
    {
        public int IdUsuario { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public string Apellidos { get; set; } = string.Empty;
        public string Correo { get; set; } = string.Empty;
        public string? Telefono { get; set; }
        public byte IdRol { get; set; }           // 1 = Admin, 2 = Veterinario, 3 = Cliente
        public byte IdEstadoCuenta { get; set; }  // 1 = Activa, 2 = Invitada, 3 = Suspendida
        public string Proveedor { get; set; } = "Local";
        public DateTime FechaRegistro { get; set; }
    }
}
