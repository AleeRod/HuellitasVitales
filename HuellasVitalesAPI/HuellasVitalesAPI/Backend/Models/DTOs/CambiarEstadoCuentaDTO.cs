namespace HuellasVitalesAPI.Backend.Models.DTOs
{
    // 1 = Activa, 2 = Invitada, 3 = Suspendida.
    public class CambiarEstadoCuentaDTO
    {
        public byte IdEstadoCuenta { get; set; }
    }
}
