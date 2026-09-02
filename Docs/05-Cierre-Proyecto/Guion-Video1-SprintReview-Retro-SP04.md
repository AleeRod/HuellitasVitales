Guion — Video 1: Sprint Review y Sprint Retrospective del Sprint 04

> Este guion sigue la lógica real de los dos eventos de Scrum (Sprint Review y Sprint
> Retrospective), no una presentación de diapositivas. Cada bloque indica quién habla, qué se
> muestra en pantalla (compartir pantalla real de la app + tablero de Azure DevOps) y qué se
> tiene que decir con sus propias palabras a partir de la idea marcada — no es texto para leer
> literal.
>
> **Completar antes de grabar:** fecha real del Sprint Review, y confirmar/ajustar los roles
> del equipo (ver tabla abajo, inferida del historial de commits).

Equipo Scrum (ver detalle de cómo se infirió en [[Backlog-AzureDevOps-Sprint4]]):

| Integrante                 | Rol en este video                            |
| -------------------------- | -------------------------------------------- |
| Daniel Umaña Madriz        | Scrum Master — facilita el Review y la Retro |
| Javier Powers Abarca       | Developer                                    |
| Brandon Alfaro Araya       | Developer                                    |
| Ignacio Paucar Arguedas    | Developer                                    |
| Alejandro Rodríguez Chacón | Developer                                    |

Product Owner: el profesor del curso (define el objetivo del Sprint 04; su feedback se recoge en
vivo durante la sesión real, no está guionado acá).

Sprint Goal del Sprint 04 (tal como lo definió el profesor):
1. Traslados de expediente por parte del propietario entre veterinarias dentro de la plataforma.
2. Caso de uso para veterinarias que no están en la plataforma (para que el propietario pueda
   aportar lo que se haga en veterinarias externas).
3. Atención de emergencias: cuando el veterinario diferente al de cabecera está en la
   plataforma, y el flujo cuando no está.
4. Resolución de defectos del Sprint 03.
5. Pendientes del Sprint 03.

---

## PARTE 1 — SPRINT REVIEW

### Apertura (Scrum Master) — ~1 min

> "Bienvenidos al Sprint Review del Sprint 04 de Huellitas Vitales. En este evento vamos a
> mostrar el incremento que construimos este Sprint, comparar contra lo que nos pidió nuestro
> Product Owner al inicio, y ver qué quedó realmente entregado en el tablero. No es una demo
> improvisada: cada uno del equipo va a mostrar la parte que le tocó, y al final vamos a repasar
> juntos qué tanto acercó este incremento al objetivo del producto."

*Compartir pantalla: tablero de Azure DevOps, Sprint 4, columnas To Do / In Progress / Done.*

**Scrum Master:** repasar en voz alta el Sprint Goal (los 5 puntos de arriba) y mostrar en el
tablero cuántos Work Items terminaron en Done vs. los que quedaron abiertos.

### Bloque 1 — Traslado de Expediente entre Veterinarias — ~4 min

*Quién demuestra: [asignar a un Developer]. Compartir pantalla: la app corriendo.*

Guion de la demo (pasos reales a mostrar en vivo):
1. Iniciar sesión como cliente, ir a "Trasladar expediente" desde el portal del cliente.
2. Elegir una mascota y una veterinaria destino distinta a la actual; mostrar que el sistema no
   deja elegir la misma veterinaria ni una que no esté aprobada.
3. Enviar la solicitud y mostrar que la campanita de notificaciones le llega a la veterinaria
   destino en tiempo real (sin recargar).
4. Cambiar de sesión a un usuario Veterinario/Funcionario de esa veterinaria, abrir "Solicitudes
   de traslado" y aceptar la solicitud.
5. Mostrar que el expediente pasa a tener esa veterinaria como actual, y que la veterinaria de
   origen queda con acceso de solo consulta (no perdió el historial, perdió el permiso de
   escribir).
6. Mostrar que el cliente recibe la notificación de que su traslado fue aceptado.

**Hablar sobre:** por qué se decidió que el traslado necesite aceptación de la veterinaria
destino (nadie puede "robarse" el acceso a un expediente sin que la clínica receptora lo
confirme), y que esto depende de la base construida en el Expediente Clínico Digital (que
también se armó en este Sprint, ya que no existía antes).

### Bloque 2 — Atenciones Externas (veterinarias que no están en la plataforma) — ~3 min

*Quién demuestra: [asignar a un Developer].*

Guion de la demo:
1. Como cliente, entrar al expediente de una mascota y abrir "Registrar atención externa".
2. Completar el formulario a mano (nombre de la veterinaria externa, motivo, diagnóstico,
   tratamiento) — remarcar que estos campos son texto libre porque, por definición, esa
   veterinaria no está en la plataforma.
3. Adjuntar un comprobante (PDF o imagen) y mostrar que el sistema rechaza un archivo de un tipo
   no permitido o demasiado grande.
4. Mostrar el historial de atenciones externas de la mascota, ordenado por fecha, con el
   comprobante disponible para descargar.

**Hablar sobre:** este es el caso de uso #2 del objetivo del Sprint — la plataforma no puede
"controlar" lo que pasa en una veterinaria externa, pero sí le da al dueño una forma de dejar
ese historial completo y centralizado.

### Bloque 3 — Atención de Emergencias — ~4 min

*Quién demuestra: [asignar a un Developer].*

Guion de la demo:
1. Como cliente, mantener presionado el botón circular de emergencia (mostrar la animación del
   anillo de progreso) y soltarlo antes de tiempo para mostrar que se cancela solo — remarcar
   que es intencional, para que un toque accidental no dispare una emergencia real.
2. Completar el gesto, elegir mascota, ubicación y motivo (una de las opciones rápidas:
   accidente, envenenamiento, dificultad para respirar, etc.), y enviar en modo broadcast (sin
   elegir una veterinaria puntual).
3. Cambiar de sesión a un Veterinario de una veterinaria aprobada y mostrar la emergencia en su
   lista de pendientes, marcada como "General".
4. Aceptarla, mostrar que queda "reclamada" para esa clínica (y que ya no aparece disponible
   para otras), avanzarla a "En atención" y finalizarla con diagnóstico y tratamiento.
5. Mostrar, del lado del cliente, que también puede cerrar la emergencia él mismo si consiguió
   atención por su cuenta antes de que alguien la aceptara — con esto se cubre el flujo "cuando
   no está en la plataforma" del objetivo del Sprint.

**Hablar sobre:** la diferencia entre broadcast (cualquier veterinaria puede tomarla) vs. dirigir
la emergencia a una clínica puntual, y por qué se dejó como limitación conocida (documentada, no
escondida) que un Funcionario puede ver una emergencia de broadcast pero todavía no puede
aceptarla — decisión consciente de alcance, no un olvido.

### Bloque 4 — Resolución de defectos y pendientes del Sprint 03 — ~3 min

*Quién demuestra: [asignar a un Developer]. Compartir pantalla: tablero de Azure DevOps.*

1. Mostrar en el tablero las tareas #174/#177/#178 de la historia "CRUD de Servicios
   Veterinarios" (etiquetada Sprint 3) que seguían en To Do al cierre del Sprint 3, y mostrarlas
   ya en Done.
2. Mostrar el bug real que se reportó en producción: al completar una compra, `POST /api/orden`
   devolvía error 500. Explicar la causa (faltaba una columna en la base de datos real) y la
   solución (se corrió el `ALTER TABLE` correspondiente contra Supabase), y hacer una compra en
   vivo para demostrar que ya funciona.
3. Mencionar brevemente los otros defectos visuales corregidos este Sprint (ícono de búsqueda
   mal posicionado, notificaciones y menús que se renderizaban detrás de otros elementos de la
   pantalla) — sin necesidad de demo extensa de cada uno, solo nombrarlos como parte del trabajo
   de estabilización.

### Bloque 5 — Incremento adicional entregado (más allá del Sprint Goal) — ~3 min

*Quién demuestra: [asignar a un Developer].*

> "Además de los cuatro objetivos que nos pidieron, el equipo entregó valor adicional que surgió
> durante el Sprint:"

1. Mostrar "Mis compras" y el recibo de una orden (sistema de facturación interna simple).
2. Mostrar el CRUD completo de "Mis citas" (agendar, reprogramar, cancelar) — antes esa pantalla
   solo mostraba la lista.
3. Mostrar la gestión completa de "Comercios" en el panel de Administración (ya no solo
   solicitudes pendientes, ahora también edición y baja de cualquier comercio afiliado).
4. Mostrar el flujo de "Olvidé mi contraseña" recibiendo un correo real, y mencionar que el
   mismo nivel de seguridad ahora aplica también al cambio de contraseña autenticado.
5. Mostrar la Landing Page con productos reales del marketplace en la sección de promoción.

### Cierre del Review — Qué se entregó en Azure DevOps — ~2 min

*Compartir pantalla: tablero completo, filtro Sprint 4, columna Done.*

**Scrum Master:** contar en voz alta cuántas Historias de Usuario, Tareas y Bugs terminaron en
Done este Sprint (ver el detalle completo en [[Backlog-AzureDevOps-Sprint4]]), y cerrar con la
pregunta clave: *"¿En qué medida este incremento contribuyó al Objetivo del Producto?"* —
responder con una frase concreta: cada Sprint fue agregando una capa completa de la
plataforma (autenticación y roles → marketplace y checkout → agenda y servicios veterinarios →
expedientes clínicos, traslados, emergencias y seguridad), y con este Sprint la plataforma cubre
de punta a punta tanto el lado comercial (marketplace) como el lado clínico (expediente digital)
de una veterinaria, que era justamente el objetivo original del producto.

---

## PARTE 2 — SPRINT RETROSPECTIVE

*Formato sugerido: "Empezar / Dejar de hacer / Seguir haciendo" (Start / Stop / Continue), con
cada integrante aportando al menos un punto en cada categoría. El Scrum Master facilita y anota.*

### Apertura (Scrum Master) — ~1 min

> "Ahora toca la Retrospectiva. Acá no hablamos del producto, hablamos de cómo trabajamos como
> equipo durante este Sprint. Vamos a repasar qué funcionó bien, qué dificultades tuvimos, qué
> aprendimos, y qué vamos a hacer distinto de acá en adelante."

### Qué funcionó bien — ~3 min

*Cada integrante aporta al menos un punto, en primera persona.*

Ideas reales para desarrollar con sus propias palabras (no leer textual):
- Reutilizar el mismo mecanismo de notificaciones y el mismo control de acceso
  (`EvaluarAccesoAsync`) en varias historias distintas (Traslado, Emergencia, Exportar PDF)
  ahorró tiempo real de desarrollo en vez de reinventar la validación en cada endpoint.
- Documentar cada historia con sus criterios de aceptación completos (carpeta
  `Docs/03-Historias-Usuario/`) antes de darla por terminada ayudó a no dejar casos borde sin
  cubrir (fechas futuras, archivos de un tipo no permitido, límites de tamaño).
- Detectar y resolver un defecto en producción (el error 500 al comprar) investigando contra la
  base de datos real en vez de asumir la causa, evitó aplicar un parche que no solucionaba el
  problema de fondo.

### Qué dificultades se presentaron — ~3 min

Ideas reales para desarrollar:
- Varias historias dependían de una base que no existía todavía (el Expediente Clínico Digital)
  y hubo que construirla primero, aunque no era un objetivo explícito del Sprint por sí sola —
  esto no se había dimensionado del todo en la planificación inicial.
- Se encontraron columnas y tablas que el código ya esperaba pero que no existían todavía en la
  base de datos real de Supabase (`ORDEN.MetodoPago`, por ejemplo) — desincronización entre lo
  que se diseñó en el modelo de datos y lo que efectivamente se corrió contra la base real.
- Construir la verificación por correo para el cambio de contraseña llevó más coordinación de la
  esperada porque tocaba dos flujos distintos (el de "olvidé mi contraseña" y el de cambio ya
  autenticado) que antes vivían separados, y hubo que unificarlos sin romper ninguno de los dos.

### Qué aprendió el equipo — ~2 min

Ideas reales para desarrollar:
- Diseñar una funcionalidad "de base" reutilizable (como el Expediente Clínico) antes de
  construir las historias que dependen de ella ahorra retrabajo más adelante, aunque tome tiempo
  extra al inicio.
- Verificar el estado real de la base de datos (no solo el modelo en el código) antes de dar por
  cerrada una historia evita bugs que solo aparecen en producción.
- Cuando dos flujos parecidos (recuperar contraseña / cambiar contraseña) conviven en el
  sistema, conviene unificarlos en un solo camino en vez de mantener dos implementaciones que
  hacen casi lo mismo — es menos código que mantener y menos riesgo de que uno quede con menos
  seguridad que el otro.

### Acciones de mejora identificadas — ~3 min

Ideas reales para desarrollar:
1. Antes de dar una historia por "Done", correr una verificación explícita del estado real de la
   base de datos contra lo que el código espera, no solo confiar en el modelo de EF Core.
2. Documentar como deuda técnica (no dejar "flotando" en la memoria del equipo) cualquier
   limitación conocida en el momento en que se decide el alcance, para que quede trazable en el
   próximo Sprint Planning.
3. Priorizar, para el cierre del proyecto, las dos o tres piezas de deuda técnica documentadas
   que más impacten al usuario final (por ejemplo, que el Funcionario sí pueda tomar emergencias
   que ya puede ver).

### Cómo se aplicarían estas mejoras en futuros Sprints — ~2 min

> "Si este proyecto continuara en un Sprint 05, estas acciones entrarían directo a la
> planificación: la verificación de esquema de base de datos como parte de la Definición de
> Terminado ('Done') de cada historia que toque una tabla nueva, y las limitaciones conocidas de
> este Sprint como candidatas explícitas al backlog del próximo Sprint Planning —no como algo
> que se recuerda de memoria, sino como Work Items reales en el tablero."

*Cerrar el video con un resumen de 20-30 segundos del Scrum Master: qué se revisó, qué se
aprendió, y qué sigue.*
