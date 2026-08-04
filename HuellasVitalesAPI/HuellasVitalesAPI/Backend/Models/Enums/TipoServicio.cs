namespace HuellasVitalesAPI.Backend.Models.Enums
{
    /// <summary>
    /// Tipos de servicio que ofrece la clínica. Los valores numéricos son ESTABLES:
    /// la agenda y el buscador dependen de ellos, por lo que no deben reordenarse ni
    /// reutilizarse una vez en producción. Solo se agregan nuevos al final.
    /// </summary>
    public enum TipoServicio
    {
        Consulta = 1,
        Grooming = 2,
        ProcedimientoQuirurgico = 3
    }

    public static class TipoServicioExtensions
    {
        /// <summary>Etiqueta legible para mostrar en la UI.</summary>
        public static string Nombre(this TipoServicio tipo) => tipo switch
        {
            TipoServicio.Consulta => "Consulta",
            TipoServicio.Grooming => "Grooming",
            TipoServicio.ProcedimientoQuirurgico => "Procedimiento Quirúrgico",
            _ => tipo.ToString()
        };
    }
}
