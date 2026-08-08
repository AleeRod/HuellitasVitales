using HuellasVitalesAPI.Backend.Models.DTOs;
using HuellasVitalesAPI.Backend.Models.Entidades;
using HuellitasVitalesAPI.Data;

namespace HuellitasVitalesAPI.Services
{
    public class ServicioService
    {
        private readonly ConexionDB _context;
        private readonly ComercioValidacionService _validacion;
        private readonly ILogger<ServicioService> _logger;

        public ServicioService(
            ConexionDB context,
            ComercioValidacionService validacion,
            ILogger<ServicioService> logger)
        {
            _context = context;
            _validacion = validacion;
            _logger = logger;
        }

        // ─── REGISTRAR UN SERVICIO EN UNA CLÍNICA VETERINARIA ───
        // Codigo = código HTTP sugerido para que el controlador lo retorne.
        public async Task<(bool Exito, string Mensaje, int Codigo, int IdServicio)> CrearAsync(
            int idUsuario, CrearServicioRequest request)
        {
            try
            {
                // REGLA DE NEGOCIO: los servicios solo existen en clínicas veterinarias.
                var validacion = await _validacion.ValidarComercioHabilitadoAsync(
                    idUsuario, request.IdComercio, ComercioValidacionService.TIPO_COMERCIO_VETERINARIA);

                if (!validacion.Exito)
                    return (false, validacion.Mensaje, validacion.Codigo, 0);

                var servicio = new Servicio
                {
                    IdComercio = request.IdComercio,
                    Nombre = request.Nombre.Trim(),
                    Descripcion = string.IsNullOrWhiteSpace(request.Descripcion) ? null : request.Descripcion.Trim(),
                    DuracionMinutos = request.DuracionMinutos,
                    Precio = request.Precio,
                    IdTipoServicio = request.IdTipoServicio,
                    Activo = true
                };

                _context.Servicios.Add(servicio);
                await _context.SaveChangesAsync();

                _logger.LogInformation(
                    "Servicio {Servicio} creado en el comercio {Comercio} por el usuario {Usuario}.",
                    servicio.IdServicio, request.IdComercio, idUsuario);

                return (true, "Servicio registrado con éxito.", 201, servicio.IdServicio);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al crear el servicio en el comercio {Comercio}", request.IdComercio);
                return (false, "Ocurrió un error interno al registrar el servicio.", 500, 0);
            }
        }
    }
}
