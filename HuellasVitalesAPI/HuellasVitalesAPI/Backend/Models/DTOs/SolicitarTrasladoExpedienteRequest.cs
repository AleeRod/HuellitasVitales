using System.ComponentModel.DataAnnotations;

namespace HuellasVitalesAPI.Backend.Models.DTOs;

public class SolicitarTrasladoExpedienteRequest
{
    [Range(1, int.MaxValue)] public int IdComercioDestino { get; set; }
    [StringLength(1000)] public string? Motivo { get; set; }
}

public class ResolverTrasladoExpedienteRequest
{
    [StringLength(1000)] public string? Respuesta { get; set; }
}
