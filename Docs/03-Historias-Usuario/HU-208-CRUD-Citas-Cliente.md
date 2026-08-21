Historia de usuario: CRUD Completo de Citas del Cliente (Mis Citas)

Datos generales

- Id: HU-208
- Prioridad: Alta
- Épica: Agenda y Programación de Citas

Historia
Como cliente,
quiero poder agendar, reprogramar y cancelar mis citas desde una sola pantalla ("Mis citas"),
para gestionar toda mi agenda veterinaria sin depender de volver al Dashboard ni de pedirle el cambio a alguien más.

Criterios de aceptación

- El cliente puede agendar una cita nueva desde "Mis citas" (antes esta acción solo existía en el Dashboard); usa el mismo modal y la misma disponibilidad real del veterinario ya construidos para la Agenda (`AgendarCitaModal`, `GET /api/agenda/disponibilidad`).
- El cliente puede reprogramar una cita existente (Pendiente o Confirmada) eligiendo una nueva fecha y hora, filtradas por la disponibilidad real del veterinario asignado (`PUT /api/cita/{id}/reprogramar`).
- El cliente puede cancelar una cita existente (Pendiente o Confirmada), con un modal de confirmación antes de aplicarlo (`PUT /api/cita/{id}/cancelar`).
- Una cita ya Cancelada o Completada no ofrece las acciones de reprogramar/cancelar.
- El resultado de cada acción se muestra con el sistema de notificaciones compartido (`Toast`), y la lista se refresca sola después de agendar/reprogramar/cancelar, sin recargar la página.
- La información de la mascota (nombre, raza) se muestra correctamente sin importar si el backend la devuelve en PascalCase o camelCase.

Notas
Reutiliza los mismos endpoints que ya usaba la Agenda del Veterinario/Cliente
(`CitaController`/`CitaService`, ver [[Diagrama-Componentes]] § Citas y Agenda). No se agregó
ninguna tabla ni endpoint nuevo: el trabajo fue enteramente de frontend, sobre
`MisCitas.jsx`/`MisCitas.module.css`.

Antes de esta historia, "Mis citas" era una pantalla de solo lectura (listaba las citas pero no
ofrecía ninguna acción), y agendar una cita nueva solo era posible desde un modal en el
Dashboard del cliente. Ese modal se retiró del Dashboard en la misma iteración: el Dashboard
del cliente pasó a ser puramente informativo (estadísticas y accesos rápidos de "Ver todas"),
sin ninguna acción de creación/edición/borrado propia —toda gestión de citas vive ahora
únicamente acá, en "Mis citas".

Estado
Implementada (2026-08-21).
