using BCrypt.Net;
using Google.Apis.Auth;
using HuellasVitalesAPI.Backend.Models.Entidades;
using HuellitasVitalesAPI.Data;
using Microsoft.Extensions.Configuration;
using HuellitasVitalesAPI.Models.DTOs;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

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
                Activo = true,
                FechaRegistro = DateTime.Now
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
                    // Verificado: Es el mismo Client ID que en el HTML
                    Audience = new List<string> { "345969836543-cmegbuqmfc6dv7l0abo6cjj4u2fpdlqi.apps.googleusercontent.com" }
                };

                // Ahora ValidateAsync recibirá un ID Token válido y dejará de dar error
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
                        Activo = true,
                        FechaRegistro = DateTime.Now
                    };

                    _context.Usuarios.Add(usuario);
                    await _context.SaveChangesAsync();
                }
                else
                {
                    // Aquí está el truco: verificamos si realmente hay algo que cambiar
                    if (usuario.Proveedor_Auth != "Google")
                    {
                        usuario.Proveedor_Auth = "Google";
                        usuario.Proveedor_Id = payload.Subject;

                        // ¡ESTO ES LO QUE SEGURAMENTE ESTABA FALLANDO O NO LLEGABA A EJECUTARSE!
                        _context.Usuarios.Update(usuario); // Aseguramos que EF sepa que cambió
                        await _context.SaveChangesAsync(); // ¡Guardamos en BD!
                    }
                }
                return usuario;
            }
            catch (Exception ex)
            {
                // Esto aparecerá en la ventana de "Salida" de Visual Studio si falla
                System.Diagnostics.Debug.WriteLine($"Error de Google en C#: {ex.Message}");
                return null;
            }
        }

        // ─── MÉTODO PARA AUTENTICACIÓN LOCAL (CORREO Y CONTRASEÑA) ───
        public async Task<Usuario?> AutenticarLocalAsync(LoginRequest request)
        {
            // 1. Buscar el usuario por su correo
            var usuario = await _context.Usuarios.FirstOrDefaultAsync(u => u.Correo == request.Correo);

            // 2. Si no existe, devolvemos null
            if (usuario == null) return null;

            // 3. Validar si el usuario se registró con Google y no tiene contraseña local
            if (usuario.Proveedor_Auth == "Google" && string.IsNullOrEmpty(usuario.PasswordHash))
            {
                throw new Exception("Este correo está vinculado a una cuenta de Google. Inicia sesión con el botón de Google.");
            }

            // 4. Verificar que la contraseña coincida con el hash guardado usando BCrypt
            bool passwordValida = BCrypt.Net.BCrypt.Verify(request.Password, usuario.PasswordHash);

            if (!passwordValida) return null;

            return usuario;
        }

        // ─── MÉTODO PARA GENERAR EL TOKEN JWT ───
        public string GenerarTokenJWT(Usuario usuario)
        {
            // 1. Leemos la clave desde appsettings.json
            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]!));
            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

            // 2. Definimos qué datos viajarán dentro del token (Claims)
            var claims = new[]
            {
            new Claim(JwtRegisteredClaimNames.Sub, usuario.IdUsuario.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, usuario.Correo),
            new Claim("rol", usuario.IdRol.ToString()) // Súper importante para controlar accesos luego
        };

            // 3. Construimos el token con un tiempo de vida (ej. 2 horas)
            var token = new JwtSecurityToken(
                claims: claims,
                expires: DateTime.Now.AddHours(2),
                signingCredentials: credentials);

            // 4. Retornamos el string del token
            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}