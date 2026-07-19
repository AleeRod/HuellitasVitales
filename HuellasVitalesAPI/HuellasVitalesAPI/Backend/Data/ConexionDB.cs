using Microsoft.EntityFrameworkCore;
using HuellasVitalesAPI.Backend.Models.Entidades; // Aquí irán tus clases de usuario, etc.

namespace HuellitasVitalesAPI.Data
{
    public class ConexionDB : DbContext
    {
        public ConexionDB(DbContextOptions<ConexionDB> options) : base(options) { }

        // MAPEAR TABLAS DE DATOS
        public DbSet<Usuario> Usuarios { get; set; }
        public DbSet<Rol> Roles { get; set; }
        public DbSet<Veterinario> Veterinarios { get; set; }
        public DbSet<Producto> Productos { get; set; }
        
        public DbSet<CategoriaProductoCat> CategoriasProductoCat { get; set; }

        public DbSet<Comercio> Comercios { get; set; }

        public DbSet<PersonaLegal> PersonasLegales { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Usuario>().ToTable("USUARIO");
            modelBuilder.Entity<Rol>().ToTable("ROL");
            modelBuilder.Entity<Veterinario>().ToTable("VETERINARIO");
            modelBuilder.Entity<Comercio>().ToTable("COMERCIO");
            modelBuilder.Entity<PersonaLegal>().ToTable("PERSONA_LEGAL");
            modelBuilder.Entity<CategoriaProductoCat>().ToTable("CATEGORIA_PRODUCTO_CAT");
            modelBuilder.Entity<Producto>().ToTable("PRODUCTO");
        }
    }
}