namespace HuellasVitalesAPI.Backend.Models.DTOs
{
    public class LoginSocialRequest
    {
        public string? Token { get; set; }
        public string? Proveedor { get; set; } // "Google" o "Facebook"
    }
}