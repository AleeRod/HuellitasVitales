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
        }
    }
}