using System.ComponentModel.DataAnnotations;

namespace HuellasVitalesAPI.Backend.Models.Entidades
{
    public class Usuario
    {
        [Key]
        public int IdUsuario { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public string Apellidos { get; set; } = string.Empty;
        public string Correo { get; set; } = string.Empty;
        public string? Telefono { get; set; }

        public string? PasswordHash { get; set; }
        public string Proveedor_Auth { get; set; } = "Local";
        public string? Proveedor_Id { get; set; }

        // Se cambia a byte para coincidir con TINYINT de la base de datos
        public byte IdRol { get; set; }
        
        // Reemplaza a 'Activo' (1 = ACTIVA, 2 = INVITADA, 3 = SUSPENDIDA)
        public byte IdEstadoCuenta { get; set; } = 1; 
        
        public DateTime FechaRegistro { get; set; } = DateTime.Now;
    }
}