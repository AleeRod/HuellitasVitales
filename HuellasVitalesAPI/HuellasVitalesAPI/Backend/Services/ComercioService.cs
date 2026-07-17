using HuellasVitalesAPI.Backend.Models.DTOs;
using HuellasVitalesAPI.Backend.Models.Entidades;
using HuellitasVitalesAPI.Data;
using Microsoft.EntityFrameworkCore;

namespace HuellitasVitalesAPI.Services
{
    public class ComercioService
    {
        private readonly ConexionDB _context;
        private readonly ILogger<ComercioService> _logger;

        public ComercioService(ConexionDB context, ILogger<ComercioService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<(bool Exito, string Mensaje)> CrearSolicitudRegistroAsync(SolicitudComercioRequest request)
        {
            var usuarioExiste = await _context.Usuarios.AnyAsync(u => u.IdUsuario == request.IdUsuario);
            if (!usuarioExiste) return (false, "El usuario solicitante no existe en el sistema.");

            using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                var personaLegal = await _context.PersonasLegales
                    .FirstOrDefaultAsync(p => p.Identificacion == request.Identificacion);

                if (personaLegal == null)
                {
                    personaLegal = new PersonaLegal
                    {
                        IdTipoPersona = request.IdTipoPersona,
                        Identificacion = request.Identificacion,
                        RazonSocial = request.IdTipoPersona == 2 ? request.RazonSocial : null,
                        IdUsuario = request.IdUsuario
                    };
                    _context.PersonasLegales.Add(personaLegal);
                    await _context.SaveChangesAsync();
                }

                var nuevosComercios = new List<Comercio>();

                foreach (var comDTO in request.Comercios)
                {
                    var existeComercioDuplicado = await _context.Comercios.AnyAsync(c => 
                        c.IdPersonaLegal == personaLegal.IdPersonaLegal && 
                        c.IdTipoComercio == comDTO.IdTipoComercio && 
                        c.NombreComercial.ToLower() == comDTO.NombreComercial.ToLower());

                    if (existeComercioDuplicado)
                    {
                        await transaction.RollbackAsync();
                        return (false, $"El comercio '{comDTO.NombreComercial}' ya se encuentra registrado o en proceso de solicitud.");
                    }

                    nuevosComercios.Add(new Comercio
                    {
                        IdPersonaLegal = personaLegal.IdPersonaLegal,
                        IdTipoComercio = comDTO.IdTipoComercio,
                        NombreComercial = comDTO.NombreComercial,
                        Direccion = comDTO.Direccion,
                        Telefono = comDTO.Telefono,
                        IdEstadoSolicitud = 1,
                        FechaSolicitud = DateTime.Now
                    });
                }

                _context.Comercios.AddRange(nuevosComercios);
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return (true, "Solicitud de comercio(s) registrada con éxito.");
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Error al procesar solicitud para {Identificacion}", request.Identificacion);
                return (false, "Ocurrió un error interno al procesar la solicitud.");
            }
        }
    }
}