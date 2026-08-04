using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Mvc;

namespace HuellasVitalesAPI.Backend.Common
{
    /// <summary>
    /// Formato ÚNICO de respuesta para los endpoints del API.
    /// Respeta la convención que ya usa el proyecto: { success, mensaje }.
    /// Opcionalmente incluye `datos` (payload) y `errores` (validación por campo).
    /// Las propiedades nulas no se serializan, para no romper las respuestas existentes.
    /// </summary>
    public class RespuestaApi
    {
        public bool Success { get; set; }

        public string Mensaje { get; set; } = string.Empty;

        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public object? Datos { get; set; }

        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public object? Errores { get; set; }

        /// <summary>Respuesta exitosa (success = true), con mensaje y datos opcionales.</summary>
        public static RespuestaApi Ok(string mensaje = "", object? datos = null)
            => new() { Success = true, Mensaje = mensaje, Datos = datos };

        /// <summary>Respuesta de fallo (success = false), con mensaje y errores opcionales.</summary>
        public static RespuestaApi Fallo(string mensaje, object? errores = null)
            => new() { Success = false, Mensaje = mensaje, Errores = errores };
    }

    /// <summary>
    /// Atajos para que los controladores devuelvan siempre el mismo formato,
    /// en especial a partir de las tuplas (Exito, Mensaje, Codigo) de la capa de servicios.
    /// </summary>
    public static class RespuestaApiExtensions
    {
        /// <summary>Devuelve un IActionResult con el body estándar y el código HTTP indicado.</summary>
        public static IActionResult Respuesta(
            this ControllerBase controller, int codigoHttp, bool exito, string mensaje, object? datos = null)
        {
            var body = exito ? RespuestaApi.Ok(mensaje, datos) : RespuestaApi.Fallo(mensaje);
            return controller.StatusCode(codigoHttp, body);
        }

        /// <summary>Mapea la tupla típica de servicio (Exito, Mensaje, Codigo) a una respuesta estándar.</summary>
        public static IActionResult DesdeResultado(
            this ControllerBase controller, (bool Exito, string Mensaje, int Codigo) resultado, object? datos = null)
            => controller.Respuesta(resultado.Codigo, resultado.Exito, resultado.Mensaje, resultado.Exito ? datos : null);
    }
}
