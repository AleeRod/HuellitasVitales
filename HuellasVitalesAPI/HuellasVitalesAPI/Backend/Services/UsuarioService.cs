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
                    // Verificar ID CLIENTE de la aplicación en Google Cloud Console
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

            // Validar que el usuario no esté suspendido o como invitado temporal
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
                    // Registro de usuario nuevo
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
                    // Actualizar datos de usuario con mismo correo de Facebook
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