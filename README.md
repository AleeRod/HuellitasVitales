# 🐾 HUELLITAS VITALES

Una plataforma integral de gestión veterinaria que conecta clientes, veterinarios y personal en un solo lugar. Desde la reserva de citas hasta la gestión de historiales clínicos y la compra de productos para mascotas.

## 🎯 Descripción

Huellitas Vitales es un sistema moderno diseñado para revolucionar la forma en que se gestionan los servicios veterinarios. Facilita la comunicación entre propietarios de mascotas y profesionales veterinarios, optimizando procesos y mejorando la experiencia del cliente.

## ✨ Características Principales

- **📅 Reserva de Citas** – Los clientes pueden agendar, reprogramar o cancelar citas veterinarias en línea.
- **🛒 Marketplace** – Compra de productos para mascotas y reserva de servicios adicionales (grooming, boarding, etc.).
- **🐱 Gestión de Mascotas (CRUD)** – Crear, ver, actualizar y eliminar perfiles de mascotas, incluyendo historial médico completo.
- **📊 Dashboards Personalizados por Rol**
  - **Panel de Cliente**: Gestionar mascotas, citas y órdenes de compra.
  - **Panel Veterinario**: Ver agenda, gestionar registros de pacientes, actualizar notas de consulta.
  - **Panel de Personal**: Operaciones de recepción, asignación de citas e inventario.
- **📈 Reportes** – Generación de reportes sobre citas, ventas y rendimiento de la clínica.
- **🔒 Autenticación y Autorización** – Sistema seguro con tokens JWT y control de acceso basado en roles.

## 🏗️ Estructura del Proyecto

```
Huellitas Vitales/
├── HuellasVitalesAPI/          # Backend .NET Core
│   └── HuellasVitalesAPI/
├── huellitas-frontend/         # Frontend React/Vite
│   ├── src/
│   ├── public/
│   ├── index.html
│   └── vite.config.js
├── db/                         # Base de datos
│   └── schema.sql
├── Docs/                       # Documentación del proyecto
│   ├── Indice.md
│   ├── 01-Arquitectura/
│   ├── 02-Base-Datos/
│   ├── 03-Historias-Usuario/
│   ├── 04-Notas/
│   └── 05-Cierre-Proyecto/
├── dbcheck/                    # Verificación de BD
├── dbcheck2/                   # Verificación alternativa de BD
├── jwtcheck/                   # Validación de JWT
├── mcheck/                     # Validación de modelos
└── README.md
```

## 🛠️ Stack Tecnológico

| Componente  | Tecnología                |
|-------------|---------------------------|
| **Frontend** | React + Vite             |
| **Backend**  | .NET Core 6+             |
| **Base de Datos** | PostgreSQL (Supabase) |
| **Autenticación** | JWT                |
| **Deployment** | Vercel (Frontend) & Render (Backend) |
| **Documentación** | Markdown           |

## 🚀 Guía de Inicio Rápido

### Prerequisitos
- Node.js 16+
- .NET SDK 6+
- PostgreSQL 12+
- Git

### Instalación

```bash
# Clonar el repositorio
git clone <repo-url>
cd "Huellitas Vitales"

# Backend
cd HuellasVitalesAPI/HuellasVitalesAPI
dotnet restore
dotnet build
dotnet run

# Frontend (en otra terminal)
cd huellitas-frontend
npm install
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

## 👥 Roles y Permisos

| Rol              | Acceso                                                      |
|------------------|-------------------------------------------------------------|
| **Cliente**      | Reservar citas, comprar productos, gestionar mascotas      |
| **Veterinario**  | Ver agenda, gestionar registros, actualizar consultas      |
| **Personal**     | Operaciones de recepción, asignación de citas, inventario  |
| **Administrador**| Control total del sistema, gestión de usuarios              |

## 📚 Documentación

La documentación completa del proyecto se encuentra en la carpeta `Docs/`:

- **Arquitectura**: Diagramas de componentes y reglas generales
- **Base de Datos**: Modelo de datos y esquema
- **Historias de Usuario**: Requisitos y especificaciones funcionales
- **Notas**: Documentación técnica adicional
- **Cierre**: Información del cierre del proyecto

## 🔌 API Endpoints Principales

```
POST   /api/auth/login           # Autenticación
GET    /api/pets/{id}            # Obtener mascotas
POST   /api/appointments         # Crear cita
GET    /api/appointments         # Listar citas
PUT    /api/appointments/{id}    # Actualizar cita
DELETE /api/appointments/{id}    # Cancelar cita
```

## 🧪 Testing

```bash
# Backend
dotnet test

# Frontend
npm run test
```

## 🐛 Reporte de Issues

Si encuentras un bug o tienes una sugerencia, por favor abre un issue en el repositorio.

## 📄 Licencia

Este proyecto está bajo una licencia de desarrollo. Contacta a los desarrolladores para más información.

## 👨‍💻 Equipo de Desarrollo

- **Backend**: Desarrolladores .NET
- **Frontend**: Desarrolladores React
- **Base de Datos**: DBA PostgreSQL
- **QA**: Equipo de Quality Assurance

---

**Desarrollado con ❤️ para Huellitas Vitales**