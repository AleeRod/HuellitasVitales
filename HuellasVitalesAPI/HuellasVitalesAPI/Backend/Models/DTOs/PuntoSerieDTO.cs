namespace HuellasVitalesAPI.Backend.Models.DTOs
{
    // Un punto de una serie de tiempo para los gráficos del panel de Administración (p. ej.
    // registros de usuarios por semana/mes/año).
    public class PuntoSerieDTO
    {
        public string Etiqueta { get; set; } = string.Empty;
        public int Cantidad { get; set; }
    }
}
