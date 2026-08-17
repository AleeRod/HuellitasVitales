using BCrypt.Net;
using Google.Apis.Auth;
using HuellasVitalesAPI.Backend.Models.Entidades;
using HuellitasVitalesAPI.Data;
using HuellasVitalesAPI.Backend.Models.DTOs;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Text.Json.Serialization;

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
                FechaRegistro = u.FechaRegistro
            };
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
                    if (usuario.Proveedor_Auth != "Google")
                    {
                        usuario.Proveedor_Auth = "Google";
                        usuario.Proveedor_Id = payload.Subject;

                        _context.Usuarios.Update(usuario);
                        await _context.SaveChangesAsync();
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
}