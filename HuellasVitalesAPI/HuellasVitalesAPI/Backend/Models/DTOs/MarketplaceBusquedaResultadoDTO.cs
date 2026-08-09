namespace HuellasVitalesAPI.Backend.Models.DTOs
{
    public class MarketplaceBusquedaResultadoDTO
    {
        public List<ProductoBusquedaDTO> Productos { get; set; } = new();
        public List<ServicioBusquedaDTO> Servicios { get; set; } = new();
    }
}