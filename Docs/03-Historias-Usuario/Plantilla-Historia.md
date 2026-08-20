Historia de usuario: CRUD de Servicios Veterinarios (Consultas, Grooming y Procedimientos)

Datos generales

- Id: HU-169
- Prioridad: Alta
- Épica: Gestión de Servicios de Comercios

Historia  
Como administrador o funcionario de una veterinaria,  
quiero gestionar el catálogo de servicios que ofrezco (consultas, grooming y procedimientos),  
para que los clientes puedan encontrarlos y agendarlos desde el buscador del Marketplace, además de poder agregar servicios a cualquier veterinaria afiliada.

Criterios de aceptación

- El administrador o funcionario puede crear un servicio indicando nombre, tipo (Consulta/Grooming/Procedimiento), descripción, duración estimada y precio.
- El administrador o funcionario puede agregar tipo de consulta.
- El administrador o funcionario puede visualizar el listado de todos los servicios registrados por su comercio.
- El administrador o funcionario puede editar cualquier campo de un servicio existente.
- El administrador o funcionario puede eliminar/desactivar un servicio.
- Los servicios activos son visibles y filtrables por tipo (Consulta, Grooming, Procedimiento) en el buscador del Marketplace.
- Al seleccionar un servicio desde el Marketplace, el cliente puede iniciar el proceso de agendar una cita (ver Feature "Agenda y Programación de Citas").
- El administrador puede gestionar (crear/editar/eliminar) los servicios de cualquier veterinaria que administre.
- El funcionario solo puede gestionar los servicios de la veterinaria a la que está asignado/relacionado, no de otras.
- El nombre, tipo, duración y precio son campos obligatorios; el precio debe ser mayor a 0 y la duración mayor a 0 minutos.
- No se permite eliminar un servicio que tenga citas activas/pendientes asociadas; solo se puede desactivar (soft delete).
- Si un usuario sin permisos (ej. funcionario de otra veterinaria) intenta gestionar un servicio que no le corresponde, el sistema debe rechazar la acción y mostrar un mensaje de error claro.

Notas  
Depende de la Feature "Agenda y Programación de Citas" para el flujo de agendamiento desde el Marketplace. Relacionada con la tabla de Servicios documentada en [[Modelo-Datos]], y con la comunicación Marketplace-Backend descrita en [[Diagrama-Componentes]]. Historia padre: #168 Gestión de Servicios de Comercios. Historias hijas: #179, #177, #178.

Estado  
Implementada (2026-08-20). `ServicioController`/`ServicioService` cubren crear, editar,
desactivar (soft delete) y listar por comercio/global; `TipoServicioController` cubre el
catálogo de tipos (crear: Admin o Funcionario; activar/desactivar: solo Admin). La propiedad
de comercio se valida con el mismo mecanismo que ya usa Producto (dueño vía `PERSONA_LEGAL`,
confirmado como la fuente de verdad real — no `COMERCIO_FUNCIONARIO`, que es un directorio de
personal aparte sin relación con permisos de escritura). El frontend (`PanelServicios.jsx`) se
conectó de verdad: antes llamaba a una ruta inexistente y el modal de tipos era solo estado
local sin persistir.

De paso se detectó y corrigió una inconsistencia relacionada: no había forma de saber a qué
veterinaria pertenece cada veterinario, así que al agendar una cita sin veterinario fijo el
sistema podía asignar cualquiera de toda la base de datos. Ahora `IdVeterinario` es obligatorio
al crear/editar un servicio y se valida contra la nueva columna `VETERINARIO.IdComercio` — ver
[[Modelo-Datos]] § VETERINARIO y [[MEJORAS]] para el pendiente de correr esa migración en Supabase.