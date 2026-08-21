using HuellasVitalesAPI.Backend.Models.DTOs;
using HuellasVitalesAPI.Backend.Models.Entidades;
using HuellitasVitalesAPI.Data;
using Microsoft.EntityFrameworkCore;

namespace HuellitasVitalesAPI.Services
{
    // Vistas de plataforma completa para el panel de Administración — cosas que no tienen un
    // dueño natural en ningún otro Service/Controller existente (a diferencia de, por ejemplo,
    // UsuarioService.ObtenerMascotasPorUsuarioAsync, que solo lista las mascotas de UN dueño, o
    // CitaService.ObtenerPorVeterinarioAsync, que solo lista las citas de UN veterinario).
    public class AdminService
    {
        private readonly ConexionDB _context;

        public AdminService(ConexionDB context)
        {
            _context = context;
        }

        // Todas las mascotas de la plataforma + quién es su dueño. Mantiene el mismo criterio
        // ya usado en UsuarioService para el nombre de especie (Mascota no tiene un join real
        // contra ESPECIE_CAT en ningún lado del proyecto todavía).
        public async Task<List<MascotaAdminDTO>> ListarMascotasAsync(string? busqueda)
        {
            var query = from m in _context.Mascotas
                        join u in _context.Usuarios on m.IdUsuario equals u.IdUsuario
                        select new MascotaAdminDTO
                        {
                            IdMascota = m.IdMascota,
                            Nombre = m.Nombre,
                            Especie = m.IdEspecie == 1 ? "Perro" : m.IdEspecie == 2 ? "Gato" : "Otra",
                            Raza = m.Raza,
                            FechaNacimiento = m.FechaNacimiento,
                            Activo = m.Activo,
                            IdUsuario = m.IdUsuario,
                            NombreDueno = u.Nombre + " " + u.Apellidos,
                            CorreoDueno = u.Correo
                        };

            if (!string.IsNullOrWhiteSpace(busqueda))
            {
                var termino = busqueda.Trim().ToLower();
                query = query.Where(x =>
                    x.Nombre.ToLower().Contains(termino) ||
                    x.NombreDueno.ToLower().Contains(termino) ||
                    x.CorreoDueno.ToLower().Contains(termino));
            }

            return await query.OrderByDescending(x => x.IdMascota).ToListAsync();
        }

        // El admin registra una mascota a nombre de cualquier usuario existente — mismo
        // criterio de alta que UsuarioService.CrearMascotaAsync (que usa el propio cliente
        // para sus mascotas), salvo que acá el dueño lo elige el admin en vez de resolverse
        // del JWT de quien llama.
        public async Task<(bool Exito, string Mensaje, MascotaAdminDTO? Mascota)> CrearMascotaParaUsuarioAsync(CrearMascotaAdminRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Nombre))
                return (false, "El nombre de la mascota es obligatorio.", null);

            var usuario = await _context.Usuarios.FirstOrDefaultAsync(u => u.IdUsuario == request.IdUsuario);
            if (usuario == null)
                return (false, "El usuario elegido no existe.", null);

            var mascota = new Mascota
            {
                IdUsuario = request.IdUsuario,
                Nombre = request.Nombre.Trim(),
                IdEspecie = request.IdEspecie,
                Raza = string.IsNullOrWhiteSpace(request.Raza) ? null : request.Raza.Trim(),
                FechaNacimiento = request.FechaNacimiento,
                Activo = request.Activo
            };

            _context.Mascotas.Add(mascota);
            await _context.SaveChangesAsync();

            return (true, "Mascota registrada correctamente.", new MascotaAdminDTO
            {
                IdMascota = mascota.IdMascota,
                Nombre = mascota.Nombre,
                Especie = mascota.IdEspecie == 1 ? "Perro" : mascota.IdEspecie == 2 ? "Gato" : "Otra",
                Raza = mascota.Raza,
                FechaNacimiento = mascota.FechaNacimiento,
                Activo = mascota.Activo,
                IdUsuario = mascota.IdUsuario,
                NombreDueno = $"{usuario.Nombre} {usuario.Apellidos}",
                CorreoDueno = usuario.Correo
            });
        }

        // El admin da de baja la mascota de cualquier cliente — a diferencia de
        // UsuarioService.EliminarMascotaAsync (que exige que la mascota sea del usuario del
        // JWT), acá no se acota por dueño: el admin puede desactivar la de cualquiera. Mismo
        // borrado lógico de siempre (Activo = false), nunca se borra la fila físicamente
        // (rompería en cascada citas/expedientes ya existentes de esa mascota).
        public async Task<(bool Exito, string Mensaje)> EliminarMascotaAsync(int idMascota)
        {
            var mascota = await _context.Mascotas.FirstOrDefaultAsync(m => m.IdMascota == idMascota);
            if (mascota == null)
                return (false, "La mascota no existe.");

            if (!mascota.Activo)
                return (false, "Esa mascota ya estaba inactiva.");

            mascota.Activo = false;
            await _context.SaveChangesAsync();

            return (true, "Mascota eliminada correctamente.");
        }

        // Todas las citas de la plataforma, con el mismo shape de join que ya arma
        // CitaService.ObtenerPorVeterinarioAsync pero sin acotar a un solo veterinario, y
        // agregando el nombre del veterinario y de la veterinaria (el admin ve toda la
        // plataforma, no un solo profesional que ya se conoce a sí mismo).
        public async Task<List<CitaAdminDTO>> ListarCitasAsync(short? idEstadoCita, int? idComercio, DateTime? desde, DateTime? hasta)
        {
            var query = from c in _context.Citas
                        join m in _context.Mascotas on c.IdMascota equals m.IdMascota
                        join dueno in _context.Usuarios on c.IdUsuario equals dueno.IdUsuario
                        join v in _context.Veterinarios on c.IdVeterinario equals v.IdVeterinario
                        join vu in _context.Usuarios on v.IdUsuario equals vu.IdUsuario
                        join s in _context.Servicios on c.IdServicio equals s.IdServicio
                        join co in _context.Comercios on s.IdComercio equals co.IdComercio
                        join e in _context.EstadosCitaCat on c.IdEstadoCita equals e.IdEstadoCita
                        select new CitaAdminDTO
                        {
                            IdCita = c.IdCita,
                            Fecha = c.Fecha,
                            HoraInicio = c.HoraInicio,
                            HoraFin = c.HoraFin,
                            IdEstadoCita = c.IdEstadoCita,
                            EstadoCita = e.Nombre,
                            IdMascota = c.IdMascota,
                            NombreMascota = m.Nombre,
                            NombreDueno = dueno.Nombre + " " + dueno.Apellidos,
                            IdVeterinario = c.IdVeterinario,
                            NombreVeterinario = vu.Nombre + " " + vu.Apellidos,
                            IdServicio = c.IdServicio,
                            NombreServicio = s.Nombre,
                            IdComercio = s.IdComercio,
                            NombreComercio = co.NombreComercial,
                            Notas = c.Notas
                        };

            if (idEstadoCita.HasValue)
                query = query.Where(x => x.IdEstadoCita == idEstadoCita.Value);

            if (idComercio.HasValue)
                query = query.Where(x => x.IdComercio == idComercio.Value);

            if (desde.HasValue)
                query = query.Where(x => x.Fecha >= desde.Value.Date);

            if (hasta.HasValue)
                query = query.Where(x => x.Fecha <= hasta.Value.Date);

            return await query.OrderByDescending(x => x.Fecha).ThenByDescending(x => x.HoraInicio).ToListAsync();
        }

        // Conteo de citas por estado, para el gráfico de barras del Dashboard — complementa los
        // totales generales que ya da ReporteService.ObtenerResumenAsync (citas totales/
        // completadas) con el desglose completo de los 4 estados.
        public async Task<object> ObtenerEstadisticasCitasAsync()
        {
            var pendientes = await _context.Citas.CountAsync(c => c.IdEstadoCita == 1);
            var confirmadas = await _context.Citas.CountAsync(c => c.IdEstadoCita == 2);
            var canceladas = await _context.Citas.CountAsync(c => c.IdEstadoCita == 3);
            var completadas = await _context.Citas.CountAsync(c => c.IdEstadoCita == 4);

            return new { pendientes, confirmadas, canceladas, completadas };
        }
    }
}
