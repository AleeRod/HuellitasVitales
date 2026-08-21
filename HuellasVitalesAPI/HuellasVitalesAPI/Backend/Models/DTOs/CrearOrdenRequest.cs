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

        // Elegido en la simulación de checkout ("tarjeta", "sinpe" o "efectivo").
        // No se valida contra una lista fija: es solo texto para mostrar en el recibo,
        // ningún cobro real depende de este valor.
        public string? MetodoPago { get; set; }
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

    /// <summary>Una fila de "Mis compras": lo mínimo para listar sin pedir el detalle completo.</summary>
    public class OrdenResumenDTO
    {
        public int IdOrden { get; set; }
        public DateTime FechaOrden { get; set; }
        public decimal Total { get; set; }
        public int CantidadProductos { get; set; }
        public string? MetodoPago { get; set; }
        public string EstadoOrden { get; set; } = string.Empty;
    }

    /// <summary>Una línea de producto dentro del recibo/factura.</summary>
    public class ItemFacturaDTO
    {
        public int IdProducto { get; set; }
        public string NombreProducto { get; set; } = string.Empty;
        public string? ImagenUrl { get; set; }
        public int Cantidad { get; set; }
        public decimal PrecioUnitario { get; set; }
        public decimal Subtotal => PrecioUnitario * Cantidad;
    }

    /// <summary>Recibo/factura interna completa de una orden ya pagada (simulada).</summary>
    public class FacturaDTO
    {
        public int IdOrden { get; set; }
        public DateTime FechaOrden { get; set; }
        public decimal Total { get; set; }
        public string? MetodoPago { get; set; }
        public string EstadoOrden { get; set; } = string.Empty;
        public string NombreCliente { get; set; } = string.Empty;
        public string CorreoCliente { get; set; } = string.Empty;
        public List<ItemFacturaDTO> Items { get; set; } = new();
    }
}
