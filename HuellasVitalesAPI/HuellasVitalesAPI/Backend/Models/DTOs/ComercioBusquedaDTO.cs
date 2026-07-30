namespace HuellasVitalesAPI.Backend.Models.DTOs
{
    // Resultado que devuelve la búsqueda dinámica del marketplace.
    // Es un DTO plano para no exponer la entidad completa a la UI.
    public class ComercioBusquedaDTO
    {
        public int IdComercio { get; set; }
        public string NombreComercial { get; set; } = string.Empty;
        public byte IdTipoComercio { get; set; } // 1 = VETERINARIA, 2 = ALMACEN
        public string? Direccion { get; set; }
        public string? Telefono { get; set; }
    }
}
