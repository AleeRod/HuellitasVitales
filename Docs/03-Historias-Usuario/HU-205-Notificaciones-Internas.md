Historia de usuario: Notificaciones Internas con Redirección

Datos generales

- Id: HU-205
- Prioridad: Media
- Épica: Gestión de Expedientes Veterinarios

Historia
Como usuario de la plataforma (cliente, veterinario, administrador o funcionario),
quiero recibir una notificación real cuando pase algo que me corresponde atender (una emergencia, una respuesta a mi solicitud de traslado) y poder ir directo a esa sección al tocarla,
para no tener que estar revisando manualmente cada panel para enterarme de novedades.

Criterios de aceptación

- El sistema genera una notificación real cuando: se solicita una emergencia (a la veterinaria puntual elegida, o a todas las aprobadas si fue en broadcast), se acepta una emergencia, se inicia o se finaliza (al cliente que la solicitó), se recibe una solicitud de traslado (a los responsables de la veterinaria destino), y se acepta o rechaza un traslado (al cliente que lo solicitó).
- La campanita de notificaciones, presente en todos los paneles (Cliente, Veterinario, Admin, Funcionario), revisa si hay novedades automáticamente cada 60 segundos mientras el usuario tiene la sesión abierta, sin que tenga que recargar la página.
- La campanita muestra un contador de no leídas (con un tope visual "9+" para no desbordar el ícono) y, al abrirla, la lista de las últimas 50 notificaciones del usuario (leídas y no leídas), con las no leídas siempre primero y luego ordenadas de la más reciente a la más vieja.
- Al tocar una notificación, esta se marca como leída de inmediato y el usuario es redirigido a la sección relacionada según el tipo de notificación y su rol (por ejemplo, una notificación de emergencia lleva al cliente a "Solicitar emergencia" y al veterinario a la pestaña de Emergencias de su propio panel).
- Si el usuario ya está en el panel correcto pero en otra pestaña cuando toca la notificación, igual lo lleva a la pestaña indicada — no hace falta recargar la página para que el cambio de pestaña surta efecto.
- Si la sesión del usuario expiró (token vencido, dura 2 horas), la campanita lo detecta al intentar cargar las notificaciones y lo redirige al login limpiando la sesión guardada, en vez de fallar en silencio o mostrar un error críptico.

Notas
Tabla relacionada: `NOTIFICACION` (ver [[Modelo-Datos]]). Endpoints `/api/notificacion` (ver
[[Diagrama-Componentes]] § Notificaciones). Usada por [[HU-201-Traslado-Expediente]] y
[[HU-203-Emergencia-Veterinaria]], que son las dos únicas historias que hoy generan
notificaciones (`Tipo` = `"Emergencia"` o `"TrasladoExpediente"`).

**Limitación conocida:** el Funcionario no tiene una pestaña de Emergencias en su panel
(`DashboardFuncionario.jsx`), así que si le llega una notificación de tipo `"Emergencia"` hoy no
lo redirige a ningún lado — ver [[MEJORAS]] (Mejora-04).

Estado
Implementada (2026-08-21). `NotificacionService`/`NotificacionController` cubren crear, listar
(últimas 50, no leídas primero) y marcar leída. `NotificacionesBell.jsx` es el componente
compartido por todos los paneles (antes había botones `<Bell>` decorativos repetidos por toda
la app, sin `onClick` ni datos reales). La redirección según `Tipo` + rol
(`rutaDestino` dentro del propio componente), y el soporte de `?vista=`/`?seccion=` en los
paneles con pestañas internas (`PanelVeterinario`, `DashboardAdmin`, `DashboardFuncionario`)
para poder aterrizar en la pestaña correcta incluso si el panel ya estaba abierto, se agregó en
esta misma iteración — ver [[Reglas-Generales]] § Convenciones de Frontend.
