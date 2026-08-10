namespace HuellasVitalesAPI.Backend.Models.DTOs
{
    public class FuncionarioDTO
    {
        public int IdComercioFuncionario { get; set; }
        public int IdUsuario { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public string Apellidos { get; set; } = string.Empty;
        public string Correo { get; set; } = string.Empty;
        public short IdCargo { get; set; }
        public string Cargo { get; set; } = string.Empty;
        public bool Activo { get; set; }
        public DateTime FechaIngreso { get; set; }
    }
}