using HuellitasVitalesAPI.Data;
using HuellitasVitalesAPI.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddOpenApi();
builder.Services.AddSwaggerGen();

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

        // 🔥 ESTO TE DICE LA RAZÓN REAL SI EL TOKEN FALLA
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var authHeader = context.Request.Headers["Authorization"].ToString();
                Console.WriteLine("🔍 AUTHORIZATION HEADER CRUDO: [" + authHeader + "]");
                return Task.CompletedTask;
            },
            OnAuthenticationFailed = context =>
            {
                Console.WriteLine("❌ JWT FALLÓ: " + context.Exception.GetType().Name + " - " + context.Exception.Message);
                return Task.CompletedTask;
            },
            OnChallenge = context =>
            {
                Console.WriteLine("⚠️ CHALLENGE: " + context.Error + " | " + context.ErrorDescription);
                return Task.CompletedTask;
            },
            OnTokenValidated = context =>
            {
                Console.WriteLine("✅ TOKEN OK. Claims: " + context.Principal?.Claims.Count());
                return Task.CompletedTask;
            }
        };
    });

// 3. Configurar Base de Datos
builder.Services.AddDbContext<ConexionDB>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// 4. Inyección de Dependencias
builder.Services.AddScoped<UsuarioService>();
builder.Services.AddScoped<ComercioService>();
builder.Services.AddScoped<IMarketplaceService, MarketplaceService>();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("PermitirFrontend");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();