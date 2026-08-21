Historia de usuario: Expediente Clínico Digital de la Mascota

Datos generales

- Id: HU-200
- Prioridad: Alta
- Épica: Gestión de Expedientes Veterinarios

Historia
Como cliente,
quiero que mi mascota tenga un expediente clínico digital que se abra automáticamente,
para no tener que crearlo a mano y para que cualquier veterinaria con acceso vigente pueda ver su historial real (traslados, atenciones externas, emergencias) sin depender de papeles sueltos.

Criterios de aceptación

- Al consultar el expediente de una mascota que ya tuvo al menos una cita, el sistema lo crea automáticamente si no existía, anclado a la veterinaria de la cita más reciente (`CITA → SERVICIO → COMERCIO`, porque `CITA` no tiene una relación directa con `COMERCIO`).
- Si la mascota nunca tuvo una cita, el sistema no bloquea al cliente: puede abrir el expediente eligiendo una veterinaria puntual (usado por Emergencia/Traslado), o sin elegir ninguna (usado por Atenciones Externas, que por definición no tiene relación con ninguna veterinaria de la plataforma).
- El detalle del expediente muestra: mascota, veterinaria actual (o "Sin asignar" si no tiene ninguna), historial de veterinarias con permisos y vigencia, atenciones externas y emergencias.
- Solo pueden consultar un expediente: el dueño de la mascota (solo lectura), un Administrador (lectura y escritura), o una veterinaria con acceso vigente (fila sin `FechaHasta` en el historial) — cualquier otro intento se rechaza.
- Solo una veterinaria con permiso de modificación vigente puede escribir sobre el expediente; el dueño de la mascota nunca tiene permiso de modificación (solo consulta).
- Un expediente pertenece a una única mascota (no se pueden crear expedientes duplicados para la misma mascota).

Notas
Es la base de la que dependen Traslado de Expediente ([[HU-201-Traslado-Expediente]]), Atenciones Externas ([[HU-202-Atenciones-Externas]]), Emergencia Veterinaria ([[HU-203-Emergencia-Veterinaria]]) y Exportar Expediente en PDF ([[HU-204-Exportar-Expediente-PDF]]). Tablas relacionadas: `EXPEDIENTE`, `EXPEDIENTE_COMERCIO` (ver [[Modelo-Datos]]). Endpoints: `GET /api/expediente/mascota/{idMascota}`, `POST /api/expediente/abrir`, `POST /api/expediente/abrir-sin-veterinaria`, `GET /api/expediente/{id}` (ver [[Diagrama-Componentes]] § Expedientes Clínicos).

Estado
Implementada (2026-08-21). `ExpedienteService`/`ExpedienteController` cubren la creación
automática, las dos vías de apertura sin cita previa, el detalle enriquecido y el control de
acceso (`EvaluarAccesoAsync`). Frontend: `ExpedienteBadge.jsx` (tarjeta compacta reutilizada en
las 3 pantallas del expediente) y `MascotaChips.jsx` (selector de mascota como chips en vez de
un `<select>` plano).

`EXPEDIENTE.IdComercioActual` originalmente era `NOT NULL`, lo que bloqueaba por completo a
cualquier mascota sin citas previas. Se corrió en Supabase
`ALTER TABLE public."EXPEDIENTE" ALTER COLUMN "IdComercioActual" DROP NOT NULL;` para permitir
las dos vías de apertura sin veterinaria — ver [[Modelo-Datos]] § EXPEDIENTE.
