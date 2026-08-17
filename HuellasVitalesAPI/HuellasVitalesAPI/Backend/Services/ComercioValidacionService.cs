using HuellitasVitalesAPI.Data;
using Microsoft.EntityFrameworkCore;

namespace HuellitasVitalesAPI.Services
{
    /// <summary>
    /// Reglas de negocio compartidas sobre qué puede publicar un comercio.
    ///
    /// Regla: un funcionario solo puede registrar PRODUCTOS en un ALMACÉN
    /// y SERVICIOS en una CLÍNICA VETERINARIA. 
    /// Un Administrador puede registrar en cualquier comercio, pero se 
    /// sigue respetando el tipo de comercio y que esté aprobado.
    /// </summary>
    public class ComercioValidacionService
    {
        // Ids de TIPO_COMERCIO_CAT. Coinciden con los que envía el frontend
        // en SolicitudComercio.jsx y con los que interpreta Marketplace.jsx.
        public const byte TIPO_COMERCIO_VETERINARIA = 1;
        public const byte TIPO_COMERCIO_ALMACEN = 2;

        // ESTADO_SOLICITUD_CAT: 1 = pendiente, 2 = aprobado.
        private const byte ESTADO_SOLICITUD_APROBADO = 2;

        private readonly ConexionDB _context;
        private readonly ILogger<ComercioValidacionService> _logger;

        public ComercioValidacionService(ConexionDB context, ILogger<ComercioValidacionService> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Verifica que el usuario pueda publicar en el comercio indicado y que
        /// ese comercio sea del tipo requerido para el ítem que intenta crear.
        /// Si el usuario es Admin, omite la validación de pertenencia.
        /// Codigo = código HTTP sugerido para que el controlador lo retorne.
        /// </summary>
        public async Task<(bool Exito, string Mensaje, int Codigo)> ValidarComercioHabilitadoAsync(
            int idUsuario, int idComercio, byte idTipoComercioRequerido, bool esAdmin)
        {
            var datos = await (from c in _context.Comercios
                            join p in _context.PersonasLegales
                                on c.IdPersonaLegal equals p.IdPersonaLegal
                            where c.IdComercio == idComercio
                            select new
                            {
                                c.IdTipoComercio,
                                c.IdEstadoSolicitud,
                                c.NombreComercial,
                                IdUsuarioPropietario = p.IdUsuario
                            })
                            .FirstOrDefaultAsync();

            // 404 - El comercio no existe en la BD
            if (datos == null)
                return (false, "El comercio indicado no existe.", 404);

            // 403 - El usuario NO es admin y el comercio NO le pertenece
            if (!esAdmin && datos.IdUsuarioPropietario != idUsuario)
            {
                _logger.LogWarning(
                    "El usuario {Usuario} (Funcionario) intentó publicar en el comercio {Comercio}, que no le pertenece.",
                    idUsuario, idComercio);

                return (false, "No tienes permisos para publicar en este comercio, ya que no estás vinculado a él.", 403);
            }

            // 403 - El comercio todavía no fue aprobado por un administrador (Aplica para ambos roles)
            if (datos.IdEstadoSolicitud != ESTADO_SOLICITUD_APROBADO)
                return (false,
                    $"El comercio '{datos.NombreComercial}' aún no está aprobado. " +
                    "No se pueden registrar ítems hasta que sea aprobado.",
                    403);

            // 403 - El tipo de comercio no corresponde al ítem que se quiere crear (Aplica para ambos roles)
            if (datos.IdTipoComercio != idTipoComercioRequerido)
            {
                var itemSolicitado = idTipoComercioRequerido == TIPO_COMERCIO_ALMACEN
                    ? "productos"
                    : "servicios";

                return (false,
                    $"Solo se pueden registrar {itemSolicitado} en un comercio de tipo " +
                    $"'{NombreTipoComercio(idTipoComercioRequerido)}'. " +
                    $"'{datos.NombreComercial}' está registrado como " +
                    $"'{NombreTipoComercio(datos.IdTipoComercio)}'.",
                    403);
            }

            return (true, "El comercio está habilitado.", 200);
        }

        private static string NombreTipoComercio(byte idTipoComercio) => idTipoComercio switch
        {
            TIPO_COMERCIO_VETERINARIA => "Clínica Veterinaria",
            TIPO_COMERCIO_ALMACEN => "Almacén",
            _ => "Comercio"
        };

        /// <summary>
        /// Igual que ValidarComercioHabilitadoAsync pero sin exigir un tipo de comercio
        /// específico — para funcionalidades que aplican a cualquier comercio (ej. empleados).
        /// </summary>
        public async Task<(bool Exito, string Mensaje, int Codigo)> ValidarPropietarioComercioAsync(
            int idUsuario, int idComercio, bool esAdmin)
        {
            var datos = await (from c in _context.Comercios
                            join p in _context.PersonasLegales
                                on c.IdPersonaLegal equals p.IdPersonaLegal
                            where c.IdComercio == idComercio
                            select new
                            {
                                c.IdEstadoSolicitud,
                                c.NombreComercial,
                                IdUsuarioPropietario = p.IdUsuario
                            })
                            .FirstOrDefaultAsync();

            if (datos == null)
                return (false, "El comercio indicado no existe.", 404);

            if (!esAdmin && datos.IdUsuarioPropietario != idUsuario)
                return (false, "No estás vinculado a este comercio.", 403);

            if (datos.IdEstadoSolicitud != ESTADO_SOLICITUD_APROBADO)
                return (false,
                    $"El comercio '{datos.NombreComercial}' aún no está aprobado.",
                    403);

            return (true, "El comercio está habilitado.", 200);
        }
    }
}