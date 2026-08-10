# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Huellitas Vitales — veterinary clinic + pet marketplace platform. Two independent apps in one repo:

- `HuellasVitalesAPI/` — ASP.NET Core (.NET 10) REST API, EF Core over PostgreSQL (Supabase).
- `huellitas-frontend/` — React 19 + Vite 8 SPA.

Code, comments, identifiers, and API JSON keys are in **Spanish**. Match that when adding code.

## Commands

Backend (run from `HuellasVitalesAPI/`):

```bash
dotnet restore                                    # or: dotnet build HuellasVitalesAPI.slnx
dotnet run --project HuellasVitalesAPI            # http://localhost:5010, Swagger at /swagger
dotnet build --configuration Release
```

Frontend (run from `huellitas-frontend/`):

```bash
npm install
npm run dev       # http://localhost:5173
npm run lint      # oxlint (not ESLint), config in .oxlintrc.json
npm run build     # -> dist/
```

There is no test project or test runner in this repo yet.

## Local wiring

- **There is no local database.** `appsettings.json` holds a live Supabase connection string (committed), so `dotnet run` reads and writes the shared hosted schema directly. Nothing seeds or resets it — destructive queries hit everyone's data.
- Frontend reads `VITE_API_URL` from `huellitas-frontend/.env` (committed; `http://localhost:5010/api`). `src/api/config.js` exports it verbatim as `API_BASE` with **no fallback**, so a missing `.env` yields `undefined/marketplace/...` rather than a clear error. `API_BASE` **already includes `/api`** — append only the controller segment (`${API_BASE}/marketplace/catalogo`).
- `vite.config.js` also proxies `/api` to `localhost:5010`, but the app uses absolute `API_BASE` URLs, so the proxy is mostly unused. Its `cssMinify: 'esbuild'` override is load-bearing: Vite 8's default lightningcss fails on `@keyframes` inside the CSS Modules here.
- The API's CORS policy `PermitirFrontend` (Program.cs) only allows `http://localhost:5173` and `https://huellitas-vitales*.vercel.app`. A different dev port fails CORS until that predicate is updated.
- Frontend deploys to Vercel; backend is containerized via `HuellasVitalesAPI/HuellasVitalesAPI/Dockerfile`. Azure Pipelines (`azure-pipelines*.yml`) builds both and publishes artifacts — the triggers point at feature branches, not `main`.

## Backend architecture

Layering under `HuellasVitalesAPI/HuellasVitalesAPI/Backend/`: `Controllers/` (thin) → `Services/` (all business logic and EF queries) → `Data/ConexionDB.cs` (the single `DbContext`) → `Models/Entidades` + `Models/DTOs`.

Current API surface (all under `api/[controller]`):

| Controller | Endpoints |
|---|---|
| `Login` | `POST registrar`, `POST local`, `POST google`, `POST facebook` |
| `Usuario` | `GET {id}`, `PUT perfil` 🔒 |
| `Comercio` | `POST solicitud`, `GET buscar`, `GET pendientes` 🔒admin, `PUT {id}/aprobar` 🔒admin, `PUT {id}/rechazar` 🔒admin |
| `Marketplace` | `GET catalogo`, `GET buscar` |
| `Producto` | `POST` 🔒 |
| `Servicio` | `POST` 🔒 |
| `Carrito` | `POST agregar` 🔒 |

Things that will bite you:

- **Two root namespaces coexist.** Controllers, Services and Data use `HuellitasVitalesAPI.*` (with an `i`); Entities and DTOs use `HuellasVitalesAPI.Backend.Models.*` (no `i`). Neither matches the folder path. Copy the `using` block from a neighbouring file rather than trusting the IDE.
- **Services must be registered manually** in `Program.cs` (`AddScoped`). All seven current services are registered; a new one that isn't will throw at controller resolution, not at build. `MarketplaceService` is the only one behind an interface (`IMarketplaceService`) — the rest are injected as concrete types.
- **Database is Postgres via Npgsql**, even though `Microsoft.EntityFrameworkCore.SqlServer` is also referenced in the csproj. Ignore the SqlServer package.
- **No migrations.** The schema lives in Supabase and is mapped by hand: entities carry explicit `[Table("USUARIO")]` / `[Column("PRECIO_DESCUENTO")]` attributes, and most are *also* re-mapped with `ToTable` in `ConexionDB.OnModelCreating`. The attribute alone is sufficient (`TipoComercioCat` has no `OnModelCreating` entry and maps fine) — the duplication is historical. Adding a field means adding the `[Column]` attribute matching the real Supabase column name; don't run `dotnet ef migrations`.
- `OnModelCreating` force-converts every `DateTime` to `DateTimeKind.Utc` to avoid Npgsql's "Kind=Unspecified" error. Don't remove it.

### Controller ↔ service contract

Two conventions coexist; follow whichever the neighbouring endpoint uses.

- **Newer (`CarritoService`, `ComercioService`)** — the service returns a `(bool Exito, string Mensaje, int Codigo)` tuple carrying its own HTTP status, and the controller replays it: `StatusCode(resultado.Codigo, new { success = false, mensaje = resultado.Mensaje })`. Business rules pick the code (400 bad quantity, 404 missing product, 409 insufficient stock).
- **Older** — the service throws, the controller try/catches into `Ok`/`BadRequest`/`StatusCode(500)`.

Either way the body is `{ success, mensaje }`-shaped with Spanish `mensaje` strings, and services log via `ILogger<T>`.

## Database

`db/schema.sql` is a **read-only reference dump** of the Supabase schema — not executable, and not the source of truth. Update it by hand when the real schema changes; nothing regenerates it.

- **Identifiers are case-sensitive.** Postgres created these tables with quoted mixed-case names, so EF must match exactly. Column naming is inconsistent within the same table: mostly PascalCase (`IdUsuario`, `Precio`) but a handful are UPPER_SNAKE (`PRECIO_DESCUENTO`, `IMAGEN_URL`, `NOMBRE_COMERCIAL`, `RAZON_SOCIAL`, `FECHA_CREACION`, `FECHA_SOLICITUD`, `IDUSUARIO_RESOLVIO`, `FECHA_INGRESO`). Check `schema.sql` before naming a property — an unmapped mismatch fails at query time, not compile time.
- **`*_CAT` tables are lookup/enum tables** (`ROL`, `ESTADO_CUENTA_CAT`, `ESTADO_SOLICITUD_CAT`, `TIPO_SERVICIO_CAT`, `CATEGORIA_PRODUCTO_CAT`, `MARCA_CAT`, `ESPECIE_CAT`, `TIPO_PERSONA_CAT`, `TIPO_COMERCIO_CAT`, `CARGO_CAT`, `ESTADO_ORDEN_CAT`, `ESTADO_CITA_CAT`). Their ids are smallint FKs with `DEFAULT 1` on the owning row (a new `USUARIO` is `IdEstadoCuenta = 1`, a new `COMERCIO` is `IdEstadoSolicitud = 1`, a new `CITA` is `IdEstadoCita = 1`).
- **`USUARIO.IdUsuario` is `integer`, but `CARRITO.IdUsuario` and `ORDEN.IdUsuario` are `bigint`.** That inconsistency is why `Carrito.IdUsuario` is `long` and `CarritoController` parses the `sub` claim with `long.TryParse` while `UsuarioController` uses `int.TryParse`. Match whichever table you're touching.
- `smallint` columns are mapped as `byte` in some entities (`Usuario.IdRol`, `Producto.IdCategoria`, `Comercio.IdTipoComercio`) and `short` in others (`Servicio.IdTipoServicio`). Both round-trip fine for small lookup ids; `byte` will throw if a catalog ever exceeds 255 rows.
- Timestamp types are mixed: the original tables use `timestamp without time zone` (`USUARIO`, `COMERCIO`, `PRODUCTO`), the newer ones use `timestamp with time zone` (`CARRITO`, `CARRITO_ITEM`, `ORDEN`, `CITA`). The blanket UTC converter in `OnModelCreating` exists because of the former.
- `PRODUCTO.Activo` and `COMERCIO_FUNCIONARIO.Activo` are **nullable** in the DB (`boolean DEFAULT true`) but non-nullable `bool` in the entities — a NULL row will throw on materialization. `SERVICIO.Activo` and `MASCOTA.Activo` are correctly `NOT NULL`.

### Mapped vs. unmapped

`ConexionDB` exposes 13 `DbSet`s: `USUARIO`, `ROL`, `VETERINARIO`, `COMERCIO`, `PERSONA_LEGAL`, `PRODUCTO`, `CATEGORIA_PRODUCTO_CAT`, `SERVICIO`, `TIPO_SERVICIO_CAT`, `CARRITO`, `CARRITO_ITEM`, `MARCA_CAT`, `TIPO_COMERCIO_CAT`.

The other ~13 tables exist in Supabase with **no entity and no C# code yet**:

- Appointments: `MASCOTA`, `CITA`, `ESTADO_CITA_CAT`, `HORARIO_VETERINARIO` — matches the in-flight `CitaService.cs` / `Citacontroller.cs` / `SolicitudCitaRequest.cs` branches.
- Checkout: `ORDEN`, `ORDEN_DETALLE`, `ESTADO_ORDEN_CAT` — `CarritoController` can only add items; nothing reads, updates, or converts a cart to an order.
- Staff: `COMERCIO_FUNCIONARIO`, `CARGO_CAT` — the link between a user and the commerce they administer, which is why commerce-admin panels currently have no server-side ownership check.
- Lookups: `ESPECIE_CAT`, `TIPO_PERSONA_CAT`, `ESTADO_CUENTA_CAT`, `ESTADO_SOLICITUD_CAT`.

`MarketplaceService.ObtenerCatalogoCompletoAsync` LEFT-JOINs `MarcasCat` and falls back to `"Genérica"` for products with a null `IdMarca` — copy that join shape rather than reintroducing a hardcoded brand.

### Auth

- JWT bearer, signed with the symmetric `Jwt:Key` from `appsettings.json`. Issuer/audience validation is **off**; `NameClaimType` is `ClaimTypes.NameIdentifier`.
- `UsuarioService.GenerarTokenJWT` emits `sub` (user id), `email`, and a custom `rol` claim. Controllers read the id via `User.FindFirst("sub") ?? User.FindFirst(ClaimTypes.NameIdentifier)` — keep that fallback pattern.
- **Role checks are manual string comparisons inside actions**, not `[Authorize(Roles = ...)]`: `[Authorize]` proves the token is valid, then the action does `if (User.FindFirst("rol")?.Value != "1") return StatusCode(403, ...)` (see `ComercioController.AprobarComercio`). There is no role-claim-type wiring, so the attribute form would silently fail.
- Local passwords are BCrypt-hashed; Google (`Google.Apis.Auth`) and Facebook logins auto-provision users with `IdRol = 3`.
- Roles: `1` = admin, `2` = veterinario, `3` = cliente. Both `Login.jsx`'s `redirigirPorRol` and any new guard must use these numbers.
- `Program.cs` contains verbose `Console.WriteLine` JWT event logging (emoji-prefixed). It's intentional debug scaffolding.

## Frontend architecture

- Routing is a flat `<Routes>` list in `src/App.jsx`. **There is no auth guard or protected-route wrapper** — pages read `localStorage` themselves and redirect. Dashboards are chosen by role at login time, not by route protection.
- `src/pages/` = route-level screens, `src/components/` = shared and panel components (`Admin/`, `ComercioAdmin/` subfolders hold role-specific panels).
- Styling: Bootstrap 5 globally (imported in `App.jsx`) plus **CSS Modules** (`*.module.css`) colocated with each component. A few older pages use plain `.css` — prefer modules for new work.
- Data fetching is bare `fetch` in `useEffect`, no client library and no shared API wrapper beyond `API_BASE`. Search screens debounce via `src/hooks/useDebounce.js` and cancel in-flight requests with `AbortController` (see `Marketplace.jsx`).
- Feedback uses the local `components/Toast` + `useToast` hook, not `alert`.

### localStorage keys

Login writes exactly two keys: **`token_huellitas`** (JWT) and **`usuario_huellitas`** (JSON user object). Several files probe alternates (`jwt`, `token`, `huellitas_token`, `usuario`, `user`) as a fallback, and `Perfil.jsx` even falls back to user id `1` — that's drift, not a convention. Write the canonical two; read them first.

## Conventions worth keeping

- Controllers return Spanish-language `mensaje` strings; success responses often include `success: true`. Follow the shape of the neighbouring endpoint.
- Branch names in this repo are feature-scoped and merged into `main` via merge commits (e.g. `feature--CRUD_PRODUCTOS-INVENTARIO`, `Visualizacion/edicion_perfil_usuario`). Remote is Azure DevOps, not GitHub — `gh` will not work here.
