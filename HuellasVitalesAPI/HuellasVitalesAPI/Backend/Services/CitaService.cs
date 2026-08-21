using HuellasVitalesAPI.Backend.Models.DTOs;
using HuellasVitalesAPI.Backend.Models.Entidades;
using HuellitasVitalesAPI.Controllers;
using HuellitasVitalesAPI.Data;
using Microsoft.EntityFrameworkCore;

namespace HuellitasVitalesAPI.Services
{
    public class CitaService
    {
        private const short ESTADO_PENDIENTE = 1;
        private const short ESTADO_CONFIRMADA = 2;
        private const short ESTADO_CANCELADA = 3;
        private const short ESTADO_COMPLETADA = 4;

        private readonly ConexionDB _context;
        private readonly ILogger<CitaService> _logger;

        public CitaService(ConexionDB context, ILogger<CitaService> logger)
        {
            _context = context;
            _logger = logger;
        }

        // ─── CREAR UNA SOLICITUD DE CITA (tarea 185 + validación 187) ───
        public async Task<(bool Exito, string Mensaje, int Codigo, CitaDTO? Cita)> CrearAsync(
            int idUsuario, CrearCitaRequest request)
        {
            try
            {
                // 1) La mascota debe existir, estar activa, y pertenecerle al usuario que agenda.
                var mascota = await _context.Mascotas.FirstOrDefaultAsync(m => m.IdMascota == request.IdMascota);
                if (mascota == null || !mascota.Activo)
                    return (false, "La mascota indicada no existe o no está activa.", 404, null);

                if (mascota.IdUsuario != idUsuario)
                    return (false, "Esa mascota no te pertenece.", 403, null);

                // 2) El servicio debe existir y estar activo.
                var servicio = await _context.Servicios.FirstOrDefaultAsync(s => s.IdServicio == request.IdServicio);
                if (servicio == null || !servicio.Activo)
                    return (false, "El servicio indicado no existe o no está disponible.", 404, null);

                // 3) Resolver el veterinario: si el servicio ya tiene uno asignado, se fuerza ese;
                //    si el cliente mandó otro distinto, es un error. Si el servicio no tiene
                //    veterinario fijo, el cliente debe indicar cuál quiere.
                int idVeterinarioFinal;
                if (servicio.IdVeterinario.HasValue)
                {
                    if (request.IdVeterinario.HasValue && request.IdVeterinario.Value != servicio.IdVeterinario.Value)
                        return (false,
                            "Este servicio solo lo ofrece un veterinario específico; no podés elegir otro.",
                            400, null);

                    idVeterinarioFinal = servicio.IdVeterinario.Value;
                }
                else
                {
                    // El servicio no trae un veterinario fijo (dato legado, previo a que
                    // IdVeterinario fuera obligatorio al crear un servicio). En cualquier caso,
                    // el veterinario -elegido o por defecto- debe pertenecer a LA MISMA
                    // veterinaria (servicio.IdComercio) que el servicio, nunca a otra clínica.
                    if (request.IdVeterinario.HasValue)
                    {
                        var veterinarioSolicitado = await _context.Veterinarios
                            .FirstOrDefaultAsync(v => v.IdVeterinario == request.IdVeterinario.Value);

                        if (veterinarioSolicitado == null || veterinarioSolicitado.IdComercio != servicio.IdComercio)
                            return (false, "El veterinario seleccionado no pertenece a esta veterinaria.", 400, null);

                        idVeterinarioFinal = request.IdVeterinario.Value;
                    }
                    else
                    {
                        var veterinarioPorDefecto = await _context.Veterinarios
                            .Where(v => v.IdComercio == servicio.IdComercio)
                            .OrderBy(v => v.IdVeterinario)
                            .FirstOrDefaultAsync();

                        if (veterinarioPorDefecto == null)
                            return (false, "No hay veterinarios disponibles para este servicio en este momento.", 400, null);

                        idVeterinarioFinal = veterinarioPorDefecto.IdVeterinario;
                    }
                }

                var veterinario = await _context.Veterinarios
                    .FirstOrDefaultAsync(v => v.IdVeterinario == idVeterinarioFinal);
                if (veterinario == null)
                    return (false, "El veterinario indicado no existe.", 404, null);

                // 4) La fecha no puede ser en el pasado.
                if (request.Fecha.Date < DateTime.UtcNow.Date)
                    return (false, "No podés agendar una cita en una fecha pasada.", 400, null);

                // 5) Calcular hora de fin según la duración del servicio.
                var horaFin = request.HoraInicio.Add(TimeSpan.FromMinutes(servicio.DuracionMinutos));

                // 6) La cita debe caer dentro del horario laboral del veterinario ese día.
                // DiaSemana: 0 = Domingo ... 6 = Sábado (igual que DayOfWeek de .NET)
                var diaSemana = (short)request.Fecha.DayOfWeek;

                var dentroDeHorario = await _context.HorariosVeterinario.AnyAsync(h =>
                    h.IdVeterinario == idVeterinarioFinal &&
                    h.Activo &&
                    h.DiaSemana == diaSemana &&
                    h.HoraInicio <= request.HoraInicio &&
                    h.HoraFin >= horaFin);

                if (!dentroDeHorario)
                    return (false,
                        "El veterinario no atiende en ese horario. Revisá su disponibilidad.",
                        400, null);

                // 7) TAREA 187 — Validar que no se cruce con otra cita ya existente
                //    del mismo veterinario ese día (se ignoran las canceladas).
                var haySolape = await _context.Citas.AnyAsync(c =>
                    c.IdVeterinario == idVeterinarioFinal &&
                    c.Fecha.Date == request.Fecha.Date &&
                    c.IdEstadoCita != ESTADO_CANCELADA &&
                    c.HoraInicio < horaFin &&
                    c.HoraFin > request.HoraInicio);

                if (haySolape)
                    return (false,
                        "Ese horario ya está ocupado para este veterinario. Elegí otro horario.",
                        409, null);

                // 8) Todo validado: crear la cita.
                var cita = new Cita
                {
                    IdUsuario = idUsuario,
                    IdMascota = request.IdMascota,
                    IdVeterinario = idVeterinarioFinal,
                    IdServicio = request.IdServicio,
                    IdEstadoCita = ESTADO_PENDIENTE,
                    Fecha = request.Fecha.Date,
                    HoraInicio = request.HoraInicio,
                    HoraFin = horaFin,
                    Notas = string.IsNullOrWhiteSpace(request.Notas) ? null : request.Notas.Trim(),
                    FechaCreacion = DateTime.UtcNow
                };

                _context.Citas.Add(cita);
                await _context.SaveChangesAsync();

                _logger.LogInformation(
                    "Cita {Cita} creada por el usuario {Usuario} con el veterinario {Vet} para el {Fecha} {Hora}",
                    cita.IdCita, idUsuario, idVeterinarioFinal, request.Fecha, request.HoraInicio);

                var dto = await ObtenerDTOAsync(cita.IdCita);
                return (true, "Cita solicitada con éxito. Queda pendiente de confirmación.", 201, dto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al crear la cita para el usuario {Usuario}", idUsuario);
                return (false, "Ocurrió un error interno al agendar la cita.", 500, null);
            }
        }

        public async Task<List<CitaDTO>> ObtenerPorUsuarioAsync(int idUsuario)
        {
            var citas = await (
                from c in _context.Citas
                where c.IdUsuario == idUsuario
                join m in _context.Mascotas on c.IdMascota equals m.IdMascota
                join v in _context.Veterinarios on c.IdVeterinario equals v.IdVeterinario
                join uv in _context.Usuarios on v.IdUsuario equals uv.IdUsuario
                join s in _context.Servicios on c.IdServicio equals s.IdServicio
                join e in _context.EstadosCitaCat on c.IdEstadoCita equals e.IdEstadoCita
                orderby c.Fecha, c.HoraInicio
                select new CitaDTO
                {
                    IdCita = c.IdCita,
                    IdMascota = c.IdMascota,
                    NombreMascota = m.Nombre,
                    Especie = m.Raza ?? "Desconocida",
                    NombreCliente = "Yo",
                    IdVeterinario = c.IdVeterinario,
                    NombreVeterinario = uv.Nombre + " " + uv.Apellidos,
                    IdServicio = c.IdServicio,
                    NombreServicio = s.Nombre,
                    IdTipoServicio = s.IdTipoServicio,
                    IdEstadoCita = c.IdEstadoCita,
                    EstadoCita = e.Nombre,
                    Fecha = c.Fecha,
                    HoraInicio = c.HoraInicio,
                    HoraFin = c.HoraFin,
                    Notas = c.Notas
                }).ToListAsync();

            return citas;
        }

        public async Task<Veterinario?> ObtenerVeterinarioPorUsuarioAsync(int idUsuario)
        {
            return await _context.Veterinarios.FirstOrDefaultAsync(v => v.IdUsuario == idUsuario);
        }

        public async Task<List<CitaDTO>> ObtenerPorVeterinarioAsync(int idVeterinario)
        {
            var citas = await (
                from c in _context.Citas
                where c.IdVeterinario == idVeterinario
                join m in _context.Mascotas on c.IdMascota equals m.IdMascota
                join u in _context.Usuarios on c.IdUsuario equals u.IdUsuario
                join s in _context.Servicios on c.IdServicio equals s.IdServicio
                join e in _context.EstadosCitaCat on c.IdEstadoCita equals e.IdEstadoCita
                orderby c.Fecha, c.HoraInicio
                select new CitaDTO
                {
                    IdCita = c.IdCita,
                    IdMascota = c.IdMascota,
                    NombreMascota = m.Nombre,
                    Especie = m.Raza ?? "Desconocida",
                    NombreCliente = u.Nombre + " " + u.Apellidos,
                    IdVeterinario = c.IdVeterinario,
                    NombreVeterinario = "",
                    IdServicio = c.IdServicio,
                    NombreServicio = s.Nombre,
                    IdTipoServicio = s.IdTipoServicio,
                    IdEstadoCita = c.IdEstadoCita,
                    EstadoCita = e.Nombre,
                    Fecha = c.Fecha,
                    HoraInicio = c.HoraInicio,
                    HoraFin = c.HoraFin,
                    Notas = c.Notas
                }).ToListAsync();

            return citas;
        }

        public async Task<(bool Exito, string Mensaje, int Codigo, CitaDTO? Cita)> ConfirmarAsync(
            int idCita, int idUsuarioActual, byte rolUsuario)
        {
            var cita = await _context.Citas.FirstOrDefaultAsync(c => c.IdCita == idCita);
            if (cita == null)
                return (false, "La cita indicada no existe.", 404, null);

            if (!await TienePermisoParaGestionarCitaAsync(cita, idUsuarioActual, rolUsuario, permitirClientePropietario: false))
                return (false, "No tienes permisos para confirmar esta cita.", 403, null);

            if (cita.IdEstadoCita == ESTADO_CANCELADA)
                return (false, "No se puede confirmar una cita cancelada.", 400, null);

            if (cita.IdEstadoCita == ESTADO_COMPLETADA)
                return (false, "La cita ya se encuentra completada.", 400, null);

            cita.IdEstadoCita = ESTADO_CONFIRMADA;
            await _context.SaveChangesAsync();

            var dto = await ObtenerDTOAsync(idCita);
            return (true, "Cita confirmada correctamente.", 200, dto);
        }

        public async Task<(bool Exito, string Mensaje, int Codigo, CitaDTO? Cita)> ReprogramarAsync(
            int idCita, ReprogramarCitaRequest request, int idUsuarioActual, byte rolUsuario)
        {
            var cita = await _context.Citas.FirstOrDefaultAsync(c => c.IdCita == idCita);
            if (cita == null)
                return (false, "La cita indicada no existe.", 404, null);

            if (!await TienePermisoParaGestionarCitaAsync(cita, idUsuarioActual, rolUsuario, permitirClientePropietario: true))
                return (false, "No tienes permisos para reprogramar esta cita.", 403, null);

            if (cita.IdEstadoCita == ESTADO_CANCELADA)
                return (false, "No se puede reprogramar una cita cancelada.", 400, null);

            if (request.Fecha.Date < DateTime.UtcNow.Date)
                return (false, "La nueva fecha no puede estar en el pasado.", 400, null);

            var servicio = await _context.Servicios.FirstOrDefaultAsync(s => s.IdServicio == cita.IdServicio);
            if (servicio == null || !servicio.Activo)
                return (false, "El servicio de la cita ya no está disponible.", 404, null);

            var nuevaHoraFin = request.HoraInicio.Add(TimeSpan.FromMinutes(servicio.DuracionMinutos));
            var diaSemana = (short)request.Fecha.DayOfWeek;

            var dentroDeHorario = await _context.HorariosVeterinario.AnyAsync(h =>
                h.IdVeterinario == cita.IdVeterinario &&
                h.Activo &&
                h.DiaSemana == diaSemana &&
                h.HoraInicio <= request.HoraInicio &&
                h.HoraFin >= nuevaHoraFin);

            if (!dentroDeHorario)
                return (false, "El veterinario no atiende en ese horario. Elegí otro horario o fecha.", 400, null);

            var haySolape = await _context.Citas.AnyAsync(c =>
                c.IdCita != idCita &&
                c.IdVeterinario == cita.IdVeterinario &&
                c.Fecha.Date == request.Fecha.Date &&
                c.IdEstadoCita != ESTADO_CANCELADA &&
                c.HoraInicio < nuevaHoraFin &&
                c.HoraFin > request.HoraInicio);

            if (haySolape)
                return (false, "Ese horario ya está ocupado por otra cita.", 409, null);

            cita.Fecha = request.Fecha.Date;
            cita.HoraInicio = request.HoraInicio;
            cita.HoraFin = nuevaHoraFin;
            cita.IdEstadoCita = ESTADO_PENDIENTE;
            if (!string.IsNullOrWhiteSpace(request.Notas))
                cita.Notas = request.Notas.Trim();

            await _context.SaveChangesAsync();

            var dto = await ObtenerDTOAsync(idCita);
            return (true, "Cita reprogramada correctamente. Queda pendiente de confirmación.", 200, dto);
        }

        public async Task<(bool Exito, string Mensaje, int Codigo, CitaDTO? Cita)> CancelarAsync(
            int idCita, string? motivo, int idUsuarioActual, byte rolUsuario)
        {
            var cita = await _context.Citas.FirstOrDefaultAsync(c => c.IdCita == idCita);
            if (cita == null)
                return (false, "La cita indicada no existe.", 404, null);

            if (!await TienePermisoParaGestionarCitaAsync(cita, idUsuarioActual, rolUsuario, permitirClientePropietario: true))
                return (false, "No tienes permisos para cancelar esta cita.", 403, null);

            if (cita.IdEstadoCita == ESTADO_CANCELADA)
                return (false, "La cita ya está cancelada.", 400, null);

            if (cita.IdEstadoCita == ESTADO_COMPLETADA)
                return (false, "No se puede cancelar una cita completada.", 400, null);

            cita.IdEstadoCita = ESTADO_CANCELADA;
            if (!string.IsNullOrWhiteSpace(motivo))
                cita.Notas = string.IsNullOrWhiteSpace(cita.Notas) ? motivo.Trim() : cita.Notas + " | " + motivo.Trim();

            await _context.SaveChangesAsync();

            var dto = await ObtenerDTOAsync(idCita);
            return (true, "Cita cancelada correctamente.", 200, dto);
        }

        // ─── COMPLETAR (nota clínica rápida del panel del veterinario) ───
        // Solo el veterinario a cargo (o un admin) puede cerrar la cita, y solo si ya fue
        // confirmada — no tiene sentido "completar" algo que ni siquiera se atendió.
        public async Task<(bool Exito, string Mensaje, int Codigo, CitaDTO? Cita)> CompletarAsync(
            int idCita, string? notas, int idUsuarioActual, byte rolUsuario)
        {
            var cita = await _context.Citas.FirstOrDefaultAsync(c => c.IdCita == idCita);
            if (cita == null)
                return (false, "La cita indicada no existe.", 404, null);

            if (!await TienePermisoParaGestionarCitaAsync(cita, idUsuarioActual, rolUsuario, permitirClientePropietario: false))
                return (false, "No tienes permisos para completar esta cita.", 403, null);

            if (cita.IdEstadoCita == ESTADO_CANCELADA)
                return (false, "No se puede completar una cita cancelada.", 400, null);

            if (cita.IdEstadoCita == ESTADO_COMPLETADA)
                return (false, "La cita ya se encuentra completada.", 400, null);

            cita.IdEstadoCita = ESTADO_COMPLETADA;
            if (!string.IsNullOrWhiteSpace(notas))
                cita.Notas = string.IsNullOrWhiteSpace(cita.Notas) ? notas.Trim() : cita.Notas + " | " + notas.Trim();

            await _context.SaveChangesAsync();

            var dto = await ObtenerDTOAsync(idCita);
            return (true, "Cita marcada como completada.", 200, dto);
        }

        private async Task<bool> TienePermisoParaGestionarCitaAsync(Cita cita, int idUsuarioActual, byte rolUsuario, bool permitirClientePropietario)
        {
            if (rolUsuario == 1)
                return true;

            if (rolUsuario == 2)
            {
                var veterinario = await _context.Veterinarios.FirstOrDefaultAsync(v => v.IdVeterinario == cita.IdVeterinario);
                return veterinario != null && veterinario.IdUsuario == idUsuarioActual;
            }

            return permitirClientePropietario && cita.IdUsuario == idUsuarioActual;
        }

        // ─── Arma el DTO completo (con nombres) para devolver al frontend ───
        private async Task<CitaDTO?> ObtenerDTOAsync(int idCita)
        {
            return await (
                from c in _context.Citas
                where c.IdCita == idCita
                join m in _context.Mascotas on c.IdMascota equals m.IdMascota
                join v in _context.Veterinarios on c.IdVeterinario equals v.IdVeterinario
                join uv in _context.Usuarios on v.IdUsuario equals uv.IdUsuario
                join s in _context.Servicios on c.IdServicio equals s.IdServicio
                join e in _context.EstadosCitaCat on c.IdEstadoCita equals e.IdEstadoCita
                select new CitaDTO
                {
                    IdCita = c.IdCita,
                    IdMascota = c.IdMascota,
                    NombreMascota = m.Nombre,
                    IdVeterinario = c.IdVeterinario,
                    NombreVeterinario = uv.Nombre + " " + uv.Apellidos,
                    IdServicio = c.IdServicio,
                    NombreServicio = s.Nombre,
                    IdEstadoCita = c.IdEstadoCita,
                    EstadoCita = e.Nombre,
                    Fecha = c.Fecha,
                    HoraInicio = c.HoraInicio,
                    HoraFin = c.HoraFin,
                    Notas = c.Notas
                }
            ).FirstOrDefaultAsync();
        }
    }
}