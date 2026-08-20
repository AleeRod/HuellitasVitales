# Reglas Generales de Arquitectura - Huellitas Vitales

## Resumen del Proyecto

**Huellitas Vitales** es una plataforma web para clínicas veterinarias y mercado de productos y servicios para mascotas (*pet marketplace*). El proyecto utiliza una arquitectura desacoplada basada en una API REST en el backend y una aplicación de página única (SPA) en el frontend.

---

## Arquitectura Principal

* **Frontend:** **React** (React 19) empaquetado y construido con **Vite** (Vite 8 SPA).
* **Backend:** **ASP.NET Core** REST API (.NET) estructurado en capas (Controllers, Services, Data/EF Core, Models y DTOs).

---

## Herramientas y Tecnologías Utilizadas

### Frontend
* **Framework / Librería:** React 19
* **Herramienta de Construcción (Bundler):** Vite 8
* **Estilos y UI:** Bootstrap 5 (estilos globales) y **CSS Modules** para componentes
* **Linter & Calidad de Código:** Oxlint (configurado en `.oxlintrc.json`)
* **Despliegue:** Vercel

### Backend
* **Framework:** ASP.NET Core REST API (.NET)
* **ORM / Acceso a Datos:** Entity Framework Core (EF Core)
* **Base de Datos:** PostgreSQL (alojado en **Supabase**) mediante el proveedor **Npgsql**
* **Contenedores:** Docker (`Dockerfile`)

### Autenticación y Seguridad
* **Autenticación:** JWT (JSON Web Tokens)
* **Encriptación de Contraseñas:** BCrypt
* **Autenticación Social:** Google OAuth (`Google.Apis.Auth`) y Facebook Auth

### Integración y Despliegue Continuo (CI/CD) y Control de Versiones
* **Control de Versiones:** Git / Azure DevOps
* **CI/CD:** Azure Pipelines (`azure-pipelines.yml`)

---

## Normas y Convenciones Generales
1. **Idioma:** Código, comentarios, identificadores y nombres de campos JSON de la API están redactados en **Español**.
2. **Estructura de Respuestas API:** La mayoría de las respuestas utilizan el formato `{ success: boolean, mensaje: string }`.
3. **Control de Accesos por Rol:**
   * `1` = Administrador
   * `2` = Veterinario
   * `3` = Cliente
   * `4` = Funcionario

