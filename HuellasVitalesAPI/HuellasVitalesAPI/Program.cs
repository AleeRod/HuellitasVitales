using HuellitasVitalesAPI.Data;
using HuellitasVitalesAPI.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using QuestPDF.Infrastructure;
using System.Text;

// Licencia Community de QuestPDF: gratuita para proyectos como este (ingresos anuales bajos /
// uso educativo). Sin esto, cualquier PDF generado sale con una marca de agua.
QuestPDF.Settings.License = LicenseType.Community;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();

// Cambiamos AddOpenApi por SwaggerGen
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    // Habilita el botón "Authorize" de Swagger UI para probar
    // los endpoints marcados con [Authorize] sin salir del navegador.
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Pegá únicamente el token JWT, sin escribir 'Bearer' adelante."
    });

    options.AddSecurityRequirement(documento => new OpenApiSecurityRequirement
    {
        { new OpenApiSecuritySchemeReference("Bearer", documento), new List<string>() }
    });
});

// 1. Configurar CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("PermitirFrontend", policy =>
    {
        policy.SetIsOriginAllowed(origin =>
                origin == "http://localhost:5173" ||
                (origin.StartsWith("https://huellitas-vitales") && origin.EndsWith(".vercel.app"))
            )
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

// 2. Configurar Autenticación JWT
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!)),
            ValidateIssuer = false,
            ValidateAudience = false,
            ValidateLifetime = true,
            NameClaimType = System.Security.Claims.ClaimTypes.NameIdentifier
        };
    });

// 3. Configurar Base de Datos
builder.Services.AddDbContext<ConexionDB>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// 4. Inyección de Dependencias
builder.Services.AddScoped<UsuarioService>();
builder.Services.AddScoped<ComercioService>();
builder.Services.AddScoped<CarritoService>();
builder.Services.AddScoped<IMarketplaceService, MarketplaceService>();
builder.Services.AddScoped<ComercioValidacionService>();
builder.Services.AddScoped<ProductoService>();
builder.Services.AddScoped<ServicioService>();
builder.Services.AddScoped<OrdenService>();
builder.Services.AddScoped<ComercioFuncionarioService>();
builder.Services.AddScoped<AgendaService>();
builder.Services.AddScoped<CitaService>();
builder.Services.AddScoped<NotificacionService>();
builder.Services.AddScoped<TrasladoExpedienteService>();
builder.Services.AddScoped<AtencionExternaService>();
builder.Services.AddScoped<ExpedienteService>();
builder.Services.AddScoped<ExpedientePdfService>();
builder.Services.AddScoped<EmergenciaService>();
builder.Services.AddScoped<ReporteService>();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("PermitirFrontend");

app.UseStaticFiles();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
