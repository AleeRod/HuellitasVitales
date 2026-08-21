using HuellasVitalesAPI.Backend.Models.DTOs;
using HuellasVitalesAPI.Backend.Models.Entidades;
using HuellitasVitalesAPI.Data;
using Microsoft.EntityFrameworkCore;

namespace HuellitasVitalesAPI.Services;

public class ExpedienteService
{
    private const byte RolAdministrador = 1;

    private readonly ConexionDB _context;

    public ExpedienteService(ConexionDB context) => _context = context;

    // ─── OBTENER (O ABRIR) EL EXPEDIENTE DE UNA MASCOTA ───
    // Antes este método solo buscaba; nunca creaba nada, así que ninguna mascota podía tener
    // jamás un expediente. Ahora, si no existe, se abre uno automáticamente anclado a la
    // veterinaria de la cita más reciente de esa mascota (CITA no tiene FK directa a COMERCIO,
    // se resuelve vía CITA → SERVICIO → COMERCIO). Si la mascota nunca tuvo una cita, no hay
    // ninguna veterinaria de la que partir, así que se sigue pidiendo agendar una primero.
    public async Task<(bool Exito, string Mensaje, int Codigo, Expediente? Expediente)> ObtenerOCrearAsync(int idMascota, int idUsuario)
    {
        var mascota = await _context.Mascotas.FirstOrDefaultAsync(m => m.IdMascota == idMascota && m.Activo);
        if (mascota == null) return (false, "La mascota no existe o está inactiva.", 404, null);
        if (mascota.IdUsuario != idUsuario) return (false, "No tienes permisos sobre esta mascota.", 403, null);

        var existente = await _context.Expedientes.FirstOrDefaultAsync(e => e.IdMascota == idMascota && e.Activo);
        if (existente != null) return (true, "Expediente encontrado.", 200, existente);

        var idComercioOrigen = await (
            from c in _context.Citas
            join s in _context.Servicios on c.IdServicio equals s.IdServicio
            where c.IdMascota == idMascota
            orderby c.Fecha descending, c.HoraInicio descending
            select (int?)s.IdComercio
        ).FirstOrDefaultAsync();

        if (idComercioOrigen == null)
            return (false, "Tu mascota todavía no tiene ninguna cita registrada en una veterinaria. Agendá una cita, o solicitá una emergencia eligiendo la veterinaria directamente.", 404, null);

        var expediente = await CrearExpedienteAsync(idMascota, idComercioOrigen.Value);
        return (true, "Expediente creado.", 201, expediente);
    }

    // ─── ABRIR EL EXPEDIENTE ELIGIENDO LA VETERINARIA DIRECTAMENTE (sin cita previa) ───
    // Pensado para el flujo de "Solicitar emergencia": una mascota que nunca tuvo una cita no
    // tiene ninguna veterinaria de la que "partir", pero justo una emergencia es el escenario
    // donde más sentido tiene que un cliente nuevo (sin relación previa con ninguna clínica)
    // necesite pedir ayuda. Acá el cliente elige la veterinaria y el expediente se ancla ahí.
    public async Task<(bool Exito, string Mensaje, int Codigo, Expediente? Expediente)> AbrirEligiendoVeterinariaAsync(
        int idMascota, int idUsuario, int idComercio)
    {
        var mascota = await _context.Mascotas.FirstOrDefaultAsync(m => m.IdMascota == idMascota && m.Activo);
        if (mascota == null) return (false, "La mascota no existe o está inactiva.", 404, null);
        if (mascota.IdUsuario != idUsuario) return (false, "No tienes permisos sobre esta mascota.", 403, null);

        var existente = await _context.Expedientes.FirstOrDefaultAsync(e => e.IdMascota == idMascota && e.Activo);
        if (existente != null) return (true, "Expediente encontrado.", 200, existente);

        const byte TIPO_COMERCIO_VETERINARIA = 1;
        const byte ESTADO_APROBADO = 2;
        var comercioValido = await _context.Comercios.AnyAsync(c =>
            c.IdComercio == idComercio && c.IdTipoComercio == TIPO_COMERCIO_VETERINARIA && c.IdEstadoSolicitud == ESTADO_APROBADO);
        if (!comercioValido) return (false, "La veterinaria elegida no existe o no está aprobada.", 404, null);

        var expediente = await CrearExpedienteAsync(idMascota, idComercio);
        return (true, "Expediente abierto en la veterinaria elegida.", 201, expediente);
    }

    // ─── ABRIR EL EXPEDIENTE SIN NINGUNA VETERINARIA (solo para Atenciones Externas) ───
    // A diferencia de Emergencia/Traslado, una atención externa por definición no tiene nada
    // que ver con ninguna veterinaria de la plataforma, así que no tiene sentido obligar al
    // cliente a elegir una solo para poder abrir el expediente. Queda con IdComercioActual en
    // NULL hasta que la mascota tenga su primera cita o un traslado real la ancle a una.
    public async Task<(bool Exito, string Mensaje, int Codigo, Expediente? Expediente)> AbrirSinVeterinariaAsync(int idMascota, int idUsuario)
    {
        var mascota = await _context.Mascotas.FirstOrDefaultAsync(m => m.IdMascota == idMascota && m.Activo);
        if (mascota == null) return (false, "La mascota no existe o está inactiva.", 404, null);
        if (mascota.IdUsuario != idUsuario) return (false, "No tienes permisos sobre esta mascota.", 403, null);

        var existente = await _context.Expedientes.FirstOrDefaultAsync(e => e.IdMascota == idMascota && e.Activo);
        if (existente != null) return (true, "Expediente encontrado.", 200, existente);

        var expediente = await CrearExpedienteAsync(idMascota, null);
        return (true, "Expediente abierto.", 201, expediente);
    }

    private async Task<Expediente> CrearExpedienteAsync(int idMascota, int? idComercio)
    {
        var expediente = new Expediente
        {
            IdMascota = idMascota,
            IdComercioActual = idComercio,
            FechaApertura = DateTime.UtcNow,
            Activo = true
        };
        _context.Expedientes.Add(expediente);
        await _context.SaveChangesAsync();

        // Sembramos el primer acceso: la veterinaria de origen puede consultar y modificar
        // desde el momento en que se abre el expediente (hoy nada más lo hacía). Si se abrió
        // sin veterinaria (idComercio null), no hay a quién darle acceso todavía.
        if (idComercio.HasValue)
        {
            _context.ExpedientesComercios.Add(new ExpedienteComercio
            {
                IdExpediente = expediente.IdExpediente,
                IdComercio = idComercio.Value,
                PuedeConsultar = true,
                PuedeModificar = true,
                FechaDesde = DateTime.UtcNow
            });
            await _context.SaveChangesAsync();
        }

        return expediente;
    }

    // ─── DETALLE COMPLETO DE UN EXPEDIENTE (para el propietario, la(s) veterinaria(s) con
    // acceso, o un administrador) ───
    public async Task<(bool Exito, string Mensaje, int Codigo, object? Datos)> ObtenerDetalleAsync(int idExpediente, int idUsuario, byte rol)
    {
        var expediente = await _context.Expedientes.FirstOrDefaultAsync(e => e.IdExpediente == idExpediente && e.Activo);
        if (expediente == null) return (false, "El expediente no existe o está inactivo.", 404, null);

        var acceso = await EvaluarAccesoAsync(expediente, idUsuario, rol);
        if (!acceso.PuedeConsultar)
            return (false, "No tienes permisos para consultar este expediente.", 403, null);

        var mascota = await _context.Mascotas.FirstOrDefaultAsync(m => m.IdMascota == expediente.IdMascota);
        var comercioActual = expediente.IdComercioActual.HasValue
            ? await _context.Comercios.FirstOrDefaultAsync(c => c.IdComercio == expediente.IdComercioActual.Value)
            : null;

        var historialComercios = await (
            from ec in _context.ExpedientesComercios
            where ec.IdExpediente == idExpediente
            join c in _context.Comercios on ec.IdComercio equals c.IdComercio
            orderby ec.FechaDesde descending
            select new
            {
                ec.IdComercio,
                NombreComercio = c.NombreComercial,
                ec.PuedeConsultar,
                ec.PuedeModificar,
                ec.FechaDesde,
                ec.FechaHasta
            }
        ).ToListAsync();

        var atenciones = await _context.AtencionesExternas
            .Where(a => a.IdExpediente == idExpediente)
            .OrderByDescending(a => a.FechaAtencion)
            .Select(a => new { a.IdAtencionExterna, a.NombreVeterinaria, a.FechaAtencion, a.Motivo })
            .ToListAsync();

        var emergencias = await _context.Emergencias
            .Where(e => e.IdExpediente == idExpediente)
            .OrderByDescending(e => e.FechaSolicitud)
            .Select(e => new { e.IdEmergencia, e.Estado, e.Motivo, e.FechaSolicitud, e.EsAtencionExterna })
            .ToListAsync();

        return (true, "OK", 200, new
        {
            expediente.IdExpediente,
            expediente.IdMascota,
            NombreMascota = mascota != null ? mascota.Nombre : null,
            expediente.IdComercioActual,
            NombreComercioActual = comercioActual != null ? comercioActual.NombreComercial : null,
            expediente.FechaApertura,
            PuedeModificar = acceso.PuedeModificar,
            HistorialComercios = historialComercios,
            AtencionesExternas = atenciones,
            Emergencias = emergencias
        });
    }

    // ─── DATOS PARA EXPORTAR A PDF ───
    // Misma consulta que ObtenerDetalleAsync (y el mismo control de acceso), pero en un tipo
    // fuerte en vez de un objeto anónimo: el generador de PDF necesita poder leer los campos
    // fuera de este método.
    public async Task<(bool Exito, string Mensaje, int Codigo, ExpedienteExportDTO? Datos)> ObtenerParaExportarAsync(int idExpediente, int idUsuario, byte rol)
    {
        var expediente = await _context.Expedientes.FirstOrDefaultAsync(e => e.IdExpediente == idExpediente && e.Activo);
        if (expediente == null) return (false, "El expediente no existe o está inactivo.", 404, null);

        var acceso = await EvaluarAccesoAsync(expediente, idUsuario, rol);
        if (!acceso.PuedeConsultar)
            return (false, "No tienes permisos para consultar este expediente.", 403, null);

        var mascota = await _context.Mascotas.FirstOrDefaultAsync(m => m.IdMascota == expediente.IdMascota);
        var comercioActual = expediente.IdComercioActual.HasValue
            ? await _context.Comercios.FirstOrDefaultAsync(c => c.IdComercio == expediente.IdComercioActual.Value)
            : null;

        var historialComercios = await (
            from ec in _context.ExpedientesComercios
            where ec.IdExpediente == idExpediente
            join c in _context.Comercios on ec.IdComercio equals c.IdComercio
            orderby ec.FechaDesde descending
            select new HistorialComercioExportItem
            {
                NombreComercio = c.NombreComercial,
                PuedeConsultar = ec.PuedeConsultar,
                PuedeModificar = ec.PuedeModificar,
                FechaDesde = ec.FechaDesde,
                FechaHasta = ec.FechaHasta
            }
        ).ToListAsync();

        var atenciones = await _context.AtencionesExternas
            .Where(a => a.IdExpediente == idExpediente)
            .OrderByDescending(a => a.FechaAtencion)
            .Select(a => new AtencionExternaExportItem
            {
                NombreVeterinaria = a.NombreVeterinaria,
                FechaAtencion = a.FechaAtencion,
                Motivo = a.Motivo,
                Diagnostico = a.Diagnostico,
                Tratamiento = a.Tratamiento
            })
            .ToListAsync();

        var emergencias = await _context.Emergencias
            .Where(e => e.IdExpediente == idExpediente)
            .OrderByDescending(e => e.FechaSolicitud)
            .Select(e => new EmergenciaExportItem
            {
                Estado = e.Estado,
                Motivo = e.Motivo,
                FechaSolicitud = e.FechaSolicitud,
                EsAtencionExterna = e.EsAtencionExterna,
                Diagnostico = e.Diagnostico,
                Tratamiento = e.Tratamiento
            })
            .ToListAsync();

        var datos = new ExpedienteExportDTO
        {
            IdExpediente = expediente.IdExpediente,
            NombreMascota = mascota?.Nombre ?? "Mascota",
            NombreComercioActual = comercioActual?.NombreComercial,
            FechaApertura = expediente.FechaApertura,
            HistorialComercios = historialComercios,
            AtencionesExternas = atenciones,
            Emergencias = emergencias
        };

        return (true, "OK", 200, datos);
    }

    // ─── ¿ESTE USUARIO PUEDE CONSULTAR/MODIFICAR ESTE EXPEDIENTE? ───
    // Dueño de la mascota: siempre puede consultar (nunca "modificar" en el sentido clínico,
    // eso es cosa de la veterinaria). Admin: siempre ambos. Comercio (dueño vía PERSONA_LEGAL o
    // funcionario activo vía COMERCIO_FUNCIONARIO): según la fila vigente de
    // EXPEDIENTE_COMERCIO (FechaHasta == null) para ese comercio.
    public async Task<(bool PuedeConsultar, bool PuedeModificar)> EvaluarAccesoAsync(Expediente expediente, int idUsuario, byte rol)
    {
        if (rol == RolAdministrador) return (true, true);

        var mascota = await _context.Mascotas.FirstOrDefaultAsync(m => m.IdMascota == expediente.IdMascota);
        if (mascota != null && mascota.IdUsuario == idUsuario) return (true, false);

        var comerciosDelUsuario = await ComerciosDelUsuarioAsync(idUsuario);
        if (comerciosDelUsuario.Count == 0) return (false, false);

        var accesoVigente = await _context.ExpedientesComercios
            .Where(ec => ec.IdExpediente == expediente.IdExpediente && ec.FechaHasta == null && comerciosDelUsuario.Contains(ec.IdComercio))
            .FirstOrDefaultAsync();

        if (accesoVigente == null) return (false, false);
        return (accesoVigente.PuedeConsultar, accesoVigente.PuedeModificar);
    }

    private async Task<List<int>> ComerciosDelUsuarioAsync(int idUsuario)
    {
        var propios = await (
            from c in _context.Comercios
            join p in _context.PersonasLegales on c.IdPersonaLegal equals p.IdPersonaLegal
            where p.IdUsuario == idUsuario
            select c.IdComercio
        ).ToListAsync();

        var funcionario = await _context.ComerciosFuncionarios
            .Where(f => f.IdUsuario == idUsuario && f.Activo)
            .Select(f => f.IdComercio)
            .ToListAsync();

        return propios.Union(funcionario).Distinct().ToList();
    }
}
