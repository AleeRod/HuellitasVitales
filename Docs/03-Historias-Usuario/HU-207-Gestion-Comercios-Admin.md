Historia de usuario: Gestión Completa de Comercios Afiliados (Administrador)

Datos generales

- Id: HU-207
- Prioridad: Alta
- Épica: Panel de Administración

Historia
Como administrador,
quiero ver y gestionar todos los comercios afiliados a la plataforma —no solo las solicitudes pendientes de aprobar—,
para poder aprobar, rechazar, editar o dar de baja cualquier comercio desde un mismo lugar, sin tener que buscar esa información en varias pantallas distintas.

Criterios de aceptación

- La sección del panel de Administrador antes llamada "Solicitudes" pasa a llamarse "Comercios", con dos pestañas: "Solicitudes pendientes" y "Todos los comercios".
- La pestaña "Solicitudes pendientes" mantiene la aprobación/rechazo ya existente (`PUT /api/Comercio/{id}/aprobar` y `/rechazar`), ahora con el mismo sistema visual (tarjetas, tablas, badges) que el resto del panel de Administración, en vez de una tabla HTML suelta con estilos propios.
- La pestaña "Todos los comercios" lista cada comercio afiliado con buscador por nombre/razón social y filtro por estado (Pendiente/Aprobado/Rechazado).
- El administrador puede ver el detalle completo de un comercio (datos del comercio y de quien lo solicitó) en un modal, sin salir de la lista.
- El administrador puede editar los datos de un comercio existente (`PUT /api/Comercio/{id}`).
- El administrador puede eliminar/dar de baja un comercio desde la lista, con un modal de confirmación antes de aplicarlo (reemplaza el `window.confirm` nativo que se usaba antes).
- Al eliminar un comercio, este deja de aparecer en el marketplace y en las búsquedas de inmediato.
- Toda acción (aprobar, rechazar, editar, eliminar) muestra el resultado con el sistema de notificaciones (`Toast`) compartido del proyecto, no con `alert()`.

Notas
Reemplaza el uso operativo de `PanelSolicitudesPendientes.jsx` (que queda sin referenciar desde
`DashboardAdmin.jsx`, pendiente de borrarlo del repo en una limpieza aparte) por
`PanelComercios.jsx` (`src/components/Admin/PanelComercios/`). Endpoints bajo `/api/Comercio` (ver
[[Diagrama-Componentes]] § Comercio y Solicitudes).

**Limitación conocida:** "Eliminar" un comercio reutiliza el mismo estado `Rechazado(3)` que usa
un rechazo de solicitud —no existe todavía un estado "Desactivado" distinto en
`ESTADO_SOLICITUD_CAT`—, así que un comercio dado de baja después de haber estado aprobado se
muestra como "Rechazado" en la lista, que no es 100% preciso semánticamente. Ver [[MEJORAS]]
(Mejora-08) para la solución propuesta (agregar la fila nueva al catálogo).

Estado
Implementada (2026-08-21).
