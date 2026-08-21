Historia de usuario: Panel Clínico del Veterinario con Datos Reales

Datos generales

- Id: HU-206
- Prioridad: Media
- Épica: Panel del Veterinario

Historia
Como veterinario,
quiero que mi panel clínico muestre mi agenda, mis pacientes y mis pendientes reales, y poder cerrar una cita con una nota clínica,
para tener un panel de trabajo diario confiable en vez de una maqueta con números fijos que nunca cambian.

Criterios de aceptación

- El panel clínico muestra en tiempo real: cantidad de citas de hoy, pacientes atendidos hoy (citas de hoy ya completadas), traslados pendientes dirigidos a su veterinaria y emergencias pendientes (dirigidas a su veterinaria o en broadcast) — los cuatro con datos reales, ninguno fijo.
- Los indicadores de traslados y emergencias pendientes llevan directo a esa pestaña al tocarlos, sin recargar la página.
- El veterinario puede ver la lista de sus citas de hoy, ordenadas por hora, con su estado real (Pendiente/Confirmada/Cancelada/Completada).
- El veterinario puede completar una cita agregando una nota clínica opcional; el selector del formulario solo ofrece las citas del día en estado Pendiente o Confirmada, pero el sistema en general permite completar cualquier cita que no esté ya Cancelada o Completada. Solo el veterinario asignado a la cita (o un Administrador) puede completarla.
- La nota clínica se guarda en el mismo campo de observaciones de la cita; si ya tenía una nota previa (por ejemplo, de una reprogramación), la nueva se agrega a continuación en vez de reemplazarla.
- El panel muestra un historial clínico reciente real (últimas citas completadas del veterinario, más recientes primero), no una tabla con una fila fija de ejemplo.
- El veterinario puede ver la lista de todos sus pacientes (mascotas que atendió alguna vez, calculada a partir de su propia agenda), con su dueño, especie, cantidad de visitas y la fecha de la última.
- Al cerrar sesión desde este panel, la sesión se limpia realmente (token y usuario del `localStorage`) y se redirige a la página principal, que existe — antes el enlace de "Cerrar sesión" apuntaba a una ruta inexistente (`/LandingPage`, cuando la página principal está en `/`) y no limpiaba ningún dato de sesión.
- Las secciones "Expedientes" y "Vacunas" del menú muestran un estado "Próximamente" explícito en vez de ser enlaces que no hacen nada al tocarlos.

Notas
Reutiliza el mismo endpoint de agenda que ya usaba `AgendaDiariaVeterinario.jsx`
(`GET /api/cita/veterinario`, ver [[Modelo-Datos]] § CITA). El "completar cita con nota" usa el
nuevo endpoint `PUT /api/cita/{id}/completar` (ver [[Diagrama-Componentes]] § Citas y Agenda),
que reutiliza la columna `CITA.Notas` que ya existía — no se agregó ninguna tabla nueva. La
campanita de notificaciones y el deep-link a pestañas (`?vista=`) son parte de
[[HU-205-Notificaciones-Internas]].

Estado
Implementada (2026-08-21). Antes, la vista "Panel clínico" de `PanelVeterinario.jsx` era
enteramente una maqueta: estadísticas fijas (8 citas, 3 pacientes, 2 vacunas, 1 urgente),
pacientes de ejemplo (Luna/Rocky/Toby), un formulario de "nota clínica" que no guardaba nada
(sin `onChange` ni envío real), y una fila de historial hardcodeada con una fecha fija
(28/06/2026). Se reemplazó todo por datos reales derivados de la propia agenda del veterinario;
los ítems de menú sin funcionalidad real ("Expedientes", "Vacunas") se dejaron como
"Próximamente" en vez de enlaces muertos. Un buscador de expedientes por mascota para el
veterinario queda pendiente como una mejora aparte — ver [[MEJORAS]] (Mejora-04).
