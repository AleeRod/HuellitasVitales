using HuellasVitalesAPI.Backend.Models.DTOs;
using HuellitasVitalesAPI.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HuellitasVitalesAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CargoController : ControllerBase
    {
        private readonly ConexionDB _context;

        public CargoController(ConexionDB context)
        {
            _context = context;
        }

        // GET api/cargo
        [HttpGet]
        [Authorize]
        public async Task<IActionResult> Listar()
        {
            var cargos = await _context.CargosCat
                .OrderBy(c => c.Nombre)
                .Select(c => new CargoDTO { IdCargo = c.IdCargo, Nombre = c.Nombre })
                .ToListAsync();

            return Ok(cargos);
        }
    }
}