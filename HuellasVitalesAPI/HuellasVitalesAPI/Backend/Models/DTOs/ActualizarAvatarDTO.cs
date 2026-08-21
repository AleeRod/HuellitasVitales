namespace HuellasVitalesAPI.Backend.Models.DTOs
{
    // Clave del ícono elegido (ver UsuarioService.IconosPerfilValidos). Se valida contra esa
    // lista blanca en el servicio — nunca se guarda un valor arbitrario.
    public class ActualizarAvatarDTO
    {
        public string Icono { get; set; } = string.Empty;
    }
}
