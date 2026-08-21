Historia de usuario: Traslado de Expediente entre Veterinarias

Datos generales

- Id: HU-201
- Prioridad: Alta
- Épica: Gestión de Expedientes Veterinarios

Historia
Como cliente,
quiero poder solicitar que el expediente de mi mascota se traslade a otra veterinaria y que la veterinaria receptora lo apruebe o lo rechace,
para poder cambiarme de clínica sin perder el historial clínico ni tener que empezar de cero, y sin que ninguna veterinaria reciba acceso a mi mascota sin haberlo aceptado antes.

Criterios de aceptación

- El cliente (dueño de la mascota) puede solicitar el traslado del expediente a cualquier veterinaria aprobada (`IdTipoComercio` = Clínica Veterinaria, `IdEstadoSolicitud` = Aprobado) distinta a la actual, con un motivo opcional. Un Administrador puede solicitarlo por cualquier mascota, no solo el propio cliente.
- No se puede solicitar un traslado si el expediente todavía no tiene ninguna veterinaria asignada (`IdComercioActual` es `NULL`) — el sistema lo rechaza con un mensaje claro invitando a elegir una veterinaria primero.
- No se puede tener más de una solicitud `Pendiente` a la vez para el mismo expediente (índice único parcial en base de datos, reforzado también en el servicio).
- Solo puede resolver la solicitud (aceptar o rechazar) alguien de la veterinaria **destino**: su dueño (vía `PERSONA_LEGAL`), un funcionario activo de esa veterinaria, o un Administrador; puede incluir una respuesta escrita.
- Si el expediente cambió de veterinaria actual mientras la solicitud seguía pendiente (por ejemplo, otro traslado se resolvió primero), el sistema rechaza la resolución con un error de conflicto en vez de dejar el expediente en un estado inconsistente.
- Al aceptar: en una sola transacción, la veterinaria de origen pierde el permiso de modificar (conserva solo consulta, con fecha de cierre de su acceso), la veterinaria destino queda con acceso vigente de consulta y modificación, y el expediente pasa a tener esa veterinaria como actual.
- Al rechazar, el expediente no cambia de ninguna forma y el cliente puede volver a solicitar el traslado (a la misma veterinaria u otra).
- El cliente puede consultar el historial de todas las solicitudes de traslado que él mismo envió, con mascota, veterinaria destino, estado (Pendiente/Aceptada/Rechazada), motivo, respuesta y fechas.
- La veterinaria destino puede ver sus solicitudes pendientes (las de su propia veterinaria si es su dueño o funcionario; todas las de la plataforma si es Administrador).
- Se notifica a los responsables (dueño y funcionarios activos) de la veterinaria destino al recibir una solicitud nueva, y al cliente solicitante cuando su solicitud se acepta o se rechaza.

Notas
Depende de [[HU-200-Expediente-Clinico-Digital]]. Tabla relacionada:
`SOLICITUD_TRASLADO_EXPEDIENTE` (ver [[Modelo-Datos]]). Endpoints bajo `/api/trasladoexpediente`
(ver [[Diagrama-Componentes]] § Traslado de Expediente). Las notificaciones usan el mecanismo
general de [[HU-205-Notificaciones-Internas]]. El cliente también puede descargar el expediente
en PDF antes de decidir trasladarlo — ver [[HU-204-Exportar-Expediente-PDF]].

Estado
Implementada (2026-08-21). `TrasladoExpedienteService`/`TrasladoExpedienteController` cubren
solicitar, aceptar/rechazar (con transacción explícita vía
`_context.Database.BeginTransactionAsync()`), listar pendientes por veterinaria gestionable y
el historial del propio cliente. Frontend: `TrasladarExpediente.jsx` (Cliente, con
`SelectorVeterinaria` para elegir el destino y el botón de descarga en PDF) y
`PanelSolicitudesTraslado.jsx` (compartido entre Veterinario/Admin/Funcionario para aceptar o
rechazar).
