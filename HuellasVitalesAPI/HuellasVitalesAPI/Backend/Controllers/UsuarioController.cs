using HuellasVitalesAPI.Backend.Models.DTOs;
using HuellitasVitalesAPI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System.Security.Claims;

namespace HuellitasVitalesAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UsuarioController : ControllerBase
    {
        private readonly UsuarioService _usuarioService;
        private readonly ILogger<UsuarioController> _logger;

        public UsuarioController(UsuarioService usuarioService, ILogger<UsuarioController> logger)
        {
            _usuarioService = usuarioService;
            _logger = logger;
        }

        // ─── TAREA 3: Datos del perfil de usuario ───
        // GET api/usuario/{id}
        // ─── GET api/usuario/perfil ───
        [Authorize]
        [HttpGet("perfil")]
        public async Task<IActionResult> ObtenerPerfilAutenticado()
        {
            try
            {
                var userIdClaim = User.FindFirst("sub")?.Value 
                            ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int idUsuario))
                {
                    return Unauthorized(new { success = false, mensaje = "Token inválido." });
                }

                var perfil = await _usuarioService.ObtenerPerfilAsync(idUsuario);

                if (perfil == null)
                    return NotFound(new { success = false, mensaje = "El usuario no existe." });

                return Ok(perfil);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener el perfil del usuario autenticado.");
                return StatusCode(500, new { success = false, mensaje = "Error interno al obtener el perfil." });
            }
        }

        [Authorize]
        [HttpGet("mascotas")]
        public async Task<IActionResult> ObtenerMascotasDelUsuario()
        {
            var userIdClaim = User.FindFirst("sub")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var idUsuario))
                return Unauthorized(new { success = false, mensaje = "Token inválido o no proporcionado." });

            var mascotas = await _usuarioService.ObtenerMascotasPorUsuarioAsync(idUsuario);
            return Ok(new { success = true, mascotas });
        }

        [Authorize]
        [HttpGet("mascotas/{idMascota:int}")]
        public async Task<IActionResult> ObtenerMascotaPorId(int idMascota)
        {
            var userIdClaim = User.FindFirst("sub")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var idUsuario))
                return Unauthorized(new { success = false, mensaje = "Token inválido o no proporcionado." });

            var mascota = await _usuarioService.ObtenerMascotaPorIdAsync(idUsuario, idMascota);
            if (mascota == null)
                return NotFound(new { success = false, mensaje = "Mascota no encontrada." });

            return Ok(new { success = true, mascota });
        }

        [Authorize]
        [HttpPost("mascotas")]
        public async Task<IActionResult> CrearMascota([FromBody] CrearMascotaRequest request)
        {
            var userIdClaim = User.FindFirst("sub")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var idUsuario))
                return Unauthorized(new { success = false, mensaje = "Token inválido o no proporcionado." });

            var (exito, mensaje, mascota) = await _usuarioService.CrearMascotaAsync(idUsuario, request);
            if (!exito)
                return BadRequest(new { success = false, mensaje });

            return Ok(new { success = true, mensaje, mascota });
        }

        [Authorize]
        [HttpPut("mascotas/{idMascota:int}")]
        public async Task<IActionResult> ActualizarMascota(int idMascota, [FromBody] ActualizarMascotaRequest request)
        {
            var userIdClaim = User.FindFirst("sub")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var idUsuario))
                return Unauthorized(new { success = false, mensaje = "Token inválido o no proporcionado." });

            var (exito, mensaje, mascota) = await _usuarioService.ActualizarMascotaAsync(idUsuario, idMascota, request);
            if (!exito)
                return BadRequest(new { success = false, mensaje });

            return Ok(new { success = true, mensaje, mascota });
        }

        [Authorize]
        [HttpDelete("mascotas/{idMascota:int}")]
        public async Task<IActionResult> EliminarMascota(int idMascota)
        {
            var userIdClaim = User.FindFirst("sub")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var idUsuario))
                return Unauthorized(new { success = false, mensaje = "Token inválido o no proporcionado." });

            var (exito, mensaje) = await _usuarioService.EliminarMascotaAsync(idUsuario, idMascota);
            if (!exito)
                return BadRequest(new { success = false, mensaje });

            return Ok(new { success = true, mensaje });
        }

        // ─── TAREA 119: Actualizar perfil de usuario autenticado ───
        // PUT api/usuario/perfil
        [Authorize]
        [HttpPut("perfil")]
        public async Task<IActionResult> ActualizarPerfil([FromBody] ActualizarPerfilDTO dto)
        {
            try
            {
                // Extraer el ID del usuario directamente del token JWT
                var userIdClaim = User.FindFirst("sub")?.Value 
                            ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int idUsuario))
                {
                    return Unauthorized(new { success = false, mensaje = "Token inválido o no proporcionado." });
                }

                var (exito, mensaje) = await _usuarioService.ActualizarPerfilAsync(idUsuario, dto);

                if (!exito)
                {
                    return BadRequest(new { success = false, mensaje });
                }

                return Ok(new { success = true, mensaje });
            }
            catch (Exception ex)
            {
                // El error real se queda en el backend
                _logger.LogError(ex, "Error interno al actualizar el perfil del usuario.");
                return StatusCode(500, new { success = false, mensaje = "Ocurrió un error interno al intentar actualizar el perfil." });
            }
        }

        // ─── Actualizar ícono de avatar del perfil ───
        // PUT api/usuario/avatar
        [Authorize]
        [HttpPut("avatar")]
        public async Task<IActionResult> ActualizarAvatar([FromBody] ActualizarAvatarDTO dto)
        {
            try
            {
                var userIdClaim = User.FindFirst("sub")?.Value
                            ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int idUsuario))
                {
                    return Unauthorized(new { success = false, mensaje = "Token inválido o no proporcionado." });
                }

                var (exito, mensaje) = await _usuarioService.ActualizarAvatarAsync(idUsuario, dto?.Icono ?? string.Empty);

                if (!exito)
                {
                    return BadRequest(new { success = false, mensaje });
                }

                return Ok(new { success = true, mensaje });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error interno al actualizar el ícono de perfil.");
                return StatusCode(500, new { success = false, mensaje = "Ocurrió un error interno al actualizar el ícono de perfil." });
            }
        }

        // ─── Cambiar contraseña del usuario autenticado ───
        // PUT api/usuario/password
        [Authorize]
        [HttpPut("password")]
        public async Task<IActionResult> CambiarPassword([FromBody] CambiarPasswordDTO dto)
        {
            try
            {
                var userIdClaim = User.FindFirst("sub")?.Value
                            ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int idUsuario))
                {
                    return Unauthorized(new { success = false, mensaje = "Token inválido o no proporcionado." });
                }

                var (exito, mensaje) = await _usuarioService.CambiarPasswordAsync(idUsuario, dto);

                if (!exito)
                {
                    return BadRequest(new { success = false, mensaje });
                }

                return Ok(new { success = true, mensaje });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error interno al cambiar la contraseña del usuario.");
                return StatusCode(500, new { success = false, mensaje = "Ocurrió un error interno al cambiar la contraseña." });
            }
        }

        // ─── NUEVO: Registro Rápido ───
        [HttpPost("registro-rapido")]
        public async Task<IActionResult> RegistroRapido([FromBody] RegistroRapidoDTO request)
        {
            try
            {
                // Usamos _usuarioService, que ya está inyectado
                var token = await _usuarioService.RegistrarUsuarioRapidoAsync(request);
                
                // Devolvemos el token para que el frontend lo guarde y pase al checkout
                return Ok(new { token, mensaje = "Registro rápido exitoso" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { mensaje = ex.Message });
            }
        }

        [Authorize]
        [HttpPost("vincular-google")]
        public async Task<IActionResult> VincularGoogle(
            [FromBody] LoginSocialRequest request)
        {
            try
            {
                var userIdClaim =
                    User.FindFirst("sub")?.Value
                    ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                if (string.IsNullOrEmpty(userIdClaim) ||
                    !int.TryParse(userIdClaim, out int idUsuario))
                {
                    return Unauthorized(new
                    {
                        success = false,
                        mensaje = "Token inválido o no proporcionado."
                    });
                }

                if (request == null || string.IsNullOrEmpty(request.Token))
                {
                    return BadRequest(new
                    {
                        success = false,
                        mensaje = "El token de Google es obligatorio."
                    });
                }

                var resultado = await _usuarioService.VincularGoogleAsync(
                    idUsuario,
                    request.Token
                );

                if (!resultado.Exito)
                {
                    return BadRequest(new
                    {
                        success = false,
                        mensaje = resultado.Mensaje
                    });
                }

                return Ok(new
                {
                    success = true,
                    mensaje = resultado.Mensaje
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Error al vincular Google con el usuario."
                );

                return StatusCode(500, new
                {
                    success = false,
                    mensaje = "Ocurrió un error al vincular la cuenta de Google."
                });
            }
        }

        [Authorize]
        [HttpPost("vincular-facebook")]
        public async Task<IActionResult> VincularFacebook(
            [FromBody] LoginSocialRequest request)
        {
            try
            {
                var userIdClaim =
                    User.FindFirst("sub")?.Value
                    ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                if (string.IsNullOrEmpty(userIdClaim) ||
                    !int.TryParse(userIdClaim, out int idUsuario))
                {
                    return Unauthorized(new
                    {
                        success = false,
                        mensaje = "Token inválido o no proporcionado."
                    });
                }

                if (request == null || string.IsNullOrEmpty(request.Token))
                {
                    return BadRequest(new
                    {
                        success = false,
                        mensaje = "El token de Facebook es obligatorio."
                    });
                }

                var resultado =
                    await _usuarioService.VincularFacebookAsync(
                        idUsuario,
                        request.Token);

                if (!resultado.Exito)
                {
                    return BadRequest(new
                    {
                        success = false,
                        mensaje = resultado.Mensaje
                    });
                }

                return Ok(new
                {
                    success = true,
                    mensaje = resultado.Mensaje
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Error al vincular Facebook con el usuario."
                );

                return StatusCode(500, new
                {
                    success = false,
                    mensaje = "Ocurrió un error al vincular la cuenta de Facebook."
                });
            }
        }

        // ─── Vincular Google a partir de un access token (switch de Configuración) ───
        // POST api/usuario/vincular-google-token
        [Authorize]
        [HttpPost("vincular-google-token")]
        public async Task<IActionResult> VincularGoogleConToken([FromBody] VincularGoogleTokenDTO dto)
        {
            try
            {
                var userIdClaim = User.FindFirst("sub")?.Value
                            ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int idUsuario))
                {
                    return Unauthorized(new { success = false, mensaje = "Token inválido o no proporcionado." });
                }

                if (dto == null || string.IsNullOrEmpty(dto.AccessToken))
                {
                    return BadRequest(new { success = false, mensaje = "El token de acceso de Google es obligatorio." });
                }

                var resultado = await _usuarioService.VincularGoogleConAccessTokenAsync(idUsuario, dto.AccessToken);

                if (!resultado.Exito)
                {
                    return BadRequest(new { success = false, mensaje = resultado.Mensaje });
                }

                return Ok(new { success = true, mensaje = resultado.Mensaje });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al vincular Google (access token) con el usuario.");
                return StatusCode(500, new { success = false, mensaje = "Ocurrió un error al vincular la cuenta de Google." });
            }
        }

        // ─── Desvincular Google o Facebook de la cuenta autenticada ───
        // DELETE api/usuario/proveedores-vinculados/{proveedor}
        [Authorize]
        [HttpDelete("proveedores-vinculados/{proveedor}")]
        public async Task<IActionResult> DesvincularProveedor(string proveedor)
        {
            try
            {
                var userIdClaim = User.FindFirst("sub")?.Value
                            ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int idUsuario))
                {
                    return Unauthorized(new { success = false, mensaje = "Token inválido o no proporcionado." });
                }

                var resultado = await _usuarioService.DesvincularProveedorAsync(idUsuario, proveedor);

                if (!resultado.Exito)
                {
                    return BadRequest(new { success = false, mensaje = resultado.Mensaje });
                }

                return Ok(new { success = true, mensaje = resultado.Mensaje });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al desvincular un proveedor del usuario.");
                return StatusCode(500, new { success = false, mensaje = "Ocurrió un error al desvincular la cuenta." });
            }
        }

        [Authorize]
        [HttpGet("proveedores-vinculados")]
        public async Task<IActionResult> ObtenerProveedoresVinculados()
        {
            try
            {
                var userIdClaim =
                    User.FindFirst("sub")?.Value
                    ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                if (string.IsNullOrEmpty(userIdClaim) ||
                    !int.TryParse(userIdClaim, out int idUsuario))
                {
                    return Unauthorized(new
                    {
                        success = false,
                        mensaje = "Token inválido o no proporcionado."
                    });
                }

                var proveedores =
                    await _usuarioService.ObtenerProveedoresVinculadosAsync(idUsuario);

                return Ok(new
                {
                    success = true,
                    google = proveedores.Any(p =>
                        p.Equals("Google", StringComparison.OrdinalIgnoreCase)),
                    facebook = proveedores.Any(p =>
                        p.Equals("Facebook", StringComparison.OrdinalIgnoreCase))
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Error al obtener las cuentas vinculadas del usuario."
                );

                return StatusCode(500, new
                {
                    success = false,
                    mensaje = "No fue posible obtener las cuentas vinculadas."
                });
            }
        }
        
        [Authorize]
        [HttpGet("me")]
        public async Task<IActionResult> Me()
        {
            var subClaim = User.FindFirst("sub")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(subClaim, out var idUsuario))
                return Unauthorized(new { success = false, mensaje = "Token inválido." });

            var perfil = await _usuarioService.ObtenerPerfilConComercioAsync(idUsuario);
            if (perfil == null)
                return NotFound(new { success = false, mensaje = "Usuario no encontrado." });

            return Ok(new { success = true, usuario = perfil });
        }

        // ─── Panel de Administración: gestión de cualquier usuario de la plataforma ───
        // POST api/usuario — el admin crea una cuenta nueva con el rol que elija.
        [Authorize]
        [HttpPost]
        public async Task<IActionResult> CrearUsuarioComoAdmin([FromBody] CrearUsuarioAdminDTO dto)
        {
            if (!EsUsuarioAdmin())
                return StatusCode(403, new { success = false, mensaje = "Acceso denegado. Se requieren permisos de Administrador." });

            var (exito, mensaje) = await _usuarioService.CrearUsuarioComoAdminAsync(dto);
            if (!exito)
                return BadRequest(new { success = false, mensaje });

            return StatusCode(201, new { success = true, mensaje });
        }

        // GET api/usuario?rol=&estado=&busqueda=
        [Authorize]
        [HttpGet]
        public async Task<IActionResult> ListarUsuarios([FromQuery] byte? rol, [FromQuery] byte? estado, [FromQuery] string? busqueda)
        {
            if (!EsUsuarioAdmin())
                return StatusCode(403, new { success = false, mensaje = "Acceso denegado. Se requieren permisos de Administrador." });

            var usuarios = await _usuarioService.ListarUsuariosAsync(rol, estado, busqueda);
            return Ok(new { success = true, usuarios });
        }

        // GET api/usuario/estadisticas
        [Authorize]
        [HttpGet("estadisticas")]
        public async Task<IActionResult> ObtenerEstadisticasUsuarios()
        {
            if (!EsUsuarioAdmin())
                return StatusCode(403, new { success = false, mensaje = "Acceso denegado. Se requieren permisos de Administrador." });

            var estadisticas = await _usuarioService.ObtenerEstadisticasUsuariosAsync();
            return Ok(new { success = true, estadisticas });
        }

        // GET api/usuario/estadisticas/registros?periodo=semanal|mensual|anual
        [Authorize]
        [HttpGet("estadisticas/registros")]
        public async Task<IActionResult> ObtenerRegistrosPorPeriodo([FromQuery] string? periodo)
        {
            if (!EsUsuarioAdmin())
                return StatusCode(403, new { success = false, mensaje = "Acceso denegado. Se requieren permisos de Administrador." });

            var puntos = await _usuarioService.ObtenerRegistrosPorPeriodoAsync(periodo);
            return Ok(new { success = true, puntos });
        }

        // GET api/usuario/{id}
        [Authorize]
        [HttpGet("{id:int}")]
        public async Task<IActionResult> ObtenerUsuarioPorId(int id)
        {
            if (!EsUsuarioAdmin())
                return StatusCode(403, new { success = false, mensaje = "Acceso denegado. Se requieren permisos de Administrador." });

            var usuario = await _usuarioService.ObtenerUsuarioAdminAsync(id);
            if (usuario == null)
                return NotFound(new { success = false, mensaje = "El usuario no existe." });

            return Ok(new { success = true, usuario });
        }

        // PUT api/usuario/{id}
        [Authorize]
        [HttpPut("{id:int}")]
        public async Task<IActionResult> ActualizarUsuarioComoAdmin(int id, [FromBody] ActualizarPerfilDTO dto)
        {
            if (!EsUsuarioAdmin())
                return StatusCode(403, new { success = false, mensaje = "Acceso denegado. Se requieren permisos de Administrador." });

            var (exito, mensaje) = await _usuarioService.ActualizarPerfilComoAdminAsync(id, dto);
            if (!exito)
                return BadRequest(new { success = false, mensaje });

            return Ok(new { success = true, mensaje });
        }

        // PUT api/usuario/{id}/rol
        [Authorize]
        [HttpPut("{id:int}/rol")]
        public async Task<IActionResult> CambiarRol(int id, [FromBody] CambiarRolDTO dto)
        {
            if (!EsUsuarioAdmin())
                return StatusCode(403, new { success = false, mensaje = "Acceso denegado. Se requieren permisos de Administrador." });

            var (exito, mensaje) = await _usuarioService.CambiarRolAsync(id, dto?.IdRol ?? 0);
            if (!exito)
                return BadRequest(new { success = false, mensaje });

            return Ok(new { success = true, mensaje });
        }

        // PUT api/usuario/{id}/estado
        [Authorize]
        [HttpPut("{id:int}/estado")]
        public async Task<IActionResult> CambiarEstadoCuenta(int id, [FromBody] CambiarEstadoCuentaDTO dto)
        {
            if (!EsUsuarioAdmin())
                return StatusCode(403, new { success = false, mensaje = "Acceso denegado. Se requieren permisos de Administrador." });

            var (exito, mensaje) = await _usuarioService.CambiarEstadoCuentaAsync(id, dto?.IdEstadoCuenta ?? 0);
            if (!exito)
                return BadRequest(new { success = false, mensaje });

            return Ok(new { success = true, mensaje });
        }

        private bool EsUsuarioAdmin()
        {
            var rolUsuario = User.FindFirst("rol")?.Value
                            ?? User.FindFirst(ClaimTypes.Role)?.Value
                            ?? User.FindFirst("IdRol")?.Value
                            ?? User.FindFirst("idRol")?.Value
                            ?? User.FindFirst("http://schemas.microsoft.com/ws/2008/06/identity/claims/role")?.Value;

            if (string.IsNullOrEmpty(rolUsuario)) return false;

            return rolUsuario == "1"
                || string.Equals(rolUsuario, "ADMINISTRADOR", StringComparison.OrdinalIgnoreCase)
                || string.Equals(rolUsuario, "Admin", StringComparison.OrdinalIgnoreCase);
        }
    }
}