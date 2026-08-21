using HuellasVitalesAPI.Backend.Models.DTOs;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace HuellitasVitalesAPI.Services;

// Arma el PDF exportable del expediente (mascota, veterinaria actual, historial de
// veterinarias/traslados, atenciones externas y emergencias). Los datos ya vienen filtrados
// por permisos desde ExpedienteService.ObtenerParaExportarAsync — este servicio solo dibuja.
public class ExpedientePdfService
{
    private static readonly string PineOscuro = Colors.Green.Darken4;
    private static readonly string Menta = Colors.Green.Medium;
    private static readonly string GrisTexto = Colors.Grey.Darken2;
    private static readonly string GrisClaro = Colors.Grey.Lighten3;

    public byte[] Generar(ExpedienteExportDTO datos)
    {
        var documento = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(2, Unit.Centimetre);
                page.DefaultTextStyle(x => x.FontSize(10).FontColor(GrisTexto));

                page.Header().Column(col =>
                {
                    col.Item().Text("Huellitas Vitales").FontSize(18).Bold().FontColor(PineOscuro);
                    col.Item().Text("Expediente clínico").FontSize(12).FontColor(Menta);
                    col.Item().PaddingTop(4).LineHorizontal(1).LineColor(GrisClaro);
                });

                page.Content().PaddingVertical(10).Column(col =>
                {
                    col.Spacing(14);

                    col.Item().Column(info =>
                    {
                        info.Item().Text($"Mascota: {datos.NombreMascota}").FontSize(13).Bold().FontColor(PineOscuro);
                        info.Item().Text($"Veterinaria actual: {datos.NombreComercioActual ?? "Sin asignar"}");
                        info.Item().Text($"Expediente abierto el: {datos.FechaApertura:dd/MM/yyyy}");
                    });

                    col.Item().Component(new SeccionTitulo("Historial de veterinarias"));
                    if (datos.HistorialComercios.Count == 0)
                    {
                        col.Item().Text("Sin movimientos registrados.").Italic();
                    }
                    else
                    {
                        col.Item().Table(tabla =>
                        {
                            tabla.ColumnsDefinition(c =>
                            {
                                c.RelativeColumn(3);
                                c.RelativeColumn(2);
                                c.RelativeColumn(2);
                                c.RelativeColumn(2);
                            });
                            tabla.Header(h =>
                            {
                                h.Cell().Element(Encabezado).Text("Veterinaria");
                                h.Cell().Element(Encabezado).Text("Desde");
                                h.Cell().Element(Encabezado).Text("Hasta");
                                h.Cell().Element(Encabezado).Text("Permisos");
                            });
                            foreach (var item in datos.HistorialComercios)
                            {
                                tabla.Cell().Element(Celda).Text(item.NombreComercio);
                                tabla.Cell().Element(Celda).Text(item.FechaDesde.ToString("dd/MM/yyyy"));
                                tabla.Cell().Element(Celda).Text(item.FechaHasta.HasValue ? item.FechaHasta.Value.ToString("dd/MM/yyyy") : "Vigente");
                                tabla.Cell().Element(Celda).Text(item.PuedeModificar ? "Consulta y edición" : "Solo consulta");
                            }
                        });
                    }

                    col.Item().Component(new SeccionTitulo("Atenciones externas"));
                    if (datos.AtencionesExternas.Count == 0)
                    {
                        col.Item().Text("Sin atenciones externas registradas.").Italic();
                    }
                    else
                    {
                        foreach (var a in datos.AtencionesExternas)
                        {
                            col.Item().Border(1).BorderColor(GrisClaro).Padding(8).Column(item =>
                            {
                                item.Item().Text($"{a.NombreVeterinaria} · {a.FechaAtencion:dd/MM/yyyy}").Bold();
                                item.Item().Text($"Motivo: {a.Motivo}");
                                if (!string.IsNullOrWhiteSpace(a.Diagnostico)) item.Item().Text($"Diagnóstico: {a.Diagnostico}");
                                if (!string.IsNullOrWhiteSpace(a.Tratamiento)) item.Item().Text($"Tratamiento: {a.Tratamiento}");
                            });
                        }
                    }

                    col.Item().Component(new SeccionTitulo("Emergencias"));
                    if (datos.Emergencias.Count == 0)
                    {
                        col.Item().Text("Sin emergencias registradas.").Italic();
                    }
                    else
                    {
                        foreach (var e in datos.Emergencias)
                        {
                            col.Item().Border(1).BorderColor(GrisClaro).Padding(8).Column(item =>
                            {
                                item.Item().Text($"{e.FechaSolicitud:dd/MM/yyyy} · {e.Estado}{(e.EsAtencionExterna ? " (atendida externamente)" : "")}").Bold();
                                item.Item().Text($"Motivo: {e.Motivo}");
                                if (!string.IsNullOrWhiteSpace(e.Diagnostico)) item.Item().Text($"Diagnóstico: {e.Diagnostico}");
                                if (!string.IsNullOrWhiteSpace(e.Tratamiento)) item.Item().Text($"Tratamiento: {e.Tratamiento}");
                            });
                        }
                    }
                });

                page.Footer().AlignCenter().Text(x =>
                {
                    x.Span("Generado el ").FontSize(8);
                    x.Span(DateTime.Now.ToString("dd/MM/yyyy HH:mm")).FontSize(8);
                    x.Span(" · Huellitas Vitales").FontSize(8);
                });
            });
        });

        return documento.GeneratePdf();
    }

    private static IContainer Encabezado(IContainer contenedor) =>
        contenedor.DefaultTextStyle(x => x.Bold().FontColor(Colors.White)).Background(PineOscuro).Padding(5);

    private static IContainer Celda(IContainer contenedor) =>
        contenedor.BorderBottom(1).BorderColor(GrisClaro).PaddingVertical(4).PaddingHorizontal(5);

    private sealed class SeccionTitulo : IComponent
    {
        private readonly string _titulo;
        public SeccionTitulo(string titulo) => _titulo = titulo;

        public void Compose(IContainer container)
        {
            container.Column(col =>
            {
                col.Item().Text(_titulo).FontSize(12).Bold().FontColor(PineOscuro);
                col.Item().PaddingBottom(4).LineHorizontal(0.5f).LineColor(GrisClaro);
            });
        }
    }
}
