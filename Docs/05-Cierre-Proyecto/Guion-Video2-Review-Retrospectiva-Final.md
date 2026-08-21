Guion — Video 2: Review y Retrospectiva Final del Proyecto

> Cierre integral del proyecto completo (los 4 Sprints), usando la misma lógica de Sprint Review
> y Sprint Retrospective pero aplicada a todo el recorrido, más una reflexión final sobre Scrum
> como marco de trabajo. No es una repetición de la demo del producto — es un análisis de qué se
> logró y cómo se trabajó.
>
> **Completar antes de grabar:** el Objetivo del Producto que dio el profesor está reconstruido
> abajo a partir de la descripción del proyecto en la documentación técnica (`Reglas-Generales.md`)
> porque no quedó una cita textual guardada de la sesión inicial — confirmen o corrijan la
> redacción si el profesor lo planteó con otras palabras. Lo mismo aplica al alcance exacto de
> los Sprints 1-3: se reconstruyó a partir de los nombres de rama y el historial de commits del
> repositorio, no de un documento de planificación original — ajusten fechas/alcance si no
> coincide con lo que realmente se planeó en cada Sprint Planning.

Equipo Scrum: igual que en el Video 1 (ver [[Guion-Video1-SprintReview-Retro-SP04]]).

Objetivo del Producto (reconstruido): construir una plataforma web integral para clínicas
veterinarias que combine, en un mismo lugar, la gestión clínica de una veterinaria (citas,
expedientes, historial médico) con un mercado (marketplace) de productos y servicios para
mascotas — permitiendo que clientes, veterinarias, sus funcionarios y un administrador de
plataforma operen cada uno con lo que le corresponde, sin depender de sistemas ni papeles
sueltos separados.

---

## PARTE A — REVIEW FINAL DEL PROYECTO

### Apertura (Scrum Master) — ~1 min

> "Este es el cierre del proyecto completo. No vamos a repetir cada demo que ya mostramos Sprint
> a Sprint — vamos a repasar qué nos pidieron al inicio, qué construimos en total, y qué tan
> cerca quedamos de ese objetivo."

### ¿Cuál era el Objetivo del Producto? — ~1 min

*Leer/parafrasear el objetivo reconstruido de arriba, y agregar contexto de quién lo definió: el
profesor, como Product Owner del curso, al inicio del proyecto.*

### ¿Qué solución fue implementada? — ~2 min

> "Huellitas Vitales" — una SPA en React 19 conectada a una API REST en ASP.NET Core (.NET),
> sobre una base de datos PostgreSQL alojada en Supabase. Cuatro roles conviven en la misma
> plataforma: Cliente, Veterinario, Funcionario de comercio y Administrador, cada uno con su
> propio panel."

*Mostrar en pantalla, de forma breve, los cuatro paneles (Cliente, Veterinario, Funcionario,
Admin) para dar contexto visual antes de entrar al detalle por Sprint.*

### ¿Qué funcionalidades se desarrollaron, Sprint a Sprint? — ~6 min

*Compartir pantalla: tablero de Azure DevOps con el filtro por Sprint, recorriendo cada uno.*

**Sprint 1 — Cimientos: acceso y presencia de la plataforma**
- Registro y login (local, Google, Facebook), con roles y JWT.
- Landing Page pública, con sesión persistente.
- Primeras maquetas de los paneles por rol.

**Sprint 2 — El lado comercial: Marketplace y Checkout**
- Buscador del Marketplace conectado a la base de datos real.
- CRUD de productos e inventario por comercio.
- Gestión del carrito de compras (agregar, modificar cantidad, eliminar).
- Registro rápido desde el Checkout (para no perder una compra por no tener cuenta todavía).
- Solicitud y aprobación de comercios afiliados.
- Visualización y edición del perfil de usuario.

**Sprint 3 — El lado clínico: servicios y agenda**
- CRUD de servicios veterinarios (consultas, grooming, procedimientos).
- Agenda de veterinarios: disponibilidad real, solicitud, confirmación, reprogramación y
  cancelación de citas.
- Gestión de funcionarios dentro de un comercio.

**Sprint 4 — Expedientes clínicos, seguridad y cierre de brechas**
- Expediente clínico digital (creación automática, control de acceso por rol y vigencia).
- Traslado de expediente entre veterinarias, con aceptación de la veterinaria destino.
- Registro de atenciones externas (veterinarias fuera de la plataforma).
- Atención de emergencias (broadcast o veterinaria puntual), incluyendo el cierre por atención
  externa.
- Exportación del expediente en PDF.
- Notificaciones internas con redirección a la sección correspondiente.
- Panel clínico del veterinario con datos 100% reales (antes era una maqueta).
- Gestión completa de comercios afiliados desde el panel de Administración.
- CRUD completo de citas desde "Mis citas" (agendar, reprogramar, cancelar).
- Verificación por correo obligatoria para cualquier cambio de contraseña.
- Historial de compras y recibo interno de cada orden.
- Landing Page conectada a datos reales del Marketplace.
- Resolución de defectos heredados de Sprints anteriores.

### ¿Qué quedó finalmente entregado en Azure DevOps? — ~2 min

*Mostrar en pantalla el tablero completo, con el conteo total de Historias de Usuario, Tareas y
Bugs cerrados a lo largo de todo el proyecto.*

> "En total, el tablero refleja 4 Sprints con historias completas de extremo a extremo: no
> quedó ninguna funcionalidad prometida a mitad de camino sin una decisión explícita y
> documentada sobre su alcance final."

### ¿En qué medida se alcanzó el objetivo planteado? — ~2 min

> "El objetivo era una plataforma que uniera el lado comercial y el lado clínico de una
> veterinaria. Hoy la plataforma cubre ese objetivo de punta a punta: un cliente puede comprar
> un producto, agendar una cita, y también—si algo pasa con su mascota—tiene un expediente
> clínico real, puede pedir una emergencia, o trasladar ese expediente a otra clínica. No quedó
> como dos sistemas separados que conviven por accidente: comparten el mismo modelo de usuarios,
> roles y notificaciones."

*Mencionar honestamente lo que quedó fuera de alcance (ver [[Backlog-AzureDevOps-Sprint4]] §
Backlog sugerido): control de vacunas, buscador de expedientes para el veterinario, y algunas
limitaciones de permisos documentadas como deuda técnica — sin quitarle valor al cierre, mostrar
madurez reconociendo qué no se alcanzó a cubrir.*

### ¿Qué cambios o adaptaciones se realizaron durante el proyecto? — ~2 min

Ideas reales para desarrollar:
- Se migró la conexión de base de datos de SQL Server a PostgreSQL/Supabase a mitad de proyecto
  (decisión de infraestructura que tocó gran parte de la capa de datos).
- El flujo de emergencias cambió de "elegir una veterinaria obligatoriamente" a un modelo de
  broadcast (para bajar la fricción de un cliente en una situación urgente) — un ajuste que
  surgió al construir la historia, no algo planeado desde el inicio.
- La recuperación de contraseña pasó de devolver el token directo en la respuesta (una solución
  temporal, pensada solo para probar desde Swagger) a un flujo de verificación por correo real,
  al identificar que la versión temporal era un riesgo de seguridad real si llegaba a producción.
- La sección "Solicitudes" del panel de Administrador se convirtió en "Comercios" al notar que
  el administrador necesitaba gestionar comercios ya aprobados, no solo aprobar los nuevos.

### ¿Cómo respondió el equipo ante cambios y nueva información? — ~2 min

> "Cada vez que se encontró una inconsistencia entre lo que el código esperaba y lo que existía
> realmente en la base de datos (columnas o tablas faltantes), el equipo lo trató como
> información nueva a inspeccionar, no como un bloqueo: se documentó la causa, se corrigió contra
> la base real, y se dejó registrado en las notas del proyecto para que no se repitiera el mismo
> problema en otra historia."

---

## PARTE B — RETROSPECTIVA FINAL DEL PROYECTO

*Formato sugerido: cada integrante responde en primera persona a cada pregunta; el Scrum Master
va anotando en pantalla (documento compartido o pizarra) los puntos en común.*

### ¿Qué hicimos bien como Scrum Team? — ~2 min

Ideas reales para desarrollar:
- Mantener una documentación técnica viva (`Docs/`) con el estado real de cada historia, en vez
  de dejar que el conocimiento del proyecto viviera solo en la cabeza de quien lo construyó.
- Reutilizar patrones ya probados (control de acceso, notificaciones, componentes de UI
  compartidos) en vez de reconstruir la misma lógica en cada historia nueva.
- Verificar contra el entorno real (la base de datos de Supabase en producción) en vez de
  confiar ciegamente en el modelo de datos del código.

### ¿Qué dificultades enfrentamos? — ~2 min

Ideas reales para desarrollar:
- Trabajar contra una base de datos compartida sin entorno local propio (no hay una base de
  datos de pruebas separada) implicó más cuidado del habitual al correr cualquier cambio de
  esquema.
- Dos convenciones de nombres coexistiendo en el propio código (namespaces con y sin la "i" de
  "Huellitas"/"Huellas") generó confusión ocasional al mover código entre capas.
- Coordinar historias que dependían unas de otras (el Expediente Clínico como base de Traslado,
  Atenciones Externas y Emergencias) exigió secuenciar el trabajo, no repartirlo en paralelo sin
  más.

### ¿Qué decisiones o adaptaciones fueron necesarias? — ~2 min

Ideas reales para desarrollar:
- Migrar de SQL Server a PostgreSQL/Supabase a mitad de proyecto.
- Decidir explícitamente el alcance de "facturación" como un recibo interno simple, en vez de un
  sistema de facturación fiscal completo — una decisión de alcance consciente, no una limitación
  técnica.
- Priorizar seguridad (verificación por correo del cambio de contraseña) por encima de agregar
  una funcionalidad nueva, al identificar el riesgo real que representaba el flujo anterior.

### ¿Qué aprendimos durante el desarrollo? — ~2 min

Ideas reales para desarrollar:
- Un modelo de datos bien documentado (qué columna existe, cuál falta, por qué) ahorra más
  tiempo del que toma escribirlo, especialmente cuando varias personas tocan el mismo esquema.
- Construir sobre una base compartida y reutilizable (como el control de acceso a expedientes)
  paga mucho más rápido de lo esperado en las historias que vienen después.
- La seguridad no es una historia aparte que se agrega al final — cuanto antes se identifica un
  riesgo (como devolver un token sensible en una respuesta), más barato sale corregirlo.

### ¿Qué haríamos diferente si empezáramos de nuevo? — ~2 min

Ideas reales para desarrollar:
- Diseñar el modelo de datos completo (incluyendo las tablas que se sabía que se iban a
  necesitar más adelante) antes de empezar a construir, en vez de irlo descubriendo historia por
  historia.
- Definir desde el Sprint 1 una convención de nombres única para namespaces/carpetas, para no
  arrastrar la inconsistencia durante todo el proyecto.
- Incluir "verificar el esquema real de la base de datos" como parte explícita de la Definición
  de Terminado ("Done") de cualquier historia que toque una tabla nueva, desde el primer Sprint.

### ¿Cómo evolucionó la forma de trabajar del equipo? — ~2 min

> "Al inicio, cada historia se documentaba con menos detalle y las decisiones de alcance
> quedaban solo en la conversación del equipo. Para el Sprint 4, cada historia terminada incluye
> sus criterios de aceptación completos, sus limitaciones conocidas explícitas, y un estado
> verificable — el equipo pasó de simplemente 'terminar' historias a dejarlas documentadas de una
> forma que cualquiera del equipo (o alguien nuevo) podría retomar sin tener que preguntar."

### ¿Cómo se aplicó el enfoque empírico de Scrum (inspección y adaptación)? — ~2 min

> "En vez de asumir que el modelo de datos del código coincidía con la base de datos real, el
> equipo inspeccionaba directamente la base de Supabase antes de dar una historia por cerrada —
> y cuando encontraba una diferencia (una columna faltante, un estado de catálogo que no
> existía), adaptaba el plan en el momento: corría el cambio necesario contra la base real en vez
> de solo confiar en la documentación o en el diseño original. Ese ciclo de 'revisar lo real →
> ajustar' se repitió en varias historias distintas (agenda de veterinarios, checkout, perfil de
> usuario, comercios, contraseñas), no fue un caso aislado."

---

## PARTE C — REFLEXIÓN SOBRE SCRUM

### ¿Qué diferencias encontraron entre Scrum y un enfoque tradicional? — ~2 min

Ideas reales para desarrollar:
- Con Scrum, cada Sprint entregó algo que se podía mostrar y usar de verdad, en vez de esperar
  hasta el final del curso para tener un primer vistazo del producto completo.
- Los defectos y la deuda técnica se fueron documentando y priorizando Sprint a Sprint, en vez de
  acumularse sin visibilidad hasta una fase de "pruebas" al final del proyecto.
- El objetivo del producto se mantuvo estable, pero el camino para llegar (qué se construye en
  qué Sprint, y en qué orden) se fue ajustando con lo que se aprendía en cada Review —algo que un
  plan cerrado de principio a fin no permite tan fácilmente.

### ¿Qué valor aportó Scrum al desarrollo del proyecto? — ~2 min

Ideas reales para desarrollar:
- Permitió detectar temprano (en el Sprint Review de cada ciclo) cuándo algo no estaba realmente
  terminado, en vez de descubrirlo recién al final.
- La Retrospectiva de cada Sprint dio un espacio explícito para ajustar cómo trabajaba el equipo,
  no solo qué construía.

### ¿Cómo cambió la percepción del equipo sobre Scrum? — ~2 min

> "Al inicio, Scrum se sintió como una capa extra de proceso sobre el trabajo real de programar.
> Con los Sprints, se volvió evidente que documentar bien una historia, revisar el incremento con
> honestidad, y dedicarle tiempo real a la Retrospectiva (no solo como trámite) hacía que el
> Sprint siguiente arrancara con menos fricción — el proceso terminó ahorrando tiempo, no
> quitándoselo al desarrollo."

### ¿Qué aprendieron sobre gestión de proyectos, trabajo colaborativo y adaptación al cambio? — ~2 min

Ideas reales para desarrollar:
- Un backlog bien desglosado en tareas técnicas concretas (a nivel de "crear este endpoint",
  "diseñar esta pantalla") hace mucho más fácil repartir trabajo entre varias personas sin pisarse.
- Adaptarse a un cambio de infraestructura a mitad de proyecto (la migración de base de datos) es
  mucho más manejable cuando el trabajo ya está dividido en incrementos pequeños y verificables,
  en vez de un solo bloque monolítico.

### ¿Qué elementos de Scrum aplicarían en futuros proyectos, y por qué? — ~2 min

Ideas reales para desarrollar:
- La Definición de Terminado explícita (incluyendo verificar contra el entorno real, no solo el
  código) — porque evitó varios bugs que solo aparecen en producción.
- Documentar cada historia con sus criterios de aceptación y sus limitaciones conocidas, sin
  esconder lo que quedó pendiente — porque da una base honesta para planificar el siguiente ciclo
  de trabajo, tenga o no una fecha de entrega tan formal como la de este curso.

*Cerrar el video con una reflexión final breve (~1 min) del Scrum Master, resumiendo en una
frase qué le deja el proyecto al equipo.*
