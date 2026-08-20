using Microsoft.EntityFrameworkCore;
using HuellasVitalesAPI.Backend.Models.Entidades;

namespace HuellitasVitalesAPI.Data
{
    public class ConexionDB : DbContext
    {
        public ConexionDB(DbContextOptions<ConexionDB> options) : base(options) { }

        // MAPEAR TABLAS DE DATOS
        public DbSet<Usuario> Usuarios { get; set; } = null!;
        public DbSet<UsuarioProveedorAuth> UsuariosProveedoresAuth { get; set; } = null!;
        public DbSet<Rol> Roles { get; set; } = null!;
        public DbSet<Veterinario> Veterinarios { get; set; } = null!;
        public DbSet<Comercio> Comercios { get; set; } = null!;
        public DbSet<PersonaLegal> PersonasLegales { get; set; } = null!;
        public DbSet<Producto> Productos { get; set; } = null!;
        public DbSet<CategoriaProductoCat> CategoriasProductoCat { get; set; } = null!;
        public DbSet<Servicio> Servicios { get; set; } = null!;
        public DbSet<TipoServicioCat> TipoServicioCat { get; set; } = null!;
        public DbSet<Carrito> Carritos { get; set; } = null!;
        public DbSet<CarritoItem> CarritoItems { get; set; } = null!;
        public DbSet<MarcaCat> MarcasCat { get; set; } = null!;
        public DbSet<TipoComercioCat> TiposComercioCat { get; set; } = null!;
        public DbSet<Orden> Ordenes { get; set; } = null!;
        public DbSet<OrdenDetalle> OrdenDetalles { get; set; } = null!;
        public DbSet<CargoCat> CargosCat { get; set; } = null!;
        public DbSet<ComercioFuncionario> ComerciosFuncionarios { get; set; } = null!;
        public DbSet<PasswordResetToken> PasswordResetTokens { get; set; } = null!;
        public DbSet<EspecieCat> EspeciesCat { get; set; } = null!;
        public DbSet<Cita> Citas { get; set; } = null!;
        public DbSet<HorarioVeterinario> HorariosVeterinario { get; set; } = null!;
        public DbSet<EstadoCitaCat> EstadosCitaCat { get; set; } = null!;
        public DbSet<Mascota> Mascotas { get; set; } = null!;
        public DbSet<Expediente> Expedientes { get; set; } = null!;
        public DbSet<ExpedienteComercio> ExpedientesComercios { get; set; } = null!;
        public DbSet<SolicitudTrasladoExpediente> SolicitudesTrasladoExpediente { get; set; } = null!;
        public DbSet<Notificacion> Notificaciones { get; set; } = null!;
        public DbSet<AtencionExterna> AtencionesExternas { get; set; } = null!;
        public DbSet<DocumentoAtencionExterna> DocumentosAtencionExterna { get; set; } = null!;
        public DbSet<Emergencia> Emergencias { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Usuario>().ToTable("USUARIO");
            modelBuilder.Entity<UsuarioProveedorAuth>().ToTable("USUARIO_PROVEEDOR_AUTH");
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
            modelBuilder.Entity<PasswordResetToken>().ToTable("PASSWORD_RESET_TOKEN");
            modelBuilder.Entity<Orden>().ToTable("ORDEN");
            modelBuilder.Entity<OrdenDetalle>().ToTable("ORDEN_DETALLE");
            modelBuilder.Entity<TipoComercioCat>().ToTable("TIPO_COMERCIO_CAT");
            modelBuilder.Entity<CargoCat>().ToTable("CARGO_CAT");
            modelBuilder.Entity<ComercioFuncionario>().ToTable("COMERCIO_FUNCIONARIO");
            modelBuilder.Entity<EspecieCat>().ToTable("ESPECIE_CAT");
            modelBuilder.Entity<Cita>().ToTable("CITA");
            modelBuilder.Entity<HorarioVeterinario>().ToTable("HORARIO_VETERINARIO");
            modelBuilder.Entity<EstadoCitaCat>().ToTable("ESTADO_CITA_CAT");
            modelBuilder.Entity<Mascota>().ToTable("MASCOTA");
            modelBuilder.Entity<Expediente>().ToTable("EXPEDIENTE");
            modelBuilder.Entity<ExpedienteComercio>().ToTable("EXPEDIENTE_COMERCIO");
            modelBuilder.Entity<SolicitudTrasladoExpediente>().ToTable("SOLICITUD_TRASLADO_EXPEDIENTE");
            modelBuilder.Entity<Notificacion>().ToTable("NOTIFICACION");
            modelBuilder.Entity<AtencionExterna>().ToTable("ATENCION_EXTERNA");
            modelBuilder.Entity<DocumentoAtencionExterna>().ToTable("DOCUMENTO_ATENCION_EXTERNA");
            modelBuilder.Entity<Emergencia>().ToTable("EMERGENCIA");

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
