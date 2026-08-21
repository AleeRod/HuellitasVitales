Historia de usuario: Exportar el Expediente en PDF

Datos generales

- Id: HU-204
- Prioridad: Baja
- Épica: Gestión de Expedientes Veterinarios

Historia
Como cliente,
quiero poder descargar el expediente clínico de mi mascota en PDF,
para tener un documento propio que pueda guardar o llevar a cualquier veterinaria, incluso una que no esté afiliada a la plataforma.

Criterios de aceptación

- El cliente puede descargar en cualquier momento un PDF con el expediente completo de su mascota: nombre de la mascota, veterinaria actual, historial de veterinarias (nombre, desde cuándo, hasta cuándo, y si el acceso fue solo de consulta o también de modificación), atenciones externas (veterinaria, fecha, motivo, diagnóstico y tratamiento si existen) y emergencias (fecha, estado, motivo, diagnóstico y tratamiento si existen, y si fue atendida externamente).
- Si la mascota no tiene ninguna veterinaria asignada, el PDF lo indica claramente ("Sin asignar") en vez de fallar o mostrar un dato inventado; lo mismo si no tiene historial, atenciones externas o emergencias registradas ("Sin movimientos registrados", etc.).
- Solo puede exportar el PDF quien tiene permiso de consulta sobre ese expediente: el dueño de la mascota, un Administrador, o una veterinaria con acceso vigente — exactamente el mismo control de acceso que ver el detalle del expediente.
- El archivo se descarga con un nombre que incluye el de la mascota, para poder identificarlo fácilmente entre varias descargas.

Notas
Depende de [[HU-200-Expediente-Clinico-Digital]]. Endpoint
`GET /api/expediente/{id}/exportar-pdf` (ver [[Diagrama-Componentes]] § Expedientes Clínicos),
que reutiliza la misma consulta y el mismo control de acceso
(`ExpedienteService.EvaluarAccesoAsync`) que el detalle del expediente. Se evaluó también enviar
el PDF por correo electrónico, pero se descartó: el proyecto no tenía ninguna infraestructura de
envío de correos (la recuperación de contraseña, por ejemplo, todavía devuelve el token directo
en la respuesta en vez de enviarlo por correo — pendiente aparte, sin relación con esta
historia), y se decidió no construirla dentro de este alcance. Queda solo la descarga directa,
ofrecida desde [[HU-201-Traslado-Expediente]].

Estado
Implementada (2026-08-21). Generación con **QuestPDF** (licencia Community, gratuita para este
uso) en `ExpedientePdfService`, reutilizando la misma consulta de datos que el detalle del
expediente (`ExpedienteService.ObtenerParaExportarAsync`, que arma un DTO fuerte en vez de un
objeto anónimo para poder leerlo fuera del método de servicio). Botón "Descargar expediente en
PDF" agregado en `TrasladarExpediente.jsx`.
