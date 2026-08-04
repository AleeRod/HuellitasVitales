using Microsoft.EntityFrameworkCore;

namespace HuellasVitalesAPI.Backend.Common
{
    /// <summary>
    /// Parámetros de paginación que un controlador recibe por query string:
    /// ?pagina=1&amp;tamanoPagina=10
    /// </summary>
    public class ParametrosPaginacion
    {
        private const int TamanoMaximo = 100;
        private int _tamanoPagina = 10;
        private int _pagina = 1;

        public int Pagina
        {
            get => _pagina;
            set => _pagina = value < 1 ? 1 : value;
        }

        public int TamanoPagina
        {
            get => _tamanoPagina;
            set => _tamanoPagina = value < 1 ? 10 : (value > TamanoMaximo ? TamanoMaximo : value);
        }
    }

    /// <summary>
    /// Envoltorio estándar para respuestas paginadas: items + metadatos (page, pageSize, total).
    /// </summary>
    public class ResultadoPaginado<T>
    {
        public IReadOnlyList<T> Items { get; init; } = Array.Empty<T>();
        public int Pagina { get; init; }
        public int TamanoPagina { get; init; }
        public int Total { get; init; }

        public int TotalPaginas => TamanoPagina > 0 ? (int)Math.Ceiling(Total / (double)TamanoPagina) : 0;
        public bool TienePaginaAnterior => Pagina > 1;
        public bool TienePaginaSiguiente => Pagina < TotalPaginas;
    }

    /// <summary>
    /// Extensión reutilizable para paginar cualquier consulta de EF Core.
    /// </summary>
    public static class PaginacionExtensions
    {
        /// <summary>
        /// Ejecuta el conteo total y trae solo la página pedida.
        /// Uso: <c>await query.OrderBy(...).PaginarAsync(p.Pagina, p.TamanoPagina);</c>
        /// (Requiere un OrderBy previo para que el paginado sea determinista.)
        /// </summary>
        public static async Task<ResultadoPaginado<T>> PaginarAsync<T>(
            this IQueryable<T> query, int pagina, int tamanoPagina, CancellationToken ct = default)
        {
            if (pagina < 1) pagina = 1;
            if (tamanoPagina < 1) tamanoPagina = 10;

            var total = await query.CountAsync(ct);
            var items = await query
                .Skip((pagina - 1) * tamanoPagina)
                .Take(tamanoPagina)
                .ToListAsync(ct);

            return new ResultadoPaginado<T>
            {
                Items = items,
                Pagina = pagina,
                TamanoPagina = tamanoPagina,
                Total = total,
            };
        }

        /// <summary>Sobrecarga que toma directamente los <see cref="ParametrosPaginacion"/>.</summary>
        public static Task<ResultadoPaginado<T>> PaginarAsync<T>(
            this IQueryable<T> query, ParametrosPaginacion p, CancellationToken ct = default)
            => query.PaginarAsync(p.Pagina, p.TamanoPagina, ct);
    }
}
