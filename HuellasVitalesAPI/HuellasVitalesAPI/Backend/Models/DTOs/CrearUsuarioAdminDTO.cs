namespace HuellasVitalesAPI.Backend.Models.DTOs
{
    // El admin crea una cuenta nueva directamente (a diferencia del auto-registro normal, que
    // siempre entra como Cliente) — por eso acá sí se puede elegir el rol desde el inicio.
    public class CrearUsuarioAdminDTO
    {
        public string Nombre { get; set; } = string.Empty;
        public string Apellidos { get; set; } = string.Empty;
        public string Correo { get; set; } = string.Empty;
        public string? Telefono { get; set; }
        public string Password { get; set; } = string.Empty;
        public byte IdRol { get; set; } = 3;
    }
}
