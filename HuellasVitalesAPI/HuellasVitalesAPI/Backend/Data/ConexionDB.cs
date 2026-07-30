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

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Usuario>().ToTable("USUARIO");
            modelBuilder.Entity<Rol>().ToTable("ROL");
            modelBuilder.Entity<Veterinario>().ToTable("VETERINARIO");
            modelBuilder.Entity<Comercio>().ToTable("COMERCIO");
            modelBuilder.Entity<PersonaLegal>().ToTable("PERSONA_LEGAL");
        }
    }
}