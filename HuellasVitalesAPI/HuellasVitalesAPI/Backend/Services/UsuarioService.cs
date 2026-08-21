using BCrypt.Net;
using Google.Apis.Auth;
using HuellasVitalesAPI.Backend.Models.Entidades;
using HuellitasVitalesAPI.Data;
using HuellasVitalesAPI.Backend.Models.DTOs;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Text.Json.Serialization;
using System.Security.Cryptography;

namespace HuellitasVitalesAPI.Services
{
    public class UsuarioService
    {
        private readonly ConexionDB _context;
        private readonly IConfiguration _config;

        public UsuarioService(ConexionDB context, IConfiguration config)
        {
            _context = context;
            _config = config;
        }

        // Lista blanca de íconos predefinidos que el cliente puede elegir como avatar de
        // perfil (ver AvatarIconos.jsx en el frontend, que renderiza estas mismas claves con
        // lucide-react). Nunca se acepta un valor libre desde el cliente.
        public static readonly string[] IconosPerfilValidos =
        {
            "dog", "cat", "pawprint", "bird", "rabbit", "fish", "turtle", "bone", "heart", "user"
        };

        // Actualizar los datos del perfil de usuario
        public async Task<(bool Exito, string Mensaje)> ActualizarPerfilAsync(int idUsuario, ActualizarPerfilDTO dto)
        {
            var usuario = await _context.Usuarios.FirstOrDefaultAsync(u => u.IdUsuario == idUsuario);

            if (usuario == null) 
                return (false, "El usuario no existe.");

            // Validar si el nuevo correo ya pertenece a OTRO usuario registrado
            if (usuario.Correo != dto.Correo)
            {
                var existeCorreo = await _context.Usuarios.AnyAsync(u => u.Correo == dto.Correo && u.IdUsuario != idUsuario);
                if (existeCorreo)
                {
                    return (false, "El correo electrónico ya se encuentra registrado por otro usuario.");
                }
            }

            // Actualizar los campos solicitados
            usuario.Nombre = dto.Nombre;
            usuario.Apellidos = dto.Apellidos;
            usuario.Correo = dto.Correo;
            usuario.Telefono = dto.Telefono;

            await _context.SaveChangesAsync();

            return (true, "Perfil actualizado con éxito.");
        }

        // ─── TAREA 3: Obtener el perfil público de un usuario ───
        public async Task<PerfilUsuarioDTO?> ObtenerPerfilAsync(int idUsuario)
        {
            var u = await _context.Usuarios.FirstOrDefaultAsync(x => x.IdUsuario == idUsuario);
            if (u == null) return null;

            return new PerfilUsuarioDTO
            {
                IdUsuario = u.IdUsuario,
                Nombre = u.Nombre,
                Apellidos = u.Apellidos,
                Correo = u.Correo,
                Telefono = u.Telefono,
                IdRol = u.IdRol,
                IdEstadoCuenta = u.IdEstadoCuenta,
                Proveedor = u.Proveedor_Auth,
                FechaRegistro = u.FechaRegistro,
                AvatarIcono = u.AvatarIcono,
                TieneContrasena = !string.IsNullOrEmpty(u.PasswordHash)
            };
        }

        // Actualiza el ícono de avatar del usuario, validado contra IconosPerfilValidos.
        public async Task<(bool Exito, string Mensaje)> ActualizarAvatarAsync(int idUsuario, string icono)
        {
            if (string.IsNullOrWhiteSpace(icono) || !IconosPerfilValidos.Contains(icono))
                return (false, "El ícono seleccionado no es válido.");

            var usuario = await _context.Usuarios.FirstOrDefaultAsync(u => u.IdUsuario == idUsuario);
            if (usuario == null)
                return (false, "El usuario no existe.");

            usuario.AvatarIcono = icono;
            await _context.SaveChangesAsync();

            return (true, "Ícono de perfil actualizado correctamente.");
        }

        // Cambia la contraseña del usuario autenticado. Si la cuenta todavía no tiene una
        // contraseña local (se registró solo con Google/Facebook), permite establecer la
        // primera sin pedir "contraseña actual" — no hay ninguna que verificar.
        public async Task<(bool Exito, string Mensaje)> CambiarPasswordAsync(int idUsuario, CambiarPasswordDTO dto)
        {
            var usuario = await _context.Usuarios.FirstOrDefaultAsync(u => u.IdUsuario == idUsuario);
            if (usuario == null)
                return (false, "El usuario no existe.");

            if (string.IsNullOrWhiteSpace(dto.PasswordNueva) || dto.PasswordNueva.Length < 8)
                return (false, "La nueva contraseña debe tener al menos 8 caracteres.");

            var teniaContrasena = !string.IsNullOrEmpty(usuario.PasswordHash);

            if (teniaContrasena)
            {
                if (string.IsNullOrWhiteSpace(dto.PasswordActual))
                    return (false, "Debes ingresar tu contraseña actual.");

                if (!BCrypt.Net.BCrypt.Verify(dto.PasswordActual, usuario.PasswordHash))
                    return (false, "La contraseña actual no es correcta.");
            }

            usuario.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.PasswordNueva);
            await _context.SaveChangesAsync();

            return (true, teniaContrasena
                ? "Tu contraseña fue actualizada correctamente."
                : "Se estableció una contraseña para tu cuenta. Ya podés iniciar sesión con tu correo y esta contraseña.");
        }

        // ─── Panel de Administración: gestión de cualquier usuario de la plataforma ───
        private const byte ROL_ADMINISTRADOR = 1;
        private const byte ROL_VETERINARIO = 2;
        private const byte ROL_CLIENTE = 3;
        private const byte ROL_FUNCIONARIO = 4;

        private static UsuarioAdminDTO MapearUsuarioAdmin(Usuario u, string nombreRol) => new()
        {
            IdUsuario = u.IdUsuario,
            Nombre = u.Nombre,
            Apellidos = u.Apellidos,
            Correo = u.Correo,
            Telefono = u.Telefono,
            IdRol = u.IdRol,
            NombreRol = nombreRol,
            IdEstadoCuenta = u.IdEstadoCuenta,
            AvatarIcono = u.AvatarIcono,
            FechaRegistro = u.FechaRegistro
        };

        // Lista todos los usuarios de la plataforma, con filtros opcionales por rol, estado de
        // cuenta y una búsqueda libre por nombre/apellidos/correo. Usado por el panel de
        // Administración (Usuarios y Roles y permisos).
        public async Task<List<UsuarioAdminDTO>> ListarUsuariosAsync(byte? idRol, byte? idEstadoCuenta, string? busqueda)
        {
            var query = from u in _context.Usuarios
                        join r in _context.Roles on (int)u.IdRol equals r.IdRol into rGroup
                        from r in rGroup.DefaultIfEmpty()
                        select new { Usuario = u, NombreRol = r != null ? r.Nombre : "Sin rol" };

            if (idRol.HasValue)
                query = query.Where(x => x.Usuario.IdRol == idRol.Value);

            if (idEstadoCuenta.HasValue)
                query = query.Where(x => x.Usuario.IdEstadoCuenta == idEstadoCuenta.Value);

            if (!string.IsNullOrWhiteSpace(busqueda))
            {
                var termino = busqueda.Trim().ToLower();
                query = query.Where(x =>
                    x.Usuario.Nombre.ToLower().Contains(termino) ||
                    x.Usuario.Apellidos.ToLower().Contains(termino) ||
                    x.Usuario.Correo.ToLower().Contains(termino));
            }

            var resultados = await query.OrderByDescending(x => x.Usuario.FechaRegistro).ToListAsync();
            return resultados.Select(x => MapearUsuarioAdmin(x.Usuario, x.NombreRol)).ToList();
        }

        // El admin crea una cuenta nueva directamente, con el rol que elija — a diferencia del
        // auto-registro (RegistrarNuevoUsuario), que siempre entra como Cliente(3).
        public async Task<(bool Exito, string Mensaje)> CrearUsuarioComoAdminAsync(CrearUsuarioAdminDTO dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Nombre) || string.IsNullOrWhiteSpace(dto.Apellidos))
                return (false, "El nombre y los apellidos son obligatorios.");

            if (string.IsNullOrWhiteSpace(dto.Correo))
                return (false, "El correo es obligatorio.");

            if (string.IsNullOrWhiteSpace(dto.Password) || dto.Password.Length < 8)
                return (false, "La contraseña debe tener al menos 8 caracteres.");

            if (dto.IdRol < ROL_ADMINISTRADOR || dto.IdRol > ROL_FUNCIONARIO)
                return (false, "El rol indicado no es válido.");

            var existeCorreo = await _context.Usuarios.AnyAsync(u => u.Correo == dto.Correo);
            if (existeCorreo)
                return (false, "Este correo ya se encuentra registrado.");

            var nuevoUsuario = new Usuario
            {
                Nombre = dto.Nombre,
                Apellidos = dto.Apellidos,
                Correo = dto.Correo,
                Telefono = dto.Telefono,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
                Proveedor_Auth = "Local",
                IdRol = dto.IdRol,
                IdEstadoCuenta = 1,
                FechaRegistro = DateTime.UtcNow
            };

            _context.Usuarios.Add(nuevoUsuario);
            await _context.SaveChangesAsync();

            return (true, "Usuario creado correctamente.");
        }

        public async Task<UsuarioAdminDTO?> ObtenerUsuarioAdminAsync(int idUsuario)
        {
            var usuario = await _context.Usuarios.FirstOrDefaultAsync(u => u.IdUsuario == idUsuario);
            if (usuario == null) return null;

            var rol = await _context.Roles.FirstOrDefaultAsync(r => r.IdRol == usuario.IdRol);
            return MapearUsuarioAdmin(usuario, rol?.Nombre ?? "Sin rol");
        }

        // Estadísticas reales para las tarjetas del panel de Usuarios — no existía ninguna
        // agregación de usuarios en el proyecto (ReporteService solo agrega actividad clínica).
        // Incluye además el desglose por rol y por estado de cuenta, para los gráficos de
        // dona del Dashboard.
        public async Task<object> ObtenerEstadisticasUsuariosAsync()
        {
            var total = await _context.Usuarios.CountAsync();
            var activos = await _context.Usuarios.CountAsync(u => u.IdEstadoCuenta == 1);
            var invitados = await _context.Usuarios.CountAsync(u => u.IdEstadoCuenta == 2);
            var suspendidos = await _context.Usuarios.CountAsync(u => u.IdEstadoCuenta == 3);
            var clientes = await _context.Usuarios.CountAsync(u => u.IdRol == ROL_CLIENTE);
            var veterinarios = await _context.Usuarios.CountAsync(u => u.IdRol == ROL_VETERINARIO);
            var funcionarios = await _context.Usuarios.CountAsync(u => u.IdRol == ROL_FUNCIONARIO);
            var administradores = await _context.Usuarios.CountAsync(u => u.IdRol == ROL_ADMINISTRADOR);
            var profesionales = veterinarios + funcionarios;

            return new
            {
                total,
                activos,
                profesionales,
                administradores,
                porRol = new { administradores, veterinarios, clientes, funcionarios },
                porEstado = new { activas = activos, invitadas = invitados, suspendidas = suspendidos }
            };
        }

        private static readonly string[] MESES_ES =
        {
            "ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"
        };

        // Registros de usuarios agrupados por período, para el gráfico principal del Dashboard.
        // Se agrupa en memoria (no con SQL) a propósito: evita depender de datos de cultura
        // (nombres de mes) que pueden faltar en el contenedor de despliegue si corre en modo
        // "invariant globalization".
        public async Task<List<PuntoSerieDTO>> ObtenerRegistrosPorPeriodoAsync(string? periodo)
        {
            var fechas = await _context.Usuarios.Select(u => u.FechaRegistro).ToListAsync();
            var hoy = DateTime.UtcNow.Date;
            var puntos = new List<PuntoSerieDTO>();

            switch ((periodo ?? "mensual").ToLowerInvariant())
            {
                case "anual":
                    for (var i = 5; i >= 0; i--)
                    {
                        var anio = hoy.Year - i;
                        var cantidad = fechas.Count(f => f.Year == anio);
                        puntos.Add(new PuntoSerieDTO { Etiqueta = anio.ToString(), Cantidad = cantidad });
                    }
                    break;

                case "semanal":
                    for (var i = 7; i >= 0; i--)
                    {
                        var finVentana = hoy.AddDays(-7 * i);
                        var inicioVentana = finVentana.AddDays(-6);
                        var cantidad = fechas.Count(f => f.Date >= inicioVentana && f.Date <= finVentana);
                        puntos.Add(new PuntoSerieDTO { Etiqueta = $"{inicioVentana:dd/MM}", Cantidad = cantidad });
                    }
                    break;

                default: // mensual
                    for (var i = 11; i >= 0; i--)
                    {
                        var mes = hoy.AddMonths(-i);
                        var cantidad = fechas.Count(f => f.Year == mes.Year && f.Month == mes.Month);
                        puntos.Add(new PuntoSerieDTO { Etiqueta = $"{MESES_ES[mes.Month - 1]} {mes.Year}", Cantidad = cantidad });
                    }
                    break;
            }

            return puntos;
        }

        // El admin edita los datos de CUALQUIER usuario (a diferencia de ActualizarPerfilAsync,
        // que solo deja al usuario editar su propia cuenta vía el claim del JWT).
        public async Task<(bool Exito, string Mensaje)> ActualizarPerfilComoAdminAsync(int idUsuario, ActualizarPerfilDTO dto)
        {
            var usuario = await _context.Usuarios.FirstOrDefaultAsync(u => u.IdUsuario == idUsuario);
            if (usuario == null)
                return (false, "El usuario no existe.");

            if (usuario.Correo != dto.Correo)
            {
                var existeCorreo = await _context.Usuarios.AnyAsync(u => u.Correo == dto.Correo && u.IdUsuario != idUsuario);
                if (existeCorreo)
                    return (false, "El correo electrónico ya se encuentra registrado por otro usuario.");
            }

            usuario.Nombre = dto.Nombre;
            usuario.Apellidos = dto.Apellidos;
            usuario.Correo = dto.Correo;
            usuario.Telefono = dto.Telefono;

            await _context.SaveChangesAsync();
            return (true, "Usuario actualizado con éxito.");
        }

        // Reasigna el rol de un usuario. A diferencia de las promociones automáticas
        // (VeterinarioService.VincularAsync / ComercioService.AprobarComercioAsync, que solo
        // suben a un Cliente puro), esta es una reasignación explícita del admin a cualquier
        // rol — pero nunca se permite dejar la plataforma sin ningún administrador activo.
        public async Task<(bool Exito, string Mensaje)> CambiarRolAsync(int idUsuario, byte idRol)
        {
            if (idRol < ROL_ADMINISTRADOR || idRol > ROL_FUNCIONARIO)
                return (false, "El rol indicado no es válido.");

            var usuario = await _context.Usuarios.FirstOrDefaultAsync(u => u.IdUsuario == idUsuario);
            if (usuario == null)
                return (false, "El usuario no existe.");

            if (usuario.IdRol == ROL_ADMINISTRADOR && idRol != ROL_ADMINISTRADOR)
            {
                var otrosAdmins = await _context.Usuarios.CountAsync(u =>
                    u.IdRol == ROL_ADMINISTRADOR && u.IdEstadoCuenta == 1 && u.IdUsuario != idUsuario);

                if (otrosAdmins == 0)
                    return (false, "No podés quitarle el rol de Administrador al único administrador activo de la plataforma.");
            }

            usuario.IdRol = idRol;
            await _context.SaveChangesAsync();

            return (true, "Rol actualizado correctamente.");
        }

        // Activar/suspender una cuenta — es el "Eliminar" del panel de Usuarios: nunca se borra
        // físicamente un USUARIO (rompería en cascada mascotas, citas, expedientes, etc.).
        public async Task<(bool Exito, string Mensaje)> CambiarEstadoCuentaAsync(int idUsuario, byte idEstadoCuenta)
        {
            if (idEstadoCuenta < 1 || idEstadoCuenta > 3)
                return (false, "El estado indicado no es válido.");

            var usuario = await _context.Usuarios.FirstOrDefaultAsync(u => u.IdUsuario == idUsuario);
            if (usuario == null)
                return (false, "El usuario no existe.");

            if (usuario.IdRol == ROL_ADMINISTRADOR && idEstadoCuenta != 1)
            {
                var otrosAdminsActivos = await _context.Usuarios.CountAsync(u =>
                    u.IdRol == ROL_ADMINISTRADOR && u.IdEstadoCuenta == 1 && u.IdUsuario != idUsuario);

                if (otrosAdminsActivos == 0)
                    return (false, "No podés desactivar al único administrador activo de la plataforma.");
            }

            usuario.IdEstadoCuenta = idEstadoCuenta;

            using var transaccion = await _context.Database.BeginTransactionAsync();

            // Suspender la cuenta es el "Eliminar" del panel de Usuarios (ver comentario de
            // arriba: nunca se borra físicamente un USUARIO). Para que de verdad se sienta como
            // un borrado, sus mascotas también se dan de baja acá — no se borran físicamente
            // por la misma razón (romperían en cascada citas/expedientes ya existentes), pero
            // dejan de aparecer como activas en cualquier lado (Marketplace, agenda, etc.).
            // Reactivar la cuenta NO reactiva las mascotas automáticamente: no hay forma de
            // saber cuáles ya estaban inactivas antes de la suspensión.
            if (idEstadoCuenta == 3)
            {
                await _context.Mascotas
                    .Where(m => m.IdUsuario == idUsuario && m.Activo)
                    .ExecuteUpdateAsync(s => s.SetProperty(m => m.Activo, false));
            }

            await _context.SaveChangesAsync();
            await transaccion.CommitAsync();

            return (true, "Estado de la cuenta actualizado correctamente.");
        }

        public (bool Exito, string Mensaje) RegistrarNuevoUsuario(RegistroRequest request)
        {
            string contraseñaHasheada = BCrypt.Net.BCrypt.HashPassword(request.Password);
            var existeUsuario = _context.Usuarios.Any(u => u.Correo == request.Correo);
            if (existeUsuario)
            {
                return (false, "Este correo ya se encuentra registrado.");
            }

            var nuevoUsuario = new Usuario
            {
                Nombre = request.Nombre,
                Apellidos = request.Apellidos,
                Correo = request.Correo,
                Telefono = request.Telefono,
                PasswordHash = contraseñaHasheada,
                Proveedor_Auth = "Local",
                IdRol = 3, // Rol Cliente
                IdEstadoCuenta = 1, // 1 = ACTIVA (Reemplaza a Activo = true)
                FechaRegistro = DateTime.UtcNow
            };

            _context.Usuarios.Add(nuevoUsuario);
            _context.SaveChanges();

            return (true, "¡Usuario registrado con éxito en Huellitas Vitales!");
        }

        public async Task<Usuario?> AutenticarGoogleAsync(string googleToken)
        {
            try
            {
                var settings = new GoogleJsonWebSignature.ValidationSettings()
                {
                    Audience = new List<string> { "345969836543-cmegbuqmfc6dv7l0abo6cjj4u2fpdlqi.apps.googleusercontent.com" }
                };

                var payload = await GoogleJsonWebSignature.ValidateAsync(googleToken, settings);

                if (payload == null) return null;

                var usuario = await _context.Usuarios.FirstOrDefaultAsync(u => u.Correo == payload.Email);

                if (usuario == null)
                {
                    usuario = new Usuario
                    {
                        Nombre = payload.GivenName ?? "Usuario",
                        Apellidos = payload.FamilyName ?? "Google",
                        Correo = payload.Email,
                        Proveedor_Auth = "Google",
                        Proveedor_Id = payload.Subject,
                        IdRol = 3,
                        IdEstadoCuenta = 1, // ACTIVA
                        FechaRegistro = DateTime.UtcNow
                    };

                    _context.Usuarios.Add(usuario);
                    await _context.SaveChangesAsync();
                }
                else
                {
                    // La cuenta ya existe.
                    // NO vinculamos Google automáticamente.

                    if (usuario.Proveedor_Auth == "Google")
                    {
                        // Google ya está vinculado a esta cuenta.
                        // Verificamos que sea el mismo Google.
                        if (usuario.Proveedor_Id != payload.Subject)
                        {
                            return null;
                        }
                    }
                    else
                    {
                        // La cuenta existe, pero es Local u otro proveedor.
                        // La vinculación debe hacerse mediante el endpoint
                        // /api/Login/vincular-google.
                        return null;
                    }
                }
                return usuario;
            }
            catch (Exception ex)
            {
                Console.WriteLine("--- ERROR CRÍTICO EN AUTENTICAR GOOGLE ---");
                Console.WriteLine("Mensaje: " + ex.Message);
                Console.WriteLine("Stack Trace: " + ex.StackTrace);
                throw; 
            }
        }

        // ─── MÉTODO PARA AUTENTICACIÓN LOCAL (CORREO Y CONTRASEÑA) ───
        public async Task<Usuario?> AutenticarLocalAsync(LoginRequest request)
        {
            var usuario = await _context.Usuarios.FirstOrDefaultAsync(u => u.Correo == request.Correo);

            if (usuario == null) return null;

            if (usuario.IdEstadoCuenta != 1)
            {
                throw new Exception("Esta cuenta no se encuentra activa.");
            }

            if (usuario.Proveedor_Auth == "Google" && string.IsNullOrEmpty(usuario.PasswordHash))
            {
                throw new Exception("Este correo está vinculado a una cuenta de Google. Inicia sesión con el botón de Google.");
            }

            bool passwordValida = BCrypt.Net.BCrypt.Verify(request.Password, usuario.PasswordHash);

            if (!passwordValida) return null;

            return usuario;
        }

        // ─── MÉTODO PARA GENERAR EL TOKEN JWT ───
        public string GenerarTokenJWT(Usuario usuario)
        {
            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]!));
            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, usuario.IdUsuario.ToString()),
                new Claim(JwtRegisteredClaimNames.Email, usuario.Correo),
                new Claim("rol", usuario.IdRol.ToString())
            };

            var token = new JwtSecurityToken(
                claims: claims,
                expires: DateTime.UtcNow.AddHours(2),
                signingCredentials: credentials);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        public async Task<List<MascotaDTO>> ObtenerMascotasPorUsuarioAsync(int idUsuario)
        {
            return await _context.Mascotas
                .Where(m => m.IdUsuario == idUsuario && m.Activo)
                .OrderBy(m => m.Nombre)
                .Select(m => new MascotaDTO
                {
                    IdMascota = m.IdMascota,
                    IdUsuario = m.IdUsuario,
                    Nombre = m.Nombre,
                    IdEspecie = m.IdEspecie,
                    Especie = m.IdEspecie == 1 ? "Perro" : m.IdEspecie == 2 ? "Gato" : "Otra",
                    Raza = m.Raza,
                    FechaNacimiento = m.FechaNacimiento,
                    Activo = m.Activo
                })
                .ToListAsync();
        }

        public async Task<MascotaDTO?> ObtenerMascotaPorIdAsync(int idUsuario, int idMascota)
        {
            var mascota = await _context.Mascotas
                .FirstOrDefaultAsync(m => m.IdMascota == idMascota && m.IdUsuario == idUsuario);

            if (mascota == null) return null;

            return new MascotaDTO
            {
                IdMascota = mascota.IdMascota,
                IdUsuario = mascota.IdUsuario,
                Nombre = mascota.Nombre,
                IdEspecie = mascota.IdEspecie,
                Especie = mascota.IdEspecie == 1 ? "Perro" : mascota.IdEspecie == 2 ? "Gato" : "Otra",
                Raza = mascota.Raza,
                FechaNacimiento = mascota.FechaNacimiento,
                Activo = mascota.Activo
            };
        }

        public async Task<(bool Exito, string Mensaje, MascotaDTO? Mascota)> CrearMascotaAsync(int idUsuario, CrearMascotaRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Nombre))
                return (false, "El nombre de la mascota es obligatorio.", null);

            var mascota = new Mascota
            {
                IdUsuario = idUsuario,
                Nombre = request.Nombre.Trim(),
                IdEspecie = request.IdEspecie,
                Raza = string.IsNullOrWhiteSpace(request.Raza) ? null : request.Raza.Trim(),
                FechaNacimiento = request.FechaNacimiento,
                Activo = request.Activo
            };

            _context.Mascotas.Add(mascota);
            await _context.SaveChangesAsync();

            return (true, "Mascota creada correctamente.", new MascotaDTO
            {
                IdMascota = mascota.IdMascota,
                IdUsuario = mascota.IdUsuario,
                Nombre = mascota.Nombre,
                IdEspecie = mascota.IdEspecie,
                Especie = mascota.IdEspecie == 1 ? "Perro" : mascota.IdEspecie == 2 ? "Gato" : "Otra",
                Raza = mascota.Raza,
                FechaNacimiento = mascota.FechaNacimiento,
                Activo = mascota.Activo
            });
        }

        public async Task<(bool Exito, string Mensaje, MascotaDTO? Mascota)> ActualizarMascotaAsync(int idUsuario, int idMascota, ActualizarMascotaRequest request)
        {
            var mascota = await _context.Mascotas.FirstOrDefaultAsync(m => m.IdMascota == idMascota && m.IdUsuario == idUsuario);
            if (mascota == null)
                return (false, "La mascota no existe o no pertenece a este usuario.", null);

            if (string.IsNullOrWhiteSpace(request.Nombre))
                return (false, "El nombre de la mascota es obligatorio.", null);

            mascota.Nombre = request.Nombre.Trim();
            mascota.IdEspecie = request.IdEspecie;
            mascota.Raza = string.IsNullOrWhiteSpace(request.Raza) ? null : request.Raza.Trim();
            mascota.FechaNacimiento = request.FechaNacimiento;
            mascota.Activo = request.Activo;

            await _context.SaveChangesAsync();

            return (true, "Mascota actualizada correctamente.", new MascotaDTO
            {
                IdMascota = mascota.IdMascota,
                IdUsuario = mascota.IdUsuario,
                Nombre = mascota.Nombre,
                IdEspecie = mascota.IdEspecie,
                Especie = mascota.IdEspecie == 1 ? "Perro" : mascota.IdEspecie == 2 ? "Gato" : "Otra",
                Raza = mascota.Raza,
                FechaNacimiento = mascota.FechaNacimiento,
                Activo = mascota.Activo
            });
        }

        public async Task<(bool Exito, string Mensaje)> EliminarMascotaAsync(int idUsuario, int idMascota)
        {
            var mascota = await _context.Mascotas.FirstOrDefaultAsync(m => m.IdMascota == idMascota && m.IdUsuario == idUsuario);
            if (mascota == null)
                return (false, "La mascota no existe o no pertenece a este usuario.");

            mascota.Activo = false;
            await _context.SaveChangesAsync();

            return (true, "Mascota eliminada correctamente.");
        }

        public async Task<Usuario?> AutenticarFacebookAsync(string fbToken)
        {
            try
            {
                using var httpClient = new HttpClient();
                var verifyTokenUrl = $"https://graph.facebook.com/me?fields=first_name,last_name,email,id&access_token={fbToken}";

                var response = await httpClient.GetAsync(verifyTokenUrl);
                if (!response.IsSuccessStatusCode) return null;

                var jsonResult = await response.Content.ReadAsStringAsync();
                var fbUser = System.Text.Json.JsonSerializer.Deserialize<FacebookTokenResponse>(jsonResult);

                if (fbUser == null || string.IsNullOrEmpty(fbUser.Email)) return null;

                var usuario = await _context.Usuarios.FirstOrDefaultAsync(u => u.Correo == fbUser.Email);

                if (usuario == null)
                {
                    usuario = new Usuario
                    {
                        Nombre = fbUser.FirstName ?? "Usuario",
                        Apellidos = fbUser.LastName ?? "Facebook",
                        Correo = fbUser.Email,
                        Proveedor_Auth = "Facebook",
                        Proveedor_Id = fbUser.Id,
                        IdRol = 3,
                        IdEstadoCuenta = 1, // ACTIVA
                        FechaRegistro = DateTime.UtcNow
                    };

                    _context.Usuarios.Add(usuario);
                    await _context.SaveChangesAsync();
                }
                else
                {
                    if (usuario.Proveedor_Auth != "Facebook")
                    {
                        usuario.Proveedor_Auth = "Facebook";
                        usuario.Proveedor_Id = fbUser.Id;

                        _context.Usuarios.Update(usuario);
                        await _context.SaveChangesAsync();
                    }
                }

                return usuario;
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"Error de Facebook: {ex.Message}");
                return null;
            }
        }

        // ─── NUEVO: REGISTRO RÁPIDO PARA CHECKOUT ───
        public async Task<string> RegistrarUsuarioRapidoAsync(RegistroRapidoDTO request)
        {
            // 1. Validar si el correo ya existe
            var usuarioExistente = await _context.Usuarios
                .FirstOrDefaultAsync(u => u.Correo.ToLower() == request.Correo.ToLower());

            if (usuarioExistente != null)
            {
                throw new Exception("El correo ya está registrado. Por favor, inicia sesión.");
            }

            // 2. Separar el "Nombre Completo" en Nombre y Apellidos (porque la BD pide ambos)
            var partesNombre = request.NombreCompleto.Trim().Split(' ', 2);
            string nombre = partesNombre[0];
            string apellidos = partesNombre.Length > 1 ? partesNombre[1] : "N/A"; // Por si solo pone un nombre

            // 3. Crear la entidad
            var nuevoUsuario = new Usuario
            {
                Nombre = nombre,
                Apellidos = apellidos,
                Correo = request.Correo,
                Telefono = request.Telefono,
                PasswordHash = null, // Fundamental: Queda null para el flujo de "Recuperar contraseña"
                Proveedor_Auth = "Local",
                IdEstadoCuenta = 1, // 1 = ACTIVA 
                IdRol = 3, // 👈 3 = Cliente (mismo ID que utilizas en RegistrarNuevoUsuario)
                FechaRegistro = DateTime.UtcNow
            };

            _context.Usuarios.Add(nuevoUsuario);
            await _context.SaveChangesAsync();

            // 4. Generar y retornar el token JWT
            var token = GenerarTokenJWT(nuevoUsuario); 
            
            return token;
        }

        public async Task<string?> GenerarTokenRecuperacionAsync(string correo)
        {
            var usuario = await _context.Usuarios
                .FirstOrDefaultAsync(u => u.Correo == correo);

            if (usuario == null)
                return null;

            // Generar token seguro
            var tokenBytes = RandomNumberGenerator.GetBytes(32);

            // Convertir a Base64 URL-safe
            var token = Convert.ToBase64String(tokenBytes)
                .Replace("+", "-")
                .Replace("/", "_")
                .Replace("=", "");

            // Guardamos solamente el hash del token
            using var sha256 = SHA256.Create();

            var hashBytes = sha256.ComputeHash(
                Encoding.UTF8.GetBytes(token)
            );

            var tokenHash = Convert.ToHexString(hashBytes);

            // Invalidar tokens anteriores del mismo usuario
            var tokensAnteriores = await _context.PasswordResetTokens
                .Where(x => x.IdUsuario == usuario.IdUsuario && !x.Usado)
                .ToListAsync();

            foreach (var tokenAnterior in tokensAnteriores)
            {
                tokenAnterior.Usado = true;
            }

            var nuevoToken = new PasswordResetToken
            {
                IdUsuario = usuario.IdUsuario,
                TokenHash = tokenHash,
                FechaExpiracion = DateTime.UtcNow.AddMinutes(30),
                Usado = false
            };

            _context.PasswordResetTokens.Add(nuevoToken);

            await _context.SaveChangesAsync();

            return token;
        }

        public async Task<(bool Exito, string Mensaje)> RestablecerPasswordAsync(
            RestablecerPasswordDTO dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Token))
            {
                return (false, "El token de recuperación es obligatorio.");
            }

            if (string.IsNullOrWhiteSpace(dto.NuevaPassword))
            {
                return (false, "La nueva contraseña es obligatoria.");
            }

            if (dto.NuevaPassword.Length < 8)
            {
                return (false, "La contraseña debe tener al menos 8 caracteres.");
            }

            // Calcular hash del token recibido
            using var sha256 = SHA256.Create();

            var hashBytes = sha256.ComputeHash(
                Encoding.UTF8.GetBytes(dto.Token)
            );

            var tokenHash = Convert.ToHexString(hashBytes);

            // Buscar token válido
            var resetToken = await _context.PasswordResetTokens
                .FirstOrDefaultAsync(x =>
                    x.TokenHash == tokenHash &&
                    !x.Usado &&
                    x.FechaExpiracion > DateTime.UtcNow
                );

            if (resetToken == null)
            {
                return (
                    false,
                    "El enlace de recuperación no es válido o ha expirado."
                );
            }

            // Buscar usuario
            var usuario = await _context.Usuarios
                .FirstOrDefaultAsync(u =>
                    u.IdUsuario == resetToken.IdUsuario
                );

            if (usuario == null)
            {
                return (false, "El usuario no existe.");
            }

            // Si enviamos correo en el DTO, verificarlo
            if (!string.IsNullOrWhiteSpace(dto.Correo) &&
                !string.Equals(
                    usuario.Correo,
                    dto.Correo,
                    StringComparison.OrdinalIgnoreCase))
            {
                return (false, "El correo no corresponde a la cuenta.");
            }

            // Generar nueva contraseña
            usuario.PasswordHash =
                BCrypt.Net.BCrypt.HashPassword(dto.NuevaPassword);

            // Marcar token como utilizado
            resetToken.Usado = true;

            await _context.SaveChangesAsync();

            return (
                true,
                "La contraseña fue actualizada correctamente."
            );
        }

        public async Task<(bool Exito, string Mensaje)> VincularGoogleAsync(
    int idUsuario,
    string googleToken)
{
    try
    {
        var usuario = await _context.Usuarios
            .FirstOrDefaultAsync(u => u.IdUsuario == idUsuario);

        if (usuario == null)
        {
            return (false, "El usuario no existe.");
        }

        if (usuario.IdEstadoCuenta != 1)
        {
            return (false, "La cuenta no se encuentra activa.");
        }

        var settings = new GoogleJsonWebSignature.ValidationSettings
        {
            Audience = new List<string>
            {
                "345969836543-cmegbuqmfc6dv7l0abo6cjj4u2fpdlqi.apps.googleusercontent.com"
            }
        };

        var payload = await GoogleJsonWebSignature.ValidateAsync(
            googleToken,
            settings
        );

        if (payload == null)
        {
            return (false, "El token de Google no es válido.");
        }

        // El correo de Google debe ser el mismo de la cuenta
        if (!string.Equals(
            usuario.Correo,
            payload.Email,
            StringComparison.OrdinalIgnoreCase))
        {
            return (
                false,
                "El correo de Google no coincide con el correo de la cuenta."
            );
        }

        // Verificar si ese Google ya está vinculado a OTRA cuenta
        var googleYaVinculado = await _context.Usuarios
            .FirstOrDefaultAsync(u =>
                u.Proveedor_Auth == "Google" &&
                u.Proveedor_Id == payload.Subject &&
                u.IdUsuario != idUsuario
            );

        if (googleYaVinculado != null)
        {
            return (
                false,
                "Esta cuenta de Google ya está vinculada a otro usuario."
            );
        }

        // Verificar si este usuario ya tiene Google vinculado
        var vinculacionExistente = await _context.UsuariosProveedoresAuth
            .FirstOrDefaultAsync(x =>
                x.IdUsuario == idUsuario &&
                x.Proveedor == "Google");

        if (vinculacionExistente != null)
        {
            return (
                true,
                "Tu cuenta de Google ya está vinculada."
            );
        }

        // Crear la vinculación
        var nuevaVinculacion = new UsuarioProveedorAuth
        {
            IdUsuario = idUsuario,
            Proveedor = "Google",
            ProveedorId = payload.Subject
        };

        _context.UsuariosProveedoresAuth.Add(nuevaVinculacion);

        await _context.SaveChangesAsync();

        return (
            true,
            "La cuenta de Google fue vinculada correctamente."
        );
    }
    catch (Exception ex)
    {
        Console.WriteLine("=== ERROR AL VINCULAR GOOGLE ===");
        Console.WriteLine(ex.ToString());

        return (
            false,
            "No fue posible vincular la cuenta de Google."
        );
    }
    }
            public async Task<(bool Exito, string Mensaje)> VincularFacebookAsync(
            int idUsuario,
            string facebookToken)
        {
            try
            {
                var usuario = await _context.Usuarios
                    .FirstOrDefaultAsync(u => u.IdUsuario == idUsuario);

                if (usuario == null)
                {
                    return (false, "El usuario no existe.");
                }

                if (usuario.IdEstadoCuenta != 1)
                {
                    return (false, "La cuenta no se encuentra activa.");
                }

                using var httpClient = new HttpClient();

                // Versión explícita del Graph API — sin ella, Facebook usa la versión
                // "default" configurada en el panel de la app, que puede quedar desactualizada
                // sin que nadie lo note. v21.0 es una versión estable reciente.
                var verifyTokenUrl =
                    $"https://graph.facebook.com/v21.0/me" +
                    $"?fields=first_name,last_name,email,id" +
                    $"&access_token={facebookToken}";

                var response = await httpClient.GetAsync(verifyTokenUrl);
                var jsonResult = await response.Content.ReadAsStringAsync();

                if (!response.IsSuccessStatusCode)
                {
                    // Log completo en el backend para poder diagnosticar (el mismo patrón de
                    // Console.WriteLine que ya usa el resto de este método para sus catch).
                    Console.WriteLine("=== FACEBOOK GRAPH API RECHAZÓ EL TOKEN ===");
                    Console.WriteLine($"Status: {response.StatusCode}");
                    Console.WriteLine(jsonResult);

                    // Facebook devuelve el motivo real en error.message (permisos, app en modo
                    // desarrollo sin el usuario agregado como tester, token expirado, etc.) —
                    // se lo mostramos al usuario en vez de un genérico "no es válido" que no
                    // ayuda a diagnosticar nada.
                    string? mensajeFacebook = null;
                    try
                    {
                        using var doc = System.Text.Json.JsonDocument.Parse(jsonResult);
                        if (doc.RootElement.TryGetProperty("error", out var errorEl) &&
                            errorEl.TryGetProperty("message", out var msgEl))
                        {
                            mensajeFacebook = msgEl.GetString();
                        }
                    }
                    catch (System.Text.Json.JsonException)
                    {
                        // jsonResult no era JSON válido; se ignora y se usa el mensaje genérico.
                    }

                    return (false, mensajeFacebook != null
                        ? $"Facebook rechazó la vinculación: {mensajeFacebook}"
                        : "El token de Facebook no es válido.");
                }

                var fbUser =
                    System.Text.Json.JsonSerializer.Deserialize<FacebookTokenResponse>(
                        jsonResult);

                if (fbUser == null || string.IsNullOrEmpty(fbUser.Id))
                {
                    return (
                        false,
                        "No fue posible obtener la información de Facebook."
                    );
                }

                // Verificar que el correo de Facebook corresponda
                // al correo de la cuenta que está intentando vincular.
                if (!string.IsNullOrEmpty(fbUser.Email) &&
                    !string.Equals(
                        usuario.Correo,
                        fbUser.Email,
                        StringComparison.OrdinalIgnoreCase))
                {
                    return (
                        false,
                        "El correo de Facebook no coincide con el correo de la cuenta."
                    );
                }

                // Verificar si Facebook ya está vinculado a OTRA cuenta.
                var facebookYaVinculado = await _context.UsuariosProveedoresAuth
                    .FirstOrDefaultAsync(x =>
                        x.Proveedor == "Facebook" &&
                        x.ProveedorId == fbUser.Id &&
                        x.IdUsuario != idUsuario);

                if (facebookYaVinculado != null)
                {
                    return (
                        false,
                        "Esta cuenta de Facebook ya está vinculada a otro usuario."
                    );
                }

                // Verificar si este usuario ya tiene Facebook vinculado.
                var vinculacionExistente = await _context.UsuariosProveedoresAuth
                    .FirstOrDefaultAsync(x =>
                        x.IdUsuario == idUsuario &&
                        x.Proveedor == "Facebook");

                if (vinculacionExistente != null)
                {
                    return (
                        true,
                        "Tu cuenta de Facebook ya está vinculada."
                    );
                }

                // Crear la vinculación.
                var nuevaVinculacion = new UsuarioProveedorAuth
                {
                    IdUsuario = idUsuario,
                    Proveedor = "Facebook",
                    ProveedorId = fbUser.Id
                };

                _context.UsuariosProveedoresAuth.Add(nuevaVinculacion);

                await _context.SaveChangesAsync();

                return (
                    true,
                    "La cuenta de Facebook fue vinculada correctamente."
                );
            }
            catch (Exception ex)
            {
                Console.WriteLine("=== ERROR AL VINCULAR FACEBOOK ===");
                Console.WriteLine(ex.ToString());

                return (
                    false,
                    "No fue posible vincular la cuenta de Facebook."
                );
            }  
        }
        public async Task<List<string>> ObtenerProveedoresVinculadosAsync(int idUsuario)
        {
            return await _context.UsuariosProveedoresAuth
                .Where(x => x.IdUsuario == idUsuario)
                .Select(x => x.Proveedor)
                .ToListAsync();
        }

        // Vincula Google a partir de un access token del flujo implícito (useGoogleLogin), en
        // vez del credential/ID token que usa VincularGoogleAsync. Se apoya en el endpoint
        // userinfo de Google en vez de validar un JWT — mismo patrón que ya usa
        // VincularFacebookAsync contra el Graph API de Facebook, para que el switch de
        // Configuración pueda vincular Google sin depender del botón/iframe de <GoogleLogin>.
        public async Task<(bool Exito, string Mensaje)> VincularGoogleConAccessTokenAsync(int idUsuario, string accessToken)
        {
            try
            {
                var usuario = await _context.Usuarios.FirstOrDefaultAsync(u => u.IdUsuario == idUsuario);
                if (usuario == null)
                    return (false, "El usuario no existe.");

                if (usuario.IdEstadoCuenta != 1)
                    return (false, "La cuenta no se encuentra activa.");

                using var httpClient = new HttpClient();
                var response = await httpClient.GetAsync(
                    $"https://www.googleapis.com/oauth2/v3/userinfo?access_token={accessToken}");
                var jsonResult = await response.Content.ReadAsStringAsync();

                if (!response.IsSuccessStatusCode)
                {
                    Console.WriteLine("=== GOOGLE USERINFO RECHAZÓ EL TOKEN ===");
                    Console.WriteLine($"Status: {response.StatusCode}");
                    Console.WriteLine(jsonResult);
                    return (false, "El token de Google no es válido o expiró.");
                }

                var googleUser = System.Text.Json.JsonSerializer.Deserialize<GoogleUserInfoResponse>(jsonResult);
                if (googleUser == null || string.IsNullOrEmpty(googleUser.Sub))
                    return (false, "No fue posible obtener la información de Google.");

                if (!string.IsNullOrEmpty(googleUser.Email) &&
                    !string.Equals(usuario.Correo, googleUser.Email, StringComparison.OrdinalIgnoreCase))
                {
                    return (false, "El correo de Google no coincide con el correo de la cuenta.");
                }

                var googleYaVinculado = await _context.UsuariosProveedoresAuth
                    .FirstOrDefaultAsync(x =>
                        x.Proveedor == "Google" &&
                        x.ProveedorId == googleUser.Sub &&
                        x.IdUsuario != idUsuario);

                if (googleYaVinculado != null)
                    return (false, "Esta cuenta de Google ya está vinculada a otro usuario.");

                var vinculacionExistente = await _context.UsuariosProveedoresAuth
                    .FirstOrDefaultAsync(x => x.IdUsuario == idUsuario && x.Proveedor == "Google");

                if (vinculacionExistente != null)
                    return (true, "Tu cuenta de Google ya está vinculada.");

                _context.UsuariosProveedoresAuth.Add(new UsuarioProveedorAuth
                {
                    IdUsuario = idUsuario,
                    Proveedor = "Google",
                    ProveedorId = googleUser.Sub
                });

                await _context.SaveChangesAsync();

                return (true, "La cuenta de Google fue vinculada correctamente.");
            }
            catch (Exception ex)
            {
                Console.WriteLine("=== ERROR AL VINCULAR GOOGLE (access token) ===");
                Console.WriteLine(ex.ToString());
                return (false, "No fue posible vincular la cuenta de Google.");
            }
        }

        // Desvincula Google o Facebook de la cuenta autenticada. Nunca deja al usuario sin
        // ninguna forma de volver a entrar: si no tiene contraseña local, exige que quede al
        // menos otro proveedor vinculado.
        public async Task<(bool Exito, string Mensaje)> DesvincularProveedorAsync(int idUsuario, string proveedor)
        {
            var proveedorNormalizado = proveedor?.Trim();
            var esGoogle = string.Equals(proveedorNormalizado, "Google", StringComparison.OrdinalIgnoreCase);
            var esFacebook = string.Equals(proveedorNormalizado, "Facebook", StringComparison.OrdinalIgnoreCase);

            if (string.IsNullOrEmpty(proveedorNormalizado) || !(esGoogle || esFacebook))
                return (false, "Proveedor no reconocido.");

            var usuario = await _context.Usuarios.FirstOrDefaultAsync(u => u.IdUsuario == idUsuario);
            if (usuario == null)
                return (false, "El usuario no existe.");

            var vinculacion = await _context.UsuariosProveedoresAuth
                .FirstOrDefaultAsync(x => x.IdUsuario == idUsuario &&
                    (esGoogle ? x.Proveedor == "Google" : x.Proveedor == "Facebook"));

            if (vinculacion == null)
                return (false, "Esa cuenta no está vinculada.");

            var tienePassword = !string.IsNullOrEmpty(usuario.PasswordHash);
            if (!tienePassword)
            {
                var otrosProveedores = await _context.UsuariosProveedoresAuth
                    .CountAsync(x => x.IdUsuario == idUsuario &&
                        x.IdUsuarioProveedorAuth != vinculacion.IdUsuarioProveedorAuth);

                if (otrosProveedores == 0)
                {
                    return (false, "No podés desvincular tu único método de acceso. Establecé una contraseña o vinculá otra cuenta antes de desvincular esta.");
                }
            }

            _context.UsuariosProveedoresAuth.Remove(vinculacion);
            await _context.SaveChangesAsync();

            return (true, $"Cuenta de {vinculacion.Proveedor} desvinculada correctamente.");
        }

        public async Task<object?> ObtenerPerfilConComercioAsync(int idUsuario)
        {
            var usuario = await _context.Usuarios
                .FirstOrDefaultAsync(u => u.IdUsuario == idUsuario);

            if (usuario == null) return null;

            // Trae TODOS los comercios ligados a este usuario (vía PersonaLegal),
            // no solo uno. Un funcionario puede tener varios comercios afiliados.
            var comercios = await (from c in _context.Comercios
                                    join p in _context.PersonasLegales
                                        on c.IdPersonaLegal equals p.IdPersonaLegal
                                    where p.IdUsuario == idUsuario
                                    select new
                                    {
                                        c.IdComercio,
                                        c.IdTipoComercio,
                                        c.NombreComercial,
                                        Aprobado = c.IdEstadoSolicitud == 2
                                    })
                                    .ToListAsync();

            return new
            {
                usuario.IdUsuario,
                usuario.Nombre,
                usuario.Correo,
                IdRol = usuario.IdRol,
                EsAdmin = usuario.IdRol == 1,
                EsFuncionario = usuario.IdRol == 4,
                Comercios = comercios // 👈 lista completa, el frontend decide qué mostrar
            };
        }

}

    public class FacebookTokenResponse
    {
        [JsonPropertyName("id")]
        public string? Id { get; set; }

        [JsonPropertyName("first_name")]
        public string? FirstName { get; set; }

        [JsonPropertyName("last_name")]
        public string? LastName { get; set; }

        [JsonPropertyName("email")]
        public string? Email { get; set; }
    }

    // Respuesta del endpoint userinfo de Google (oauth2/v3/userinfo), usada por
    // VincularGoogleConAccessTokenAsync — distinta del payload de GoogleJsonWebSignature que
    // usa el flujo por credential/ID token.
    public class GoogleUserInfoResponse
    {
        [JsonPropertyName("sub")]
        public string? Sub { get; set; }

        [JsonPropertyName("email")]
        public string? Email { get; set; }

        [JsonPropertyName("email_verified")]
        public bool? EmailVerified { get; set; }
    }

}