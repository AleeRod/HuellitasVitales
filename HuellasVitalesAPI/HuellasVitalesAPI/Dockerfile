# Imagen base para ejecutar la API (.NET 8)
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 8080

# Imagen SDK para compilar
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["HuellasVitalesAPI/HuellasVitalesAPI/HuellasVitalesAPI.csproj", "HuellasVitalesAPI/"]
RUN dotnet restore "HuellasVitalesAPI/HuellasVitalesAPI.csproj"
COPY HuellasVitalesAPI/HuellasVitalesAPI/. .
RUN dotnet build "HuellasVitalesAPI.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "HuellasVitalesAPI.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "HuellasVitalesAPI.dll"]