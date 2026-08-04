# 1. Imagen base de runtime (.NET 10)
FROM mcr.microsoft.com/dotnet/aspnet:10.0-preview AS base
WORKDIR /app
EXPOSE 8080

# 2. Imagen SDK para compilar (.NET 10)
FROM mcr.microsoft.com/dotnet/sdk:10.0-preview AS build
WORKDIR /src

# Copiar el archivo de proyecto y restaurar paquetes
COPY ["HuellasVitalesAPI/HuellasVitalesAPI/HuellasVitalesAPI.csproj", "HuellasVitalesAPI/"]
RUN dotnet restore "HuellasVitalesAPI/HuellasVitalesAPI.csproj"

# Copiar el resto del código fuente
COPY HuellasVitalesAPI/HuellasVitalesAPI/. ./HuellasVitalesAPI/
WORKDIR "/src/HuellasVitalesAPI"

# Compilar
RUN dotnet build "HuellasVitalesAPI.csproj" -c Release -o /app/out/build

# 3. Publicar
FROM build AS publish
RUN dotnet publish "HuellasVitalesAPI.csproj" -c Release -o /app/out/publish /p:UseAppHost=false

# 4. Imagen final
FROM base AS final
WORKDIR /app
COPY --from=publish /app/out/publish .
ENTRYPOINT ["dotnet", "HuellasVitalesAPI.dll"]