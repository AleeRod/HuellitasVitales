Historia de usuario: Atención de Emergencias Veterinarias

Datos generales

- Id: HU-203
- Prioridad: Alta
- Épica: Gestión de Expedientes Veterinarios

Historia
Como cliente,
quiero poder solicitar atención veterinaria inmediata para mi mascota con el mínimo de fricción posible,
para conseguir ayuda lo antes posible sin tener que investigar y elegir una clínica específica en el peor momento para tomar esa decisión.

Como veterinario,
quiero ver y poder aceptar las solicitudes de emergencia que le corresponden a mi clínica (o que están abiertas a todas), y comunicarme directamente con quien la pidió,
para responder rápido sin depender de que el cliente ya tenga mi número.

Criterios de aceptación — solicitud (cliente)

- El cliente inicia la solicitud manteniendo presionado un botón circular de emergencia (no un clic simple) durante 1.4 segundos, con una animación de anillo de progreso y un leve temblor mientras lo sostiene; si suelta antes de tiempo, se cancela sin abrir nada — a propósito, para que un toque accidental no dispare una emergencia real.
- Al completar el gesto se abre un modal donde el cliente elige la mascota, indica ubicación exacta y motivo (con opciones rápidas predefinidas: accidente/trauma, envenenamiento, dificultad para respirar, sangrado, convulsiones) y una descripción opcional.
- Por defecto, la solicitud se envía en **broadcast** a todas las veterinarias aprobadas (`IdComercio` queda en `NULL`) — el cliente no tiene que elegir ninguna clínica para poder pedir ayuda, ya que la ubicación que completa existe justamente para que cada veterinaria evalúe si le queda cerca.
- El cliente puede, de forma opcional, elegir avisarle a una veterinaria puntual en vez de a todas (por ejemplo, si ya tiene una de confianza); en ese caso solo se notifica a esa clínica.
- Si la mascota nunca tuvo una cita (no tiene expediente todavía), la emergencia se puede solicitar igual: el expediente se abre solo, sin elegir veterinaria, sin bloquear al cliente.
- El formulario incluye un teléfono de contacto obligatorio: si el cliente ya tiene uno guardado en su perfil (`USUARIO.Telefono`) se autocompleta; si no tiene, se le pide y se guarda en su perfil al enviar la solicitud, para no tener que volver a pedirlo la próxima vez.
- El cliente puede ver el historial completo de todas sus emergencias (de todas sus mascotas, no solo la seleccionada en el momento), con filtros por Todas/Activas/Finalizadas y el detalle (descripción, diagnóstico, tratamiento) expandible al tocar cada tarjeta.
- Si el cliente consigue atención por su cuenta antes de que alguna veterinaria acepte la emergencia (o mientras sigue en curso), puede cerrarla él mismo registrando quién lo atendió afuera (nombre del veterinario y de la clínica externa, diagnóstico y tratamiento) — solo mientras la emergencia no esté ya Finalizada o Cancelada.

Criterios de aceptación — atención (veterinario / clínica)

- Un Veterinario o funcionario/dueño de una veterinaria puede ver, en sus emergencias pendientes: las dirigidas específicamente a su clínica, más las de broadcast (marcadas como "General · cualquiera puede tomarla") si su veterinaria está entre las aprobadas. Un Administrador ve todas.
- Solo un usuario con rol Administrador o Veterinario puede **aceptar** una emergencia — un Funcionario puede verla en su lista de pendientes, pero el sistema rechaza su intento de aceptarla (ver limitación conocida más abajo).
- Si el veterinario que acepta todavía no tiene un perfil profesional (`VETERINARIO`) creado, el sistema se lo crea automáticamente en ese momento en vez de bloquearlo con un error.
- Si la emergencia ya estaba dirigida a una clínica puntual, solo puede aceptarla alguien de esa clínica (su dueño o un funcionario activo) o un Administrador.
- Si la emergencia estaba en broadcast, la primera clínica que la acepta la "reclama": queda asignada a esa clínica de ahí en adelante y deja de estar disponible para las demás.
- Una vez aceptada, solo el mismo veterinario que la aceptó (o un Administrador) puede avanzarla a "En atención" y después a "Finalizada"; finalizar exige diagnóstico y tratamiento.
- El teléfono de contacto del cliente se muestra en cada tarjeta de emergencia como un enlace `tel:` directo, para poder llamarlo con un toque — no se duplica en la tabla de emergencias, se resuelve en el momento desde el perfil del solicitante.
- Se notifica a los responsables de la(s) veterinaria(s) correspondiente(s) al recibir una solicitud nueva, y al cliente solicitante cuando su emergencia se acepta, se inicia o se finaliza.

Notas
Depende de [[HU-200-Expediente-Clinico-Digital]]. Tabla relacionada: `EMERGENCIA` (ver
[[Modelo-Datos]]). Endpoints bajo `/api/expedientes/{idExpediente}/emergencias` y
`/api/emergencias` (ver [[Diagrama-Componentes]] § Emergencias). El teléfono de contacto
reutiliza `USUARIO.Telefono` (mismo campo que gestiona `Configuracion.jsx`). Las notificaciones
usan el mecanismo general de [[HU-205-Notificaciones-Internas]].

**Limitación conocida:** el Funcionario puede ver las emergencias en broadcast de su veterinaria
en su lista de pendientes, pero el endpoint de aceptar solo permite rol Administrador o
Veterinario — así que hoy no puede realmente tomarlas, solo verlas. Tampoco hay bloqueo
optimista al aceptar: si dos veterinarias intentaran aceptar la misma emergencia de broadcast
casi al mismo tiempo, una pisaría a la otra. Ambos puntos quedan registrados como pendientes en
[[MEJORAS]] (Mejora-04).

Estado
Implementada (2026-08-21). `EmergenciaService`/`EmergenciaController` cubren el broadcast (o
veterinaria puntual), el ciclo de vida completo (Solicitada → Aceptada → En Atención →
Finalizada, o Finalizada directo por atención externa), la reclamación de emergencias en
broadcast al aceptar, y el historial completo por cliente
(`GET /api/emergencias/mis-emergencias`). Frontend: `SolicitarEmergencia.jsx` (botón "mantené
presionado" con anillo de progreso SVG sobre un halo circular blanco, y modal de solicitud) y
`PanelEmergencias.jsx` (panel del veterinario, con el teléfono de contacto como link `tel:` y
el badge "General" para las de broadcast).

Se descartó a propósito el envío del PDF del expediente por correo dentro de este flujo (ver
[[HU-204-Exportar-Expediente-PDF]]): no había infraestructura de correo en el proyecto y se
decidió no construirla en este alcance; solo queda la descarga directa del PDF.
