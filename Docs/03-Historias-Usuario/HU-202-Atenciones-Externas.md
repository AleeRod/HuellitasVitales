Historia de usuario: Registro de Atenciones Externas

Datos generales

- Id: HU-202
- Prioridad: Media
- Épica: Gestión de Expedientes Veterinarios

Historia
Como cliente,
quiero registrar en el expediente de mi mascota las consultas que le hicieron fuera de Huellitas Vitales, adjuntando el comprobante,
para tener un historial clínico completo de mi mascota en un solo lugar, sin importar dónde la atendieron.

Criterios de aceptación

- El cliente puede registrar una atención externa indicando veterinaria/establecimiento y motivo (obligatorios), y profesional, fecha de atención, diagnóstico y tratamiento (opcionales salvo la fecha, que siempre se envía).
- La veterinaria y el profesional se ingresan como texto libre, no ligados a ninguna veterinaria de la plataforma — por definición, la atención pasó fuera de ella.
- La fecha de atención no puede estar en el futuro; el sistema la rechaza con un mensaje claro si lo está.
- Si la mascota no tiene expediente todavía (nunca tuvo una cita), el sistema lo abre automáticamente sin pedirle al cliente que elija ninguna veterinaria — a diferencia de Emergencia o Traslado, acá no tiene sentido pedirlo porque la atención ya pasó fuera de la plataforma.
- El cliente puede adjuntar uno o más comprobantes a cada atención externa registrada, únicamente en formato PDF, JPG, PNG o WEBP, y de máximo 10 MB cada uno; cualquier otro tipo o tamaño se rechaza con un mensaje claro (se valida tanto el tipo de contenido como la extensión del archivo).
- El cliente puede ver el historial de atenciones externas de cada mascota, ordenado por fecha de atención más reciente primero, con sus comprobantes adjuntos listados para descargar.
- Solo el dueño de la mascota puede registrar atenciones externas o adjuntar documentos en su propio expediente — a diferencia de otras historias de esta épica, acá no hay excepción para Administrador ni para ninguna veterinaria, porque es información que el cliente autorreporta sobre algo que pasó fuera de la plataforma.

Notas
Depende de [[HU-200-Expediente-Clinico-Digital]]. Tablas relacionadas: `ATENCION_EXTERNA`,
`DOCUMENTO_ATENCION_EXTERNA` (ver [[Modelo-Datos]]). Endpoints bajo
`/api/expedientes/{idExpediente}/atenciones-externas` (ver [[Diagrama-Componentes]] §
Atenciones Externas). El cliente también puede cerrar una [[HU-203-Emergencia-Veterinaria]]
registrando una atención externa, aunque ese flujo usa su propia tabla (`EMERGENCIA`, sin
documentos adjuntos) y no esta.

Estado
Implementada (2026-08-21). `AtencionExternaService`/`AtencionExternaController` cubren
registrar, listar y adjuntar documentos (guardados en
`wwwroot/uploads/atenciones-externas/` con un nombre generado, `[RequestSizeLimit]` de 10 MB a
nivel de controlador además de la validación de tamaño en el servicio). Frontend:
`AtencionesExternas.jsx`, con zona de arrastrar-y-soltar para los comprobantes.
