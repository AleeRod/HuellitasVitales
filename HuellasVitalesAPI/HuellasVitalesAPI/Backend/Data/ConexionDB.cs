using Microsoft.EntityFrameworkCore;
using HuellasVitalesAPI.Backend.Models.Entidades; // Aquí irán tus clases de usuario, etc.

namespace HuellitasVitalesAPI.Data
{
    public class ConexionDB : DbContext
    {
        public ConexionDB(DbContextOptions<ConexionDB> options) : base(options) { }

        // MAPEAR TABLAS DE DATOS
        public DbSet<Usuario> Usuarios { get; set; } = null!;
        public DbSet<Rol> Roles { get; set; } = null!;
        public DbSet<Veterinario> Veterinarios { get; set; } = null!;
        public DbSet<Comercio> Comercios { get; set; } = null!;
        public DbSet<PersonaLegal> PersonasLegales { get; set; } = null!;
        public DbSet<Producto> Productos { get; set; } = null!;
        public DbSet<CategoriaProductoCat> CategoriasProductoCat { get; set; } = null!;
        public DbSet<Servicio> Servicios { get; set; } = null!;
        public DbSet<TipoServicioCat> TiposServicioCat { get; set; } = null!;
        public DbSet<Carrito> Carritos { get; set; } = null!;
        public DbSet<CarritoItem> CarritoItems { get; set; } = null!;
        public DbSet<MarcaCat> MarcasCat { get; set; } = null!;
        public DbSet<TipoComercioCat> TiposComercioCat { get; set; } = null!;
        public DbSet<Orden> Ordenes { get; set; } = null!;
        public DbSet<OrdenDetalle> OrdenDetalles { get; set; } = null!;
        public DbSet<CargoCat> CargosCat { get; set; } = null!;
        public DbSet<ComercioFuncionario> ComerciosFuncionarios { get; set; } = null!;
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Usuario>().ToTable("USUARIO");
            modelBuilder.Entity<Rol>().ToTable("ROL");
            modelBuilder.Entity<Veterinario>().ToTable("VETERINARIO");
            modelBuilder.Entity<Comercio>().ToTable("COMERCIO");
            modelBuilder.Entity<PersonaLegal>().ToTable("PERSONA_LEGAL");
            modelBuilder.Entity<CategoriaProductoCat>().ToTable("CATEGORIA_PRODUCTO_CAT");
            modelBuilder.Entity<Producto>().ToTable("PRODUCTO");
            modelBuilder.Entity<Carrito>().ToTable("CARRITO");
            modelBuilder.Entity<CarritoItem>().ToTable("CARRITO_ITEM");
            modelBuilder.Entity<TipoServicioCat>().ToTable("TIPO_SERVICIO_CAT");
            modelBuilder.Entity<Servicio>().ToTable("SERVICIO");
            modelBuilder.Entity<MarcaCat>().ToTable("MARCA_CAT");
            modelBuilder.Entity<Orden>().ToTable("ORDEN");
            modelBuilder.Entity<OrdenDetalle>().ToTable("ORDEN_DETALLE");

            // Fuerza que TODOS los DateTime se traten como UTC
            // al leer/escribir en Postgres, evitando el error
            // "Cannot write DateTime with Kind=Unspecified..."
            foreach (var entityType in modelBuilder.Model.GetEntityTypes())
            {
                foreach (var property in entityType.GetProperties())
                {
                    if (property.ClrType == typeof(DateTime))
                    {
                        property.SetValueConverter(new Microsoft.EntityFrameworkCore.Storage.ValueConversion.ValueConverter<DateTime, DateTime>(
                            v => DateTime.SpecifyKind(v, DateTimeKind.Utc),
                            v => DateTime.SpecifyKind(v, DateTimeKind.Utc)));
                    }
                    else if (property.ClrType == typeof(DateTime?))
                    {
                        property.SetValueConverter(new Microsoft.EntityFrameworkCore.Storage.ValueConversion.ValueConverter<DateTime?, DateTime?>(
                            v => v.HasValue ? DateTime.SpecifyKind(v.Value, DateTimeKind.Utc) : v,
                            v => v.HasValue ? DateTime.SpecifyKind(v.Value, DateTimeKind.Utc) : v));
                    }
                }
            }
        }
    }
}