using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

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

        // Clave del ícono predefinido elegido como avatar (ver UsuarioService.IconosPerfilValidos).
        // Columna nueva — requiere correr en Supabase:
        // ALTER TABLE public."USUARIO" ADD COLUMN "AvatarIcono" varchar(30) NULL;
        [Column("AvatarIcono")]
        public string? AvatarIcono { get; set; }

        // Se cambia a byte para coincidir con TINYINT de la base de datos
        public byte IdRol { get; set; }
        
        // Reemplaza a 'Activo' (1 = ACTIVA, 2 = INVITADA, 3 = SUSPENDIDA)
        public byte IdEstadoCuenta { get; set; } = 1; 
        
        public DateTime FechaRegistro { get; set; } = DateTime.UtcNow;
    }
}