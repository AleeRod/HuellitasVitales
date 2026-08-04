using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HuellasVitalesAPI.Migrations
{
    /// <inheritdoc />
    public partial class AgregarServicioVeterinario : Migration
    {
        // NOTA: la base de datos fue creada a mano antes de adoptar migraciones de EF.
        // Las tablas USUARIO, ROL, VETERINARIO, COMERCIO y PERSONA_LEGAL YA existen, por lo
        // que su creación se retiró de esta migración para no chocar contra la BD actual.
        // El ModelSnapshot sí describe todo el modelo, de modo que las próximas migraciones
        // partan de un estado correcto. Esta migración únicamente agrega SERVICIO_VETERINARIO.

        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "SERVICIO_VETERINARIO",
                columns: table => new
                {
                    IdServicioVeterinario = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    NOMBRE = table.Column<string>(type: "nvarchar(120)", maxLength: 120, nullable: false),
                    DESCRIPCION = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    DURACION_MINUTOS = table.Column<int>(type: "int", nullable: false),
                    PRECIO = table.Column<decimal>(type: "decimal(10,2)", nullable: false),
                    TIPO = table.Column<int>(type: "int", nullable: false),
                    IS_ACTIVE = table.Column<bool>(type: "bit", nullable: false),
                    FECHA_CREACION = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SERVICIO_VETERINARIO", x => x.IdServicioVeterinario);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "SERVICIO_VETERINARIO");
        }
    }
}
