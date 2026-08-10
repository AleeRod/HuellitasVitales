namespace HuellasVitalesAPI.Backend.Models.DTOs
{
    /// <summary>
    /// Carrito que el navegador manda al momento de pagar.
    /// Solo se aceptan el producto y la cantidad: el precio lo pone el
    /// servidor, porque lo que viene del navegador se puede alterar.
    /// </summary>
    public class CrearOrdenRequest
    {
        public List<ItemOrdenRequest> Items { get; set; } = new();
    }

    public class ItemOrdenRequest
    {
        public int IdProducto { get; set; }
        public int Cantidad { get; set; }
    }

    /// <summary>Resumen de la compra guardada, para mostrarla al cliente.</summary>
    public class OrdenCreadaDTO
    {
        public int IdOrden { get; set; }
        public decimal Total { get; set; }
        public DateTime FechaOrden { get; set; }
        public int CantidadProductos { get; set; }
    }
}
