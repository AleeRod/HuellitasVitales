namespace HuellasVitalesAPI.Backend.Models.DTOs
{
    // Access token de Google obtenido vía el flujo implícito de useGoogleLogin (switch de
    // Configuración) — distinto del credential/ID token (JWT) que usa LoginSocialRequest para
    // el flujo de POST /api/usuario/vincular-google basado en <GoogleLogin>.
    public class VincularGoogleTokenDTO
    {
        public string AccessToken { get; set; } = string.Empty;
    }
}
