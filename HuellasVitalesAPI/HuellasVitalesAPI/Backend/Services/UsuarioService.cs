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

                var verifyTokenUrl =
                    $"https://graph.facebook.com/me" +
                    $"?fields=first_name,last_name,email,id" +
                    $"&access_token={facebookToken}";

                var response = await httpClient.GetAsync(verifyTokenUrl);

                if (!response.IsSuccessStatusCode)
                {
                    return (false, "El token de Facebook no es válido.");
                }

                var jsonResult = await response.Content.ReadAsStringAsync();

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