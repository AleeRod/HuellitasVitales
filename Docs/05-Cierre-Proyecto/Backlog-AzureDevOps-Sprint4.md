Backlog para cargar en Azure DevOps — Sprint 4

Este documento reúne **todo lo que se construyó en el Sprint 4** y que todavía no está cargado
en el tablero real (`dev.azure.com/ignaciopaucar0274/Huellitas Vitales`), respetando la
jerarquía real de su proyecto: **Epic → Feature → Product Backlog Item (PBI) → Task**, con
**Bug** como tipo aparte (ver nota de jerarquía más abajo). Se armó cruzando las capturas de su
árbol de Backlog y de su tablero de Sprint 4 contra el código real y contra las historias ya
documentadas en `Docs/03-Historias-Usuario/`.

**Cómo usar esto:** cada Product Backlog Item trae ya redactado Título, Effort, Business Value,
Tags, Descripción (formato Como/quiero/para que) y Criterios de aceptación, más sus Tasks
hijas — listo para pegar en el formulario de creación de Azure DevOps, respetando el Feature
(existente o nuevo) bajo el que hay que colgarlo. Los IDs que Azure les asigne al crearlos no
tienen que coincidir con ningún número de acá; los únicos IDs reales ya confirmados en sus
capturas son los Product Backlog Items **#294** y **#295**, y los Bugs **#211, #212, #213, #297,
#298**.

---

## Jerarquía de su proyecto (confirmada por las capturas del Backlog)

```
Epic
 └─ Feature
     └─ Product Backlog Item (PBI)   ← esto es lo que otros templates llaman "User Story"/Historia
         └─ Task                     ← tarea técnica concreta (endpoint, pantalla, validación...)

Bug   ← tipo independiente, no vive "dentro" de un PBI; se asocia a un Feature o queda directo
```

Importante para no confundir tipos al cargar esto: en el proceso de su proyecto (plantilla
**Scrum** de Azure DevOps) el nivel que trae la redacción "Como cliente, quiero..., para..." se
llama **Product Backlog Item**, no "Historia de Usuario" ni "User Story" (esos son los nombres
que usa la plantilla Agile, otro proceso). El contenido es el mismo formato; solo cambia la
etiqueta del tipo de Work Item. En este documento se usa **PBI** en los encabezados para que
coincida exactamente con lo que van a ver al crearlo en Azure.

También se confirmó la convención de nombres que ya venían usando: cada PBI lleva el prefijo del
número de Sprint en el título (ej. `3_CRUD de productos del Marketplace`,
`3_Agenda de Veterinarios para Consultas, Grooming y Procedimientos`). Todos los PBI nuevos de
abajo ya vienen con el prefijo `4_` para mantener esa misma convención.

---

## Equipo Scrum

Inferido del historial real de commits del repositorio (autor y volumen de aportes) — **confirmen
o ajusten los roles si no coinciden con cómo se organizaron realmente**, esto es una propuesta
razonable, no un dato verificado con el equipo.

| Integrante | Rol sugerido | Nota |
|---|---|---|
| Daniel Umaña Madriz | Scrum Master | Menor volumen de commits de código; encaja con un rol más de facilitación/proceso que de desarrollo directo. |
| Javier Powers Abarca | Developer (Full-Stack) | Mayor volumen de commits del equipo; backend y frontend por igual. |
| Brandon Alfaro Araya | Developer (Full-Stack) | Backend (servicios, endpoints) y frontend por igual. |
| Ignacio Paucar Arguedas | Developer (Full-Stack) | Dueño/creador del proyecto en Azure DevOps; backend y frontend. |
| Alejandro Rodríguez Chacón | Developer (Full-Stack) | Backend y frontend por igual. |

Product Owner: el profesor del curso (rol externo al equipo, según las reglas de la actividad).

---

## Mapeo Epic → Feature → PBI (dónde cuelga cada cosa nueva)

Su árbol actual de Backlog, con lo que hay que **agregar** marcado explícitamente. Los Features
marcados 🆕 no existen todavía en su tablero y hay que crearlos; el resto ya existe (vacío o con
otros PBI de Sprints anteriores adentro) y solo se le agrega el PBI nuevo como hijo.

```
Epic: Gestión Operativa de Comercios                                    (ya existe)
 ├─ Feature: Gestión de Expedientes Veterinarios                        (ya existe, vacío)
 │   ├─ PBI 4_Expediente Clínico Digital de la Mascota                  🆕 nuevo
 │   └─ PBI 4_Exportar el Expediente en PDF                             🆕 nuevo
 ├─ Feature: Registro de Atenciones Externas                            (ya existe, vacío)
 │   └─ PBI 4_Registro de Atenciones Externas                          🆕 nuevo
 ├─ Feature: Atención de Emergencias Veterinarias                       (ya existe, vacío)
 │   └─ PBI 4_Atención de Emergencias Veterinarias                     🆕 nuevo
 ├─ Feature: Traslado de Expedientes entre Veterinarias                 🆕 Feature nuevo
 │   └─ PBI #294 (ya existe, vacío) → llenar con 4_Traslado de Expediente entre Veterinarias
 │       (recomendación: fusionar el PBI #295 "Aceptación del traslado" dentro de este mismo,
 │       ver nota en su sección más abajo)
 ├─ Feature: Notificaciones Internas y Alertas                          🆕 Feature nuevo
 │   └─ PBI 4_Notificaciones Internas con Redirección                  🆕 nuevo
 ├─ Feature: Gestión de Inventario de Comercios                         (ya existe, con PBI de Sprint 3)
 ├─ Feature: Gestión de Servicios de Comercios                          (ya existe, con PBI de Sprint 3)
 └─ Feature: Agenda y Programación de Citas                             (ya existe, con PBI de Sprint 3)
     └─ PBI 4_CRUD Completo de Citas del Cliente (Mis Citas)            🆕 nuevo

Epic: Portal Público y Experiencia del Cliente                          (ya existe)
 ├─ Feature: Interfaz Pública y Marketing                               (ya existe)
 │   └─ PBI 4_Landing Page Conectada al Marketplace Real                🆕 nuevo
 ├─ Feature: Buscador del Marketplace                                   (ya existe, sin cambios)
 ├─ Feature: Conversión y Registro desde Checkout                       (ya existe, sin cambios)
 └─ Feature: Carrito de Compras y Checkout                              (ya existe)
     └─ PBI 4_Historial de Compras y Recibo Interno de Orden            🆕 nuevo

Epic: 2. Gestión de Accesos e Identidades                               (ya existe)
 ├─ Feature: Módulo de Autenticación Multitipo (Login)                  (ya existe, sin cambios directos)
 ├─ Feature: Registro Autónomo de Clientes                              (ya existe, sin cambios)
 ├─ Feature: Módulos Principales y Paneles por Rol (Dashboard)          (ya existe)
 │   └─ PBI 4_Panel Clínico del Veterinario con Datos Reales            🆕 nuevo
 ├─ Feature: Gestión de perfiles de usuario                             (ya existe, sin PBI nuevo directo)
 ├─ Feature: Seguridad y Recuperación de Cuenta                         🆕 Feature nuevo
 │   └─ PBI 4_Verificación por Correo al Cambiar/Recuperar Contraseña   🆕 nuevo
 ├─ Feature: Onboarding y Registro de Comercios                         (ya existe, sin cambios)
 └─ Feature: Administración y Supervisión de Comercios                  🆕 Feature nuevo
     └─ PBI 4_Gestión Completa de Comercios Afiliados (Admin)           🆕 nuevo

Epic: 1. Infraestructura y Configuración Inicial                        (sin cambios este Sprint)

Epic: Gestión de Expedientes Veterinarios (top-level, fila 1, sin hijos)
 ⚠️ Mismo nombre exacto que el Feature de arriba, dentro de "Gestión Operativa de Comercios".
    Probable duplicado — decidan si se borra este Epic suelto o si tenía otro propósito.
```

**Resumen: 4 Features nuevos que crear** (Traslado de Expedientes entre Veterinarias,
Notificaciones Internas y Alertas, Seguridad y Recuperación de Cuenta, Administración y
Supervisión de Comercios) y **11 PBI nuevos**, todos con su descripción completa abajo.

---

## PBI existentes que solo faltaba llenar/cerrar

- **PBI #294 "Traslado de expediente entre veterinarias"** — está creado en el tablero pero
  vacío (sin descripción ni tareas). Usar el contenido de **"4_Traslado de Expediente entre
  Veterinarias"** de abajo para completarlo.
- **PBI #295 "Aceptación del traslado por la veterinaria"** — también vacío. Los criterios de
  aceptación del PBI #294 ya cubren tanto la solicitud como la aceptación/rechazo en un solo
  flujo coherente; se recomienda **cerrar el #295 como duplicado** del #294 en vez de mantener
  dos PBI para la misma pieza de valor. Si el equipo prefiere mantenerlos separados por
  trazabilidad, los criterios de "quién puede resolver la solicitud" y "qué pasa al
  aceptar/rechazar" (ver PBI #294 abajo) son los que le corresponden específicamente al #295.
- **Tasks #174, #177, #178** (Feature "Gestión de Servicios de Comercios", PBI de Sprint 3
  `3_CRUD de Servicios Veterinarios`) — aparecían "To Do" en la captura del tablero de Sprint 4;
  esto era justamente el objetivo "Pendientes de SP03" del Sprint 4. Ya se completaron dentro de
  este Sprint (confirmado en el código real) — marcarlas **Done** junto con el PBI padre.
- **Bugs #211, #212, #213, #297, #298** — ya existen en el tablero, no se duplican acá. Los bugs
  nuevos detectados y corregidos en este Sprint están en su propia sección, más abajo.

---

## Product Backlog Items nuevos

### 4_Expediente Clínico Digital de la Mascota

- **Feature:** Gestión de Expedientes Veterinarios · **Estado:** Done
- **Effort:** 8 · **Business Value:** 95 · **Value Area:** Business
- **Tags:** Backend, Frontend, Expedientes, Sprint4

**Descripción**
Como cliente, quiero que mi mascota tenga un expediente clínico digital que se abra
automáticamente, para no tener que crearlo a mano y para que cualquier veterinaria con acceso
vigente pueda ver su historial real (traslados, atenciones externas, emergencias) sin depender
de papeles sueltos.

**Criterios de aceptación**
- Al consultar el expediente de una mascota que ya tuvo al menos una cita, se crea automáticamente si no existía, anclado a la veterinaria de la cita más reciente.
- Si la mascota nunca tuvo cita, se puede abrir eligiendo una veterinaria puntual, o sin elegir ninguna (para Atenciones Externas).
- El detalle muestra: mascota, veterinaria actual (o "Sin asignar"), historial de veterinarias con permisos y vigencia, atenciones externas y emergencias.
- Solo pueden consultarlo: el dueño (solo lectura), un Administrador (lectura y escritura), o una veterinaria con acceso vigente.
- Solo una veterinaria con permiso de modificación vigente puede escribir sobre el expediente.
- Un expediente pertenece a una única mascota (no se duplican).

**Tasks**
1. Crear endpoint API (GET) para consultar/crear automáticamente el expediente de una mascota — Done
2. Crear endpoint API (POST) para abrir un expediente eligiendo veterinaria, y variante sin veterinaria — Done
3. Implementar el control de acceso por rol y vigencia (dueño / Admin / veterinaria con permiso) — Done
4. Diseñar `ExpedienteBadge.jsx` (tarjeta compacta reutilizable) y `MascotaChips.jsx` (selector de mascota) — Done
5. Conectar el detalle del expediente en las 3 pantallas que lo usan (Traslado, Atenciones Externas, Emergencia) — Done

Vínculo Docs: [[HU-200-Expediente-Clinico-Digital]]

---

### 4_Traslado de Expediente entre Veterinarias

*(llenar el PBI #294 ya existente en el tablero con este contenido)*

- **Feature:** Traslado de Expedientes entre Veterinarias 🆕 · **Estado:** Done
- **Effort:** 8 · **Business Value:** 85 · **Value Area:** Business
- **Tags:** Backend, Frontend, Expedientes, Notificaciones, Sprint4

**Descripción**
Como cliente, quiero poder solicitar que el expediente de mi mascota se traslade a otra
veterinaria y que la veterinaria receptora lo apruebe o lo rechace, para poder cambiarme de
clínica sin perder el historial clínico, y sin que ninguna veterinaria reciba acceso a mi
mascota sin haberlo aceptado antes.

**Criterios de aceptación**
- El cliente puede solicitar el traslado a cualquier veterinaria aprobada distinta a la actual, con motivo opcional; un Administrador puede solicitarlo por cualquier mascota.
- No se puede solicitar si el expediente no tiene veterinaria asignada todavía.
- No puede haber más de una solicitud Pendiente a la vez para el mismo expediente.
- Solo alguien de la veterinaria destino (dueño, funcionario activo o Administrador) puede resolver la solicitud (aceptar/rechazar), con respuesta escrita opcional.
- Si el expediente cambió de veterinaria mientras la solicitud seguía pendiente, se rechaza la resolución con un error de conflicto.
- Al aceptar: en una sola transacción, la veterinaria de origen pasa a solo consulta, la destino queda con acceso vigente completo, y el expediente pasa a tener esa veterinaria como actual.
- Al rechazar, el expediente no cambia y el cliente puede volver a solicitar.
- El cliente puede ver el historial de todas sus solicitudes enviadas; la veterinaria destino ve las suyas pendientes.
- Se notifica a los responsables de la veterinaria destino al recibir la solicitud, y al cliente cuando se resuelve.

**Tasks**
1. Crear endpoint API (POST) para solicitar el traslado de un expediente — Done
2. Crear endpoint API (PUT) para aceptar/rechazar una solicitud, con transacción explícita — Done
3. Crear endpoint API (GET) para listar solicitudes pendientes por veterinaria y el historial propio del cliente — Done
4. Diseñar `TrasladarExpediente.jsx` (Cliente, con selector de veterinaria destino) — Done
5. Diseñar `PanelSolicitudesTraslado.jsx` (Veterinario/Admin/Funcionario, aceptar/rechazar) — Done
6. Integrar la notificación automática al solicitar y al resolver (depende del PBI de Notificaciones) — Done

Vínculo Docs: [[HU-201-Traslado-Expediente]]

---

### 4_Registro de Atenciones Externas

- **Feature:** Registro de Atenciones Externas · **Estado:** Done
- **Effort:** 5 · **Business Value:** 70 · **Value Area:** Business
- **Tags:** Backend, Frontend, Expedientes, Sprint4

**Descripción**
Como cliente, quiero registrar en el expediente de mi mascota las consultas que le hicieron
fuera de Huellitas Vitales, adjuntando el comprobante, para tener un historial clínico completo
en un solo lugar sin importar dónde la atendieron.

**Criterios de aceptación**
- Se puede registrar indicando veterinaria/establecimiento y motivo (obligatorios); profesional, fecha, diagnóstico y tratamiento (opcionales salvo la fecha).
- Veterinaria y profesional son texto libre, no ligados a ninguna veterinaria de la plataforma.
- La fecha de atención no puede estar en el futuro.
- Si la mascota no tiene expediente, se abre automáticamente sin pedir veterinaria.
- Se pueden adjuntar comprobantes (PDF/JPG/PNG/WEBP, máx. 10 MB cada uno), validando tipo y tamaño.
- Se puede ver el historial ordenado por fecha más reciente, con los adjuntos para descargar.
- Solo el dueño de la mascota puede registrar o adjuntar en su propio expediente (sin excepción para Admin ni veterinarias).

**Tasks**
1. Crear endpoint API (POST) para registrar una atención externa — Done
2. Crear endpoint API (POST) para adjuntar comprobantes, con validación de tipo/tamaño — Done
3. Crear endpoint API (GET) para listar atenciones externas con sus adjuntos — Done
4. Diseñar `AtencionesExternas.jsx` con zona de arrastrar-y-soltar para los comprobantes — Done

Vínculo Docs: [[HU-202-Atenciones-Externas]]

---

### 4_Atención de Emergencias Veterinarias

- **Feature:** Atención de Emergencias Veterinarias · **Estado:** Done
- **Effort:** 13 · **Business Value:** 100 · **Value Area:** Business
- **Tags:** Backend, Frontend, Expedientes, Notificaciones, Sprint4

**Descripción**
Como cliente, quiero solicitar atención veterinaria inmediata para mi mascota con el mínimo de
fricción posible, para conseguir ayuda lo antes posible sin tener que elegir una clínica en el
peor momento. Como veterinario, quiero ver y aceptar las solicitudes de emergencia que le
corresponden a mi clínica (o abiertas a todas), y comunicarme directo con quien la pidió.

**Criterios de aceptación**
- El cliente inicia la solicitud manteniendo presionado un botón de emergencia 1.4 s (con animación), no con un clic simple, para evitar disparos accidentales.
- Elige mascota, ubicación, motivo (con opciones rápidas) y descripción opcional.
- Por defecto se envía en broadcast a todas las veterinarias aprobadas; opcionalmente a una puntual.
- Si la mascota no tiene expediente, se abre solo, sin bloquear al cliente.
- El teléfono de contacto se autocompleta desde el perfil, o se pide y se guarda.
- El cliente ve el historial completo con filtros Todas/Activas/Finalizadas, y puede cerrarla él mismo si consiguió atención por su cuenta.
- Un Veterinario/Admin ve sus pendientes (dirigidas a su clínica + broadcast); solo Veterinario o Admin pueden aceptar (Funcionario la ve pero no puede tomarla — limitación conocida).
- La primera clínica que acepta una emergencia en broadcast la "reclama"; deja de estar disponible para las demás.
- Solo quien la aceptó (o Admin) puede avanzarla a "En atención" y "Finalizada" (con diagnóstico y tratamiento).
- Se notifica a la(s) veterinaria(s) al recibirla, y al cliente al aceptarse/iniciarse/finalizarse.

**Tasks**
1. Crear endpoint API (POST) para solicitar una emergencia (broadcast o veterinaria puntual) — Done
2. Crear endpoint API (PUT) para aceptar/avanzar/finalizar una emergencia — Done
3. Crear endpoint API (GET) para listar pendientes por veterinaria y el historial del cliente — Done
4. Diseñar el botón de "mantené presionado" con animación SVG y el modal de solicitud (`SolicitarEmergencia.jsx`) — Done
5. Diseñar `PanelEmergencias.jsx` (veterinario), con link `tel:` al contacto — Done
6. Integrar la notificación automática en cada cambio de estado (depende del PBI de Notificaciones) — Done

Vínculo Docs: [[HU-203-Emergencia-Veterinaria]] (incluye limitación conocida documentada en Mejora-04)

---

### 4_Exportar el Expediente en PDF

- **Feature:** Gestión de Expedientes Veterinarios · **Estado:** Done
- **Effort:** 3 · **Business Value:** 50 · **Value Area:** Business
- **Tags:** Backend, Frontend, Expedientes, Sprint4

**Descripción**
Como cliente, quiero poder descargar el expediente clínico de mi mascota en PDF, para tener un
documento propio que pueda guardar o llevar a cualquier veterinaria, incluso una que no esté
afiliada a la plataforma.

**Criterios de aceptación**
- El PDF incluye: mascota, veterinaria actual, historial de veterinarias con vigencia, atenciones externas y emergencias.
- Si algún dato no existe, el PDF lo indica claramente ("Sin asignar", "Sin movimientos registrados") en vez de fallar o inventar.
- Solo puede exportarlo quien tiene permiso de consulta sobre el expediente (mismo control que ver el detalle).
- El archivo se descarga con un nombre que incluye el de la mascota.

**Tasks**
1. Crear endpoint API (GET) para exportar el expediente en PDF — Done
2. Integrar la librería de generación de PDF (QuestPDF) reutilizando la consulta del detalle — Done
3. Conectar el botón "Descargar expediente en PDF" en la pantalla de Traslado — Done

Vínculo Docs: [[HU-204-Exportar-Expediente-PDF]]

---

### 4_Notificaciones Internas con Redirección

- **Feature:** Notificaciones Internas y Alertas 🆕 · **Estado:** Done
- **Effort:** 5 · **Business Value:** 75 · **Value Area:** Business
- **Tags:** Backend, Frontend, Notificaciones, Sprint4

**Descripción**
Como usuario de la plataforma (cliente, veterinario, administrador o funcionario), quiero
recibir una notificación real cuando pase algo que me corresponde atender, y poder ir directo a
esa sección al tocarla, para no tener que revisar manualmente cada panel.

**Criterios de aceptación**
- Se genera notificación real ante: solicitud/aceptación/inicio/fin de emergencia, y solicitud/resolución de traslado.
- La campanita (presente en todos los paneles) revisa novedades cada 60 segundos sin recargar.
- Muestra contador de no leídas (tope visual "9+") y las últimas 50, no leídas primero.
- Al tocar una, se marca leída y redirige a la sección relacionada según tipo y rol, incluso si ya está en el panel pero en otra pestaña.
- Si el token expiró, la campanita lo detecta y redirige a login limpiando la sesión.

**Tasks**
1. Crear endpoint API (POST interno) para generar notificaciones desde Traslado/Emergencia — Done
2. Crear endpoint API (GET) para listar y (PUT) marcar como leída — Done
3. Diseñar `NotificacionesBell.jsx` compartido por todos los paneles, con polling cada 60s — Done
4. Implementar la redirección por tipo + rol (`rutaDestino`) y el soporte de deep-link (`?vista=`/`?seccion=`) en los paneles con pestañas — Done
5. Corregir el posicionamiento del dropdown (ver Bug relacionado más abajo) — Done

Vínculo Docs: [[HU-205-Notificaciones-Internas]]

---

### 4_Panel Clínico del Veterinario con Datos Reales

- **Feature:** Módulos Principales y Paneles por Rol (Dashboard) · **Estado:** Done
- **Effort:** 5 · **Business Value:** 80 · **Value Area:** Business
- **Tags:** Backend, Frontend, Sprint4

**Descripción**
Como veterinario, quiero que mi panel clínico muestre mi agenda, mis pacientes y mis pendientes
reales, y poder cerrar una cita con una nota clínica, para tener un panel de trabajo diario
confiable en vez de una maqueta con números fijos.

**Criterios de aceptación**
- Muestra en tiempo real: citas de hoy, pacientes atendidos hoy, traslados y emergencias pendientes dirigidos a su veterinaria.
- Los indicadores de pendientes llevan directo a esa pestaña al tocarlos.
- Lista de citas de hoy con estado real; se puede completar una cita con nota clínica opcional (solo el veterinario asignado o Admin).
- Historial clínico reciente real (últimas citas completadas), y lista de pacientes propios con especie, visitas y última fecha.
- Cerrar sesión limpia el `localStorage` y redirige a la página principal real (antes apuntaba a una ruta inexistente).
- Las secciones sin datos reales ("Expedientes", "Vacunas") muestran "Próximamente" en vez de ser enlaces muertos.

**Tasks**
1. Crear endpoint API (PUT) para completar una cita con nota clínica — Done
2. Conectar los indicadores del panel (citas, pacientes, pendientes) a datos reales — Done
3. Reemplazar las estadísticas y el historial hardcodeados por datos reales derivados de la agenda — Done
4. Corregir el enlace de "Cerrar sesión" (ruta inexistente) para que limpie sesión y redirija a `/` — Done

Vínculo Docs: [[HU-206-Panel-Veterinario-Funcional]]

---

### 4_Gestión Completa de Comercios Afiliados (Admin)

- **Feature:** Administración y Supervisión de Comercios 🆕 · **Estado:** Done
- **Effort:** 8 · **Business Value:** 85 · **Value Area:** Business
- **Tags:** Backend, Frontend, Admin, Sprint4

**Descripción**
Como administrador, quiero ver y gestionar todos los comercios afiliados a la plataforma —no
solo las solicitudes pendientes de aprobar—, para poder aprobar, rechazar, editar o dar de baja
cualquier comercio desde un mismo lugar.

**Criterios de aceptación**
- La sección "Solicitudes" pasa a llamarse "Comercios", con pestañas "Solicitudes pendientes" y "Todos los comercios".
- "Solicitudes pendientes" mantiene la aprobación/rechazo ya existente, ahora con el sistema visual del resto del panel.
- "Todos los comercios" lista cada comercio con buscador y filtro por estado.
- Modal de detalle completo de un comercio, sin salir de la lista.
- El administrador puede editar los datos de un comercio existente.
- El administrador puede eliminar/dar de baja un comercio, con confirmación previa (reemplaza `window.confirm`).
- Al eliminar, el comercio deja de aparecer en el marketplace de inmediato.
- Toda acción usa el sistema de notificaciones (`Toast`) del proyecto, no `alert()`.

**Tasks**
1. Crear endpoint API (GET) para listar todos los comercios con filtros de búsqueda/estado — Done
2. Crear endpoint API (PUT) para editar un comercio existente — Done
3. Diseñar la pestaña "Todos los comercios" con el sistema visual del panel Admin — Done
4. Diseñar el modal de detalle y el modal de edición — Done
5. Reemplazar `window.confirm`/`alert` por el modal de confirmación y `Toast` del proyecto — Done

Vínculo Docs: [[HU-207-Gestion-Comercios-Admin]] (incluye limitación conocida documentada en Mejora-08)

---

### 4_CRUD Completo de Citas del Cliente (Mis Citas)

- **Feature:** Agenda y Programación de Citas · **Estado:** Done
- **Effort:** 5 · **Business Value:** 80 · **Value Area:** Business
- **Tags:** Frontend, Citas, Sprint4

**Descripción**
Como cliente, quiero poder agendar, reprogramar y cancelar mis citas desde una sola pantalla
("Mis citas"), para gestionar toda mi agenda veterinaria sin depender de volver al Dashboard.

**Criterios de aceptación**
- Se puede agendar una cita nueva desde "Mis citas" (antes solo existía en el Dashboard).
- Se puede reprogramar una cita Pendiente/Confirmada con disponibilidad real del veterinario.
- Se puede cancelar una cita Pendiente/Confirmada, con confirmación previa.
- Una cita Cancelada/Completada no ofrece esas acciones.
- El resultado de cada acción se muestra con `Toast` y la lista se refresca sola.
- El nombre/raza de la mascota se muestra correctamente sin importar PascalCase/camelCase del backend.

**Tasks**
1. Conectar "Mis citas" con el modal de agendar ya existente (`AgendarCitaModal`) — Done
2. Implementar la acción de reprogramar, reutilizando la disponibilidad real del veterinario — Done
3. Implementar la acción de cancelar, con modal de confirmación — Done
4. Corregir el mapeo de campos de mascota (PascalCase/camelCase) al mostrar nombre/raza — Done

Vínculo Docs: [[HU-208-CRUD-Citas-Cliente]]

---

### 4_Verificación por Correo al Cambiar/Recuperar Contraseña

- **Feature:** Seguridad y Recuperación de Cuenta 🆕 · **Estado:** Done
- **Effort:** 5 · **Business Value:** 90 · **Value Area:** Business
- **Tags:** Backend, Frontend, Seguridad, Sprint4

**Descripción**
Como usuario de la plataforma, quiero que cualquier cambio de mi contraseña —tanto si la olvidé
como si la cambio ya autenticado— me pida confirmarlo desde mi correo antes de aplicarse, para
que nadie pueda cambiarla en mi nombre.

**Criterios de aceptación**
- "Olvidé mi contraseña" nunca devuelve el token en la respuesta; lo envía solo por correo.
- La respuesta es siempre el mismo mensaje genérico, exista o no la cuenta.
- Cambiar la contraseña autenticado ya no la cambia directo: valida la actual (si tenía) y dispara el mismo correo de verificación.
- El cambio real se completa solo al hacer clic en el enlace del correo y definir la nueva contraseña.
- El enlace expira a los 30 minutos y es de un solo uso.
- Una cuenta de Google/Facebook sin contraseña propia puede pedir el mismo correo para establecer su primera contraseña.
- El correo realmente sale (SMTP configurado y probado con envío real) y respeta el tema visual del proyecto.

**Tasks**
1. Crear `IEmailService`/`EmailService` (SMTP) y configurar las credenciales reales — Done
2. Eliminar el endpoint antiguo de cambio directo de contraseña autenticado — Done
3. Crear endpoint API (POST) para solicitar la verificación de cambio de contraseña autenticado — Done
4. Diseñar la página `RestablecerPassword.jsx`, reutilizada por ambos flujos — Done
5. Actualizar los modales de "Cambiar contraseña" en Configuración y Perfil para pedir solo la contraseña actual — Done

Vínculo Docs: [[HU-209-Verificacion-Cambio-Password]]

---

### 4_Historial de Compras y Recibo Interno de Orden

- **Feature:** Carrito de Compras y Checkout · **Estado:** Done
- **Effort:** 5 · **Business Value:** 75 · **Value Area:** Business
- **Tags:** Backend, Frontend, Marketplace, Sprint4

**Descripción**
Como cliente, quiero ver el historial de todas mis compras y poder abrir el recibo de cada una,
para tener un registro de qué compré, cuándo y por cuánto.

**Criterios de aceptación**
- "Mis compras" lista todas las órdenes completadas del cliente, con fecha, estado, total y método de pago.
- Se puede abrir el recibo/factura de cualquier orden, con detalle línea por línea y totales.
- El checkout permite elegir un método de pago (simulado) que queda guardado en la orden.
- Si una orden anterior no tiene método de pago guardado, la pantalla lo indica sin fallar.

**Tasks**
1. Crear endpoint API (GET) para listar las órdenes del cliente autenticado — Done
2. Crear endpoint API (GET) para obtener el detalle/factura de una orden puntual — Done
3. Agregar la columna `MetodoPago` a `ORDEN` y conectar el selector del checkout — Done
4. Diseñar `MisCompras.jsx` y `Factura.jsx` — Done

Vínculo Docs: [[HU-210-Historial-Compras-Recibo]]

---

### 4_Landing Page Conectada al Marketplace Real

- **Feature:** Interfaz Pública y Marketing · **Estado:** Done
- **Effort:** 3 · **Business Value:** 65 · **Value Area:** Business
- **Tags:** Frontend, Marketplace, Sprint4

**Descripción**
Como visitante de la página principal, quiero ver productos reales del marketplace en la
promoción de la Landing Page, y que el botón de "Crear perfil de mascota gratis" me lleve al
lugar correcto según si ya tengo cuenta o no.

**Criterios de aceptación**
- La promoción del marketplace en la Landing Page muestra productos reales (nombre, precio, imagen), no datos de ejemplo.
- Se puede agregar un producto al carrito desde esa promoción, igual que desde el Marketplace completo.
- "Crear perfil de mascota gratis": con sesión iniciada, lleva a agregar mascota; sin sesión, lleva a registrarse.
- Las notificaciones de esa promoción se muestran siempre por encima del navbar fijo, sin quedar tapadas.

**Tasks**
1. Conectar `MarketplacePromo.jsx` al catálogo real del marketplace — Done
2. Implementar la detección de sesión y redirección condicional en `PetPromo.jsx` — Done
3. Corregir el posicionamiento del Toast en la Landing Page (ver Bug relacionado) — Done

Vínculo Docs: [[HU-211-Landing-Marketplace-Real]]

---

## Bugs nuevos (detectados y corregidos en Sprint 4)

*(no confundir con los Bugs #211, #212, #213, #297, #298 que ya existen en su tablero)*

### Bug — Error 500 al completar una compra (`POST /api/orden`)
- **Estado:** Done (Resuelto) · **Prioridad:** Alta
- **Feature relacionado:** Carrito de Compras y Checkout
- **Pasos para reproducir:** agregar un producto al carrito → ir al checkout → completar la compra.
- **Comportamiento esperado:** la orden se crea y aparece en "Mis compras".
- **Comportamiento real:** `POST /api/orden` devolvía `500 Internal Server Error`.
- **Causa raíz:** faltaba la columna `ORDEN.MetodoPago` en la base de datos real de Supabase — el código ya la esperaba (EF) pero nunca se corrió el `ALTER TABLE` correspondiente.
- **Solución:** se corrió `ALTER TABLE public."ORDEN" ADD COLUMN "MetodoPago" varchar NULL;` contra la Supabase real; verificado que la columna existe y el checkout vuelve a funcionar.
- Vínculo Docs: [[MEJORAS]] (Mejora-07)

### Bug — Ícono de lupa de los buscadores mal posicionado
- **Estado:** Done (Resuelto) · **Prioridad:** Media
- **Feature relacionado:** Módulos Principales y Paneles por Rol (Dashboard)
- **Comportamiento real:** el ícono de búsqueda (`<Search>` de lucide-react, un `<svg>`) se renderizaba en flujo normal por encima del campo de texto en vez de quedar dentro de él, en varias pantallas del panel de Administración.
- **Causa raíz:** los selectores CSS (`.searchField span`, `.topSearch span`) apuntaban a un elemento `<span>` que el ícono real no usa.
- **Solución:** se agregó `svg` a esos selectores, igual que ya estaba resuelto correctamente en `PanelProductos.module.css`.

### Bug — El dropdown de notificaciones se renderiza detrás del topbar (panel Admin)
- **Estado:** Done (Resuelto) · **Prioridad:** Media
- **Feature relacionado:** Notificaciones Internas y Alertas 🆕
- **Comportamiento real:** al abrir la campanita de notificaciones, el menú desplegable quedaba parcialmente tapado por la barra superior del panel.
- **Causa raíz:** un ancestro con `backdrop-filter` (el topbar) crea su propio stacking context, que atrapa a los descendientes `position: fixed` sin importar su z-index declarado.
- **Solución:** se portalizó el dropdown (`createPortal` a `document.body`), posicionado con `getBoundingClientRect()`.

### Bug — La notificación (Toast) se muestra detrás del navbar en la Landing Page
- **Estado:** Done (Resuelto) · **Prioridad:** Media
- **Feature relacionado:** Interfaz Pública y Marketing
- **Comportamiento real:** al agregar un producto desde la promoción del marketplace en la Landing Page, la notificación aparecía tapada por el navbar fijo.
- **Causa raíz:** mismo problema de fondo que el bug anterior — cada sección de la Landing Page envuelve su contenido en un `div` con `position: relative` + z-index propio, que atrapa al Toast (`position: fixed`) en un stacking context de menor prioridad que el navbar.
- **Solución:** se portalizó `ToastContainer` (`createPortal` a `document.body`), mismo patrón que el bug anterior.

### Bug — Nombre/raza de la mascota en blanco al agendar una cita
- **Estado:** Done (Resuelto) · **Prioridad:** Baja
- **Feature relacionado:** Agenda y Programación de Citas
- **Comportamiento real:** en el modal de agendar cita, el nombre y la raza de la mascota aparecían vacíos en las pantallas de confirmación/éxito.
- **Causa raíz:** el modal leía `mascota.Nombre`/`mascota.Raza` (PascalCase) mientras el endpoint `/api/usuario/mascotas` devuelve camelCase (`nombre`, `raza`).
- **Solución:** se agregó el patrón de fallback `mascota.nombre || mascota.Nombre` (y análogo para raza).

---

## Updates / mejoras visuales (Task suelta, no ameritan un PBI nuevo)

### Update — Checkboxes de filtros del Marketplace rediseñados
- **Tipo:** Task · **Estado:** Done · **Feature relacionado:** Buscador del Marketplace
- Se rediseñaron como pastillas redondas, alineadas al tema visual pino/menta del resto del proyecto.

### Update — "Roles y Permisos" (Admin): ocultar IDs y agregar filtro por rol
- **Tipo:** Task · **Estado:** Done · **Feature relacionado:** Módulos Principales y Paneles por Rol (Dashboard)
- Se dejaron de mostrar los IDs de usuario en la tabla; se agregó un filtro por rol (Cliente/Funcionario/Administrador/Veterinario) con tarjetas clicables, y se aplicó el mismo tema visual que el resto del panel de Administración.

### Update — Dashboard del Cliente convertido a panel puramente informativo
- **Tipo:** Task · **Estado:** Done · **Feature relacionado:** Módulos Principales y Paneles por Rol (Dashboard)
- Se retiró todo CRUD del Dashboard principal del cliente (crear/editar/eliminar mascotas, agendar citas, etc.); quedó como panel de estadísticas y accesos rápidos ("Ver todas") hacia las pantallas donde sí vive cada CRUD (Mis Mascotas, Mis Citas).

---

## Backlog sugerido para el próximo Sprint (deuda técnica ya documentada)

Ninguno de estos bloquea el uso normal de la plataforma hoy; quedan registrados en
`Docs/04-Notas/MEJORAS.md` para que el equipo los priorice si corresponde:

| Ítem | Resumen | Feature relacionado | Referencia |
|---|---|---|---|
| Buscador de expedientes para el veterinario | La pestaña "Expedientes" del panel del veterinario muestra "Próximamente" | Módulos Principales y Paneles por Rol (Dashboard) | Mejora-04 |
| Control de vacunas | No existe tabla `VACUNA`; portal cliente y panel veterinario muestran "Próximamente" | Gestión de Expedientes Veterinarios | Mejora-04 |
| Concurrencia al aceptar una emergencia en broadcast | Sin bloqueo optimista; dos veterinarias podrían aceptar casi simultáneo | Atención de Emergencias Veterinarias | Mejora-04 |
| Funcionario no puede aceptar emergencias que sí ve | Ve las de broadcast de su veterinaria pero el endpoint de aceptar solo permite Admin/Veterinario | Atención de Emergencias Veterinarias | Mejora-04 |
| Empleado vinculado por `COMERCIO_FUNCIONARIO` no puede operar con su propia cuenta | Solo el dueño original del comercio tiene permisos reales hoy | Administración y Supervisión de Comercios 🆕 | Mejora-06 |
| Estado "Desactivado" real para comercios | Hoy "Eliminar un comercio" reutiliza el estado Rechazado(3) | Administración y Supervisión de Comercios 🆕 | Mejora-08 |
| Detección de expiración de token fuera de la campanita | Mejora-01 quedó registrada como pendiente en general, aunque la campanita de notificaciones ya cubre ese caso puntual | Módulo de Autenticación Multitipo (Login) | Mejora-01 |

---

### Contexto relacionado
- [[Indice]] — índice completo de la documentación.
- [[Guion-Video1-SprintReview-Retro-SP04]] y [[Guion-Video2-Review-Retrospectiva-Final]].
