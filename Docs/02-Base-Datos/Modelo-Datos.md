# Modelo de datos

Este documento resume las entidades persistentes definidas en `HuellasVitalesAPI` y su correspondencia con las tablas de PostgreSQL. `PK` identifica la clave primaria y `FK` una clave foránea. Los tipos indicados son los tipos principales del modelo de datos; los campos opcionales se marcan como `NULL`.

## USUARIO

| Campo | Tipo | Restricciones |
|---|---|---|
| `IdUsuario` | `integer` | PK |
| `Nombre` | `varchar` | Obligatorio |
| `Apellidos` | `varchar` | Obligatorio |
| `Correo` | `varchar` | Obligatorio, único |
| `Telefono` | `varchar` | NULL |
| `PasswordHash` | `varchar` | NULL |
| `Proveedor_Auth` | `varchar` | NULL |
| `Proveedor_Id` | `varchar` | NULL |
| `IdEstadoCuenta` | `smallint` | Obligatorio, FK a `ESTADO_CUENTA_CAT` |
| `IdRol` | `smallint` | Obligatorio, FK a `ROL` |
| `FechaRegistro` | `timestamp` | NULL, valor predeterminado `now()` |
| `AvatarIcono` | `varchar(30)` | NULL |

**Relaciones:** un usuario puede tener un rol, varias mascotas, varias citas, varios comercios como funcionario, varios carritos y varias órdenes. También puede tener registros de autenticación externa y resolver solicitudes de comercio.

> `AvatarIcono` guarda la clave de uno de los íconos predefinidos que el cliente puede elegir
> como avatar de perfil (ver `UsuarioService.IconosPerfilValidos`, que es la lista blanca contra
> la que se valida — el endpoint nunca acepta un valor libre). Columna nueva: falta correr en la
> Supabase real `ALTER TABLE public."USUARIO" ADD COLUMN "AvatarIcono" varchar(30) NULL;` (ver
> [[MEJORAS]]).

## USUARIO_PROVEEDOR_AUTH

| Campo | Tipo | Restricciones |
|---|---|---|
| `IdUsuarioProveedorAuth` | `integer` | PK |
| `IdUsuario` | `integer` | FK a `USUARIO` |
| `Proveedor` | `varchar(50)` | Obligatorio |
| `ProveedorId` | `varchar(255)` | Obligatorio |

**Relaciones:** cada registro pertenece a un usuario mediante `IdUsuario`.

> Esta tabla está mapeada por EF, pero no aparece en el archivo de referencia `db/schema.sql`.

## ROL

| Campo | Tipo | Restricciones |
|---|---|---|
| `IdRol` | `smallint` | PK |
| `Nombre` | `varchar` | Obligatorio, único |

**Relaciones:** un rol puede estar asociado a muchos usuarios.

## VETERINARIO

| Campo           | Tipo      | Restricciones                      |
| --------------- | --------- | ---------------------------------- |
| `IdVeterinario` | `integer` | PK                                 |
| `IdUsuario`     | `integer` | Obligatorio, FK a `USUARIO`, único |
| `Especialidad`  | `varchar` | NULL                               |
| `Descripcion`   | `varchar` | NULL                               |
| `IdComercio`    | `integer` | NULL, FK a `COMERCIO`              |

**Relaciones:** un veterinario corresponde a un usuario, ejerce en una única veterinaria (`COMERCIO` de tipo Clínica Veterinaria) y puede tener varios horarios, servicios y citas.

> `IdComercio` se agregó para cerrar una inconsistencia: antes no existía ningún vínculo entre
> un veterinario y la clínica donde trabaja, así que al agendar una cita sin veterinario fijo
> el sistema podía asignar cualquier veterinario de toda la base de datos, de cualquier
> clínica (`CitaService.CrearAsync`). Se decidió no relacionarla con
> `CARGO_CAT`/`COMERCIO_FUNCIONARIO` (esa tabla es para personal administrativo genérico; la
> fila en `VETERINARIO` ya es en sí misma la prueba del cargo — duplicarlo ahí sería la misma
> inconsistencia otra vez). Se agregó `VeterinarioController`/`VeterinarioService` para
> vincular (o desvincular) un usuario existente como veterinario de una veterinaria —Admin a
> cualquiera afiliada, Funcionario solo a la suya— así que ya no hace falta tocar la BD a mano.
> **Pendiente:** correr en Supabase
> `ALTER TABLE public."VETERINARIO" ADD COLUMN "IdComercio" integer NULL REFERENCES public."COMERCIO"("IdComercio");`
> — sin eso, todo lo anterior falla con un error de columna inexistente. Ver [[MEJORAS]].

## PASSWORD_RESET_TOKEN

| Campo | Tipo | Restricciones |
|---|---|---|
| `Id` | `integer` | PK |
| `IdUsuario` | `integer` | Identificador de usuario |
| `TokenHash` | `varchar` | — |
| `FechaExpiracion` | `timestamp` | — |
| `Usado` | `boolean` | — |

**Relaciones:** `IdUsuario` identifica al usuario asociado, aunque la entidad no declara una navegación ni una FK explícita.

> Esta tabla está mapeada por EF, pero no aparece en `db/schema.sql`.

## PERSONA_LEGAL

| Campo | Tipo | Restricciones |
|---|---|---|
| `IdPersonaLegal` | `integer` | PK |
| `IdTipoPersona` | `smallint` | Obligatorio, FK a `TIPO_PERSONA_CAT` |
| `Identificacion` | `varchar` | Obligatorio, único |
| `RAZON_SOCIAL` | `varchar` | NULL |
| `IdUsuario` | `integer` | Obligatorio, FK a `USUARIO` |

**Relaciones:** pertenece a un usuario y a un tipo de persona; puede estar asociada a uno o varios comercios según el uso de `IdPersonaLegal`.

## COMERCIO

| Campo | Tipo | Restricciones |
|---|---|---|
| `IdComercio` | `integer` | PK |
| `IdPersonaLegal` | `integer` | Obligatorio, FK a `PERSONA_LEGAL` |
| `IdTipoComercio` | `smallint` | Obligatorio, FK a `TIPO_COMERCIO_CAT` |
| `NOMBRE_COMERCIAL` | `varchar` | Obligatorio |
| `Direccion` | `varchar` | NULL |
| `Telefono` | `varchar` | NULL |
| `IdEstadoSolicitud` | `smallint` | Obligatorio, FK a `ESTADO_SOLICITUD_CAT` |
| `FECHA_SOLICITUD` | `timestamp` | NULL, valor predeterminado `now()` |
| `FECHA_RESOLUCION` | `timestamp` | NULL |
| `IDUSUARIO_RESOLVIO` | `integer` | NULL, FK a `USUARIO` |

**Relaciones:** pertenece a una persona legal y a un tipo de comercio; puede publicar productos y servicios y tener varios funcionarios.

## COMERCIO_FUNCIONARIO

| Campo | Tipo | Restricciones |
|---|---|---|
| `IdComercioFuncionario` | `integer` | PK |
| `IdComercio` | `integer` | Obligatorio, FK a `COMERCIO` |
| `IdUsuario` | `integer` | Obligatorio, FK a `USUARIO` |
| `IdCargo` | `smallint` | Obligatorio, FK a `CARGO_CAT` |
| `Activo` | `boolean` | NULL, valor predeterminado `true` |
| `FECHA_INGRESO` | `timestamp` | NULL, valor predeterminado `now()` |

**Relaciones:** vincula usuarios con comercios y cargos.

## CARGO_CAT

| Campo | Tipo | Restricciones |
|---|---|---|
| `IdCargo` | `smallint` | PK |
| `Nombre` | `varchar` | Obligatorio, único |

**Relaciones:** un cargo puede utilizarse en varios registros de `COMERCIO_FUNCIONARIO`.

## TIPO_PERSONA_CAT

| Campo | Tipo | Restricciones |
|---|---|---|
| `IdTipoPersona` | `smallint` | PK |
| `Nombre` | `varchar` | Obligatorio |

**Relaciones:** un tipo de persona puede clasificar varias personas legales.

## TIPO_COMERCIO_CAT

| Campo | Tipo | Restricciones |
|---|---|---|
| `IdTipoComercio` | `smallint` | PK |
| `Nombre` | `varchar` | Obligatorio |

**Relaciones:** un tipo de comercio puede clasificar varios comercios.

## ESTADO_CUENTA_CAT

| Campo | Tipo | Restricciones |
|---|---|---|
| `IdEstadoCuenta` | `smallint` | PK |
| `Nombre` | `varchar` | Catálogo de estados |

**Relaciones:** un estado puede estar asociado a muchos usuarios.

> Esta tabla es referenciada por `USUARIO`, pero no tiene una entidad C# ni un `DbSet` en `ConexionDB`.

## ESTADO_SOLICITUD_CAT

| Campo | Tipo | Restricciones |
|---|---|---|
| `IdEstadoSolicitud` | `smallint` | PK |
| `Nombre` | `varchar` | Catálogo de estados |

**Relaciones:** un estado puede estar asociado a muchos comercios.

> Esta tabla es referenciada por `COMERCIO`, pero no tiene una entidad C# ni un `DbSet` en `ConexionDB`.

## PRODUCTO

| Campo | Tipo | Restricciones |
|---|---|---|
| `IdProducto` | `integer` | PK |
| `IdComercio` | `integer` | Obligatorio, FK a `COMERCIO` |
| `IdCategoria` | `smallint` | Obligatorio, FK a `CATEGORIA_PRODUCTO_CAT` |
| `IdEspecie` | `smallint` | NULL, FK a `ESPECIE_CAT` |
| `IdMarca` | `integer` | NULL, FK a `MARCA_CAT` |
| `Sku` | `varchar` | NULL |
| `Nombre` | `varchar` | Obligatorio |
| `Descripcion` | `varchar` | NULL |
| `Precio` | `numeric` | Obligatorio |
| `PRECIO_DESCUENTO` | `numeric` | NULL |
| `Stock` | `integer` | NULL |
| `IMAGEN_URL` | `varchar` | NULL |
| `Activo` | `boolean` | NULL, valor predeterminado `true` |
| `FECHA_CREACION` | `timestamp` | NULL, valor predeterminado `now()` |

**Relaciones:** pertenece a un comercio, una categoría, una especie opcional y una marca opcional. Puede aparecer en ítems de carrito y detalles de orden.

## CATEGORIA_PRODUCTO_CAT

| Campo | Tipo | Restricciones |
|---|---|---|
| `IdCategoria` | `smallint` | PK |
| `Nombre` | `varchar` | Obligatorio, único |

**Relaciones:** una categoría puede clasificar muchos productos.

## ESPECIE_CAT

| Campo | Tipo | Restricciones |
|---|---|---|
| `IdEspecie` | `smallint` | PK |
| `Nombre` | `varchar` | Obligatorio, único |

**Relaciones:** una especie puede estar asociada a muchas mascotas y productos.

## MARCA_CAT

| Campo | Tipo | Restricciones |
|---|---|---|
| `IdMarca` | `integer` | PK |
| `Nombre` | `varchar` | Obligatorio, único |

**Relaciones:** una marca puede estar asociada a muchos productos.

## SERVICIO

| Campo | Tipo | Restricciones |
|---|---|---|
| `IdServicio` | `integer` | PK |
| `IdComercio` | `integer` | Obligatorio, FK a `COMERCIO` |
| `Nombre` | `varchar` | Obligatorio |
| `Descripcion` | `varchar` | NULL |
| `DuracionMinutos` | `integer` | Obligatorio |
| `Precio` | `numeric` | Obligatorio |
| `Activo` | `boolean` | Obligatorio, valor predeterminado `true` |
| `IdTipoServicio` | `smallint` | Obligatorio, FK a `TIPO_SERVICIO_CAT` |
| `IdVeterinario` | `integer` | NULL en el modelo (ver nota) |

**Relaciones:** pertenece a un comercio y a un tipo de servicio. Se asocia a un veterinario y es referenciado por citas.

> `IdVeterinario` existe en la entidad y en la columna real de `SERVICIO`, pero no tiene una FK
> declarada a nivel de EF. La API (`ServicioController`/`ServicioService`) lo exige como
> obligatorio al crear o editar un servicio (`CrearServicioRequest`/`EditarServicioRequest`) y
> valida que el veterinario elegido pertenezca al mismo `IdComercio` del servicio —así que en
> la práctica funciona como una FK compuesta aplicada en la capa de negocio, no en la BD.

## TIPO_SERVICIO_CAT

| Campo | Tipo | Restricciones |
|---|---|---|
| `IdTipoServicio` | `smallint` | PK |
| `Nombre` | `varchar` | Obligatorio, único |
| `Activo` | `boolean` | Obligatorio, valor predeterminado `true` |

**Relaciones:** un tipo de servicio puede clasificar muchos servicios.

> Catálogo compartido entre todas las veterinarias (no pertenece a un comercio). Se gestiona
> vía `TipoServicioController` (`GET /api/tiposervicio` público, `POST` y `PUT /{id}/estado`
> solo Admin) — ver [[Diagrama-Componentes]]. El Funcionario no puede crear tipos directo: pasa
> por `SOLICITUD_TIPO_SERVICIO` (ver abajo).

## SOLICITUD_TIPO_SERVICIO

| Campo | Tipo | Restricciones |
|---|---|---|
| `IdSolicitudTipoServicio` | `integer` | PK |
| `Nombre` | `varchar(100)` | Obligatorio |
| `IdUsuarioSolicitante` | `integer` | Obligatorio, FK a `USUARIO` |
| `IdComercio` | `integer` | NULL, FK a `COMERCIO` |
| `IdEstadoSolicitud` | `smallint` | Obligatorio, FK a `ESTADO_SOLICITUD_CAT`, valor predeterminado `1` |
| `FechaSolicitud` | `timestamp` | Obligatorio, valor predeterminado `now()` |
| `FechaResolucion` | `timestamp` | NULL |
| `IdUsuarioResolvio` | `integer` | NULL, FK a `USUARIO` |

**Relaciones:** pertenece al usuario que la solicitó y, opcionalmente, a la veterinaria desde
la que se pidió; su estado usa el mismo catálogo `ESTADO_SOLICITUD_CAT` que ya usa `COMERCIO`
(1=pendiente, 2=aprobada, 3=rechazada — valores confirmados por el código existente de
`ComercioService`, no solo documentados).

> Un Funcionario (dueño de una veterinaria) que quiere un tipo de servicio que no existe en el
> catálogo crea aquí una solicitud `Pendiente` en vez de escribir directo en
> `TIPO_SERVICIO_CAT`. Un Admin la aprueba (crea el tipo real en `TIPO_SERVICIO_CAT`) o la
> rechaza (no crea nada). Se mantiene en su propia tabla — no como columnas extra en
> `TIPO_SERVICIO_CAT` — para no mezclar solicitudes pendientes/rechazadas dentro de una tabla
> `*_CAT`, que por convención de este proyecto es un catálogo simple (ver `CLAUDE.md`).
> **Pendiente:** correr en Supabase
> ```sql
> CREATE TABLE public."SOLICITUD_TIPO_SERVICIO" (
>   "IdSolicitudTipoServicio" integer GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
>   "Nombre" varchar(100) NOT NULL,
>   "IdUsuarioSolicitante" integer NOT NULL REFERENCES public."USUARIO"("IdUsuario"),
>   "IdComercio" integer NULL REFERENCES public."COMERCIO"("IdComercio"),
>   "IdEstadoSolicitud" smallint NOT NULL DEFAULT 1 REFERENCES public."ESTADO_SOLICITUD_CAT"("IdEstadoSolicitud"),
>   "FechaSolicitud" timestamp NOT NULL DEFAULT now(),
>   "FechaResolucion" timestamp NULL,
>   "IdUsuarioResolvio" integer NULL REFERENCES public."USUARIO"("IdUsuario")
> );
> ```
> Ver [[MEJORAS]].

## CARRITO

| Campo | Tipo | Restricciones |
|---|---|---|
| `IdCarrito` | `integer` | PK |
| `IdUsuario` | `bigint` | Obligatorio, FK a `USUARIO` |
| `FechaCreacion` | `timestamp with time zone` | Obligatorio, valor predeterminado `now()` |

**Relaciones:** pertenece a un usuario y contiene muchos ítems mediante `CARRITO_ITEM`.

> `IdUsuario` es `bigint` en esta tabla, mientras que `USUARIO.IdUsuario` es `integer`.

## CARRITO_ITEM

| Campo | Tipo | Restricciones |
|---|---|---|
| `IdCarritoItem` | `integer` | PK |
| `IdCarrito` | `integer` | Obligatorio, FK a `CARRITO` |
| `IdProducto` | `integer` | Obligatorio, FK a `PRODUCTO` |
| `Cantidad` | `integer` | Obligatorio |
| `PrecioUnitario` | `numeric` | Obligatorio |
| `FechaAgregado` | `timestamp with time zone` | Obligatorio, valor predeterminado `now()` |

**Relaciones:** pertenece a un carrito y referencia un producto.

## ORDEN

| Campo | Tipo | Restricciones |
|---|---|---|
| `IdOrden` | `integer` | PK |
| `IdUsuario` | `bigint` | Obligatorio, FK a `USUARIO` |
| `IdEstadoOrden` | `smallint` | Obligatorio, FK a `ESTADO_ORDEN_CAT` |
| `Total` | `numeric` | Obligatorio |
| `FechaOrden` | `timestamp with time zone` | Obligatorio, valor predeterminado `now()` |
| `MetodoPago` | `varchar` | NULL |

**Relaciones:** pertenece a un usuario, tiene un estado y contiene muchos detalles mediante `ORDEN_DETALLE`.

> `IdUsuario` es `bigint` en esta tabla, mientras que `USUARIO.IdUsuario` es `integer`.

> `MetodoPago` guarda el texto libre elegido en la simulación de checkout del carrito
> (`"tarjeta"`, `"sinpe"` o `"efectivo"` — ver `ModalMetodoPago.jsx`). No valida contra ningún
> catálogo: como todo el pago es simulado (no hay pasarela real), es solo el dato que se
> muestra en el recibo/factura de "Mis compras". Columna ya corrida en la Supabase real
> (`ALTER TABLE public."ORDEN" ADD COLUMN "MetodoPago" varchar NULL;`, ver [[MEJORAS]]).

## ORDEN_DETALLE

| Campo | Tipo | Restricciones |
|---|---|---|
| `IdOrdenDetalle` | `integer` | PK |
| `IdOrden` | `integer` | Obligatorio, FK a `ORDEN` |
| `IdProducto` | `integer` | Obligatorio, FK a `PRODUCTO` |
| `Cantidad` | `integer` | Obligatorio |
| `PrecioUnitario` | `numeric` | Obligatorio |

**Relaciones:** pertenece a una orden y referencia un producto.

## ESTADO_ORDEN_CAT

| Campo | Tipo | Restricciones |
|---|---|---|
| `IdEstadoOrden` | `smallint` | PK |
| `Nombre` | `varchar` | Catálogo de estados |

**Relaciones:** un estado puede estar asociado a muchas órdenes.

> Esta tabla es referenciada por `ORDEN`, pero no tiene una entidad C# ni un `DbSet` en `ConexionDB`.

## MASCOTA

| Campo | Tipo | Restricciones |
|---|---|---|
| `IdMascota` | `integer` | PK |
| `IdUsuario` | `integer` | Obligatorio, FK a `USUARIO` |
| `Nombre` | `varchar` | Obligatorio |
| `IdEspecie` | `smallint` | NULL, FK a `ESPECIE_CAT` |
| `Raza` | `varchar` | NULL |
| `FechaNacimiento` | `date` | NULL |
| `Activo` | `boolean` | Obligatorio, valor predeterminado `true` |

**Relaciones:** pertenece a un usuario y puede participar en varias citas; su especie es opcional.

## HORARIO_VETERINARIO

| Campo | Tipo | Restricciones |
|---|---|---|
| `IdHorario` | `integer` | PK |
| `IdVeterinario` | `integer` | Obligatorio, FK a `VETERINARIO` |
| `DiaSemana` | `smallint` | Obligatorio, valores de 0 a 6 |
| `HoraInicio` | `time` | Obligatorio |
| `HoraFin` | `time` | Obligatorio |
| `Activo` | `boolean` | Obligatorio, valor predeterminado `true` |

**Relaciones:** cada horario pertenece a un veterinario.

## ESTADO_CITA_CAT

| Campo | Tipo | Restricciones |
|---|---|---|
| `IdEstadoCita` | `smallint` | PK |
| `Nombre` | `varchar` | Obligatorio, único |

**Relaciones:** un estado puede estar asociado a muchas citas.

## CITA

| Campo | Tipo | Restricciones |
|---|---|---|
| `IdCita` | `integer` | PK |
| `IdUsuario` | `integer` | Obligatorio, FK a `USUARIO` |
| `IdMascota` | `integer` | Obligatorio, FK a `MASCOTA` |
| `IdVeterinario` | `integer` | Obligatorio, FK a `VETERINARIO` |
| `IdServicio` | `integer` | Obligatorio, FK a `SERVICIO` |
| `IdEstadoCita` | `smallint` | Obligatorio, FK a `ESTADO_CITA_CAT`, valor predeterminado `1` |
| `Fecha` | `date` | Obligatorio |
| `HoraInicio` | `time` | Obligatorio |
| `HoraFin` | `time` | Obligatorio |
| `Notas` | `varchar` | NULL |
| `FechaCreacion` | `timestamp with time zone` | Obligatorio, valor predeterminado `now()` |

**Relaciones:** pertenece a un usuario, una mascota, un veterinario, un servicio y un estado de cita.

## EXPEDIENTE

| Campo | Tipo | Restricciones |
|---|---|---|
| `IdExpediente` | `integer` | PK |
| `IdMascota` | `integer` | Obligatorio, único, FK a `MASCOTA` |
| `IdComercioActual` | `integer` | NULL, FK a `COMERCIO` |
| `FechaApertura` | `timestamp with time zone` | Obligatorio, valor predeterminado `now()` |
| `Activo` | `boolean` | Obligatorio, valor predeterminado `true` |

**Relaciones:** un expediente pertenece a una única mascota (relación 1 a 1, `IdMascota` es único) y acumula historial en `EXPEDIENTE_COMERCIO`, `SOLICITUD_TRASLADO_EXPEDIENTE`, `ATENCION_EXTERNA` y `EMERGENCIA`.

> `IdComercioActual` es nullable a propósito (originalmente era `NOT NULL`; se corrió
> `ALTER TABLE public."EXPEDIENTE" ALTER COLUMN "IdComercioActual" DROP NOT NULL;` en Supabase).
> Una mascota que nunca tuvo una cita no tiene ninguna veterinaria de la que "partir", pero
> igual necesita poder abrir su expediente: `ExpedienteService.ObtenerOCrearAsync` lo crea solo
> cuando encuentra una cita previa (resuelve la veterinaria vía `CITA → SERVICIO → COMERCIO`,
> porque `CITA` no tiene FK directa a `COMERCIO`); si no hay cita, el cliente puede abrirlo
> igual eligiendo una veterinaria puntual (`AbrirEligiendoVeterinariaAsync`, usado por
> Emergencia y Traslado) o sin elegir ninguna (`AbrirSinVeterinariaAsync`, usado por Atenciones
> Externas, que por definición no tiene relación con ninguna veterinaria de la plataforma).

## EXPEDIENTE_COMERCIO

| Campo | Tipo | Restricciones |
|---|---|---|
| `IdExpedienteComercio` | `integer` | PK |
| `IdExpediente` | `integer` | Obligatorio, FK a `EXPEDIENTE` |
| `IdComercio` | `integer` | Obligatorio, FK a `COMERCIO` |
| `PuedeConsultar` | `boolean` | Obligatorio, valor predeterminado `true` |
| `PuedeModificar` | `boolean` | Obligatorio, valor predeterminado `false` |
| `FechaDesde` | `timestamp with time zone` | Obligatorio, valor predeterminado `now()` |
| `FechaHasta` | `timestamp with time zone` | NULL — `NULL` significa acceso vigente |
| — | — | `UNIQUE (IdExpediente, IdComercio, FechaHasta)` |

**Relaciones:** es el historial de qué veterinaria(s) tuvieron acceso a un expediente y con qué permisos. Se siembra automáticamente al abrir el expediente (`PuedeConsultar`/`PuedeModificar` en `true`) y se actualiza al aceptar un traslado: la fila del origen se cierra (`FechaHasta = now()`, `PuedeModificar = false`) y se crea una fila nueva para el destino.

> `ExpedienteService.EvaluarAccesoAsync` es la única fuente de verdad de permisos sobre un
> expediente: dueño de la mascota (solo consulta), Admin (ambos siempre), o una veterinaria con
> fila vigente aquí (`FechaHasta IS NULL`) para ese comercio — sea dueño vía `PERSONA_LEGAL` o
> funcionario activo vía `COMERCIO_FUNCIONARIO`.

## SOLICITUD_TRASLADO_EXPEDIENTE

| Campo | Tipo | Restricciones |
|---|---|---|
| `IdSolicitudTraslado` | `integer` | PK |
| `IdExpediente` | `integer` | Obligatorio, FK a `EXPEDIENTE` |
| `IdComercioOrigen` | `integer` | Obligatorio, FK a `COMERCIO` |
| `IdComercioDestino` | `integer` | Obligatorio, FK a `COMERCIO` |
| `IdUsuarioSolicitante` | `integer` | Obligatorio, FK a `USUARIO` |
| `Estado` | `varchar(20)` | Obligatorio, `CHECK IN ('Pendiente','Aceptada','Rechazada','Cancelada')`, predeterminado `'Pendiente'` |
| `Motivo` | `varchar(1000)` | NULL |
| `Respuesta` | `varchar(1000)` | NULL |
| `FechaSolicitud` | `timestamp with time zone` | Obligatorio, valor predeterminado `now()` |
| `FechaResolucion` | `timestamp with time zone` | NULL |
| `IdUsuarioResuelve` | `integer` | NULL, FK a `USUARIO` |
| — | — | `CHECK (IdComercioOrigen <> IdComercioDestino)`; índice único parcial: una sola solicitud `Pendiente` por expediente |

**Relaciones:** pertenece al expediente que se quiere trasladar, referencia la veterinaria de origen y destino, y al usuario (siempre el dueño de la mascota) que la solicitó.

> Requiere que el expediente ya tenga `IdComercioActual` (no se puede solicitar un traslado
> "desde ningún lado" — `TrasladoExpedienteService.SolicitarAsync` lo rechaza con 400 si es
> `NULL`). Al aceptar, la veterinaria destino queda con acceso vigente en `EXPEDIENTE_COMERCIO`
> y `EXPEDIENTE.IdComercioActual` se actualiza — todo dentro de una transacción.

## NOTIFICACION

| Campo | Tipo | Restricciones |
|---|---|---|
| `IdNotificacion` | `integer` | PK |
| `IdUsuario` | `integer` | Obligatorio, FK a `USUARIO` |
| `Titulo` | `varchar(150)` | Obligatorio |
| `Mensaje` | `varchar(1000)` | Obligatorio |
| `Tipo` | `varchar(40)` | Obligatorio — hoy solo `"Emergencia"` o `"TrasladoExpediente"` |
| `Leida` | `boolean` | Obligatorio, valor predeterminado `false` |
| `FechaCreacion` | `timestamp with time zone` | Obligatorio, valor predeterminado `now()` |
| `ReferenciaTipo` | `varchar(50)` | NULL — `"Emergencia"` o `"SolicitudTraslado"` |
| `ReferenciaId` | `integer` | NULL — el `IdEmergencia` o `IdSolicitudTraslado` referenciado |

**Relaciones:** cada notificación pertenece a un usuario; `ReferenciaTipo`/`ReferenciaId` apuntan (sin FK real, es polimórfico) al registro que la originó.

> `Tipo` es lo que usa la campanita del frontend (`NotificacionesBell.jsx`) para decidir a dónde
> redirigir al usuario al hacer clic — ver [[Diagrama-Componentes]] § Notificaciones.

## ATENCION_EXTERNA

| Campo | Tipo | Restricciones |
|---|---|---|
| `IdAtencionExterna` | `integer` | PK |
| `IdExpediente` | `integer` | Obligatorio, FK a `EXPEDIENTE` |
| `IdUsuarioRegistro` | `integer` | Obligatorio, FK a `USUARIO` (siempre el dueño de la mascota) |
| `NombreVeterinaria` | `varchar(200)` | Obligatorio — texto libre, no referencia `COMERCIO` |
| `NombreProfesional` | `varchar(200)` | NULL |
| `FechaAtencion` | `timestamp with time zone` | Obligatorio |
| `Motivo` | `varchar(1000)` | Obligatorio |
| `Diagnostico` | `varchar(4000)` | NULL |
| `Tratamiento` | `varchar(4000)` | NULL |
| `FechaRegistro` | `timestamp with time zone` | Obligatorio, valor predeterminado `now()` |

**Relaciones:** pertenece a un expediente y puede tener varios comprobantes adjuntos mediante `DOCUMENTO_ATENCION_EXTERNA`.

> Autorreportada por el cliente sobre una consulta que pasó **fuera** de Huellitas Vitales — por
> eso `NombreVeterinaria`/`NombreProfesional` son texto libre en vez de FK: no hay ninguna
> veterinaria de la plataforma involucrada.

## DOCUMENTO_ATENCION_EXTERNA

| Campo | Tipo | Restricciones |
|---|---|---|
| `IdDocumentoAtencionExterna` | `integer` | PK |
| `IdAtencionExterna` | `integer` | Obligatorio, FK a `ATENCION_EXTERNA`, `ON DELETE CASCADE` |
| `NombreOriginal` | `varchar(255)` | Obligatorio |
| `RutaArchivo` | `varchar(500)` | Obligatorio — ruta relativa bajo `wwwroot/uploads/atenciones-externas/` |
| `TipoContenido` | `varchar(100)` | Obligatorio (MIME type) |
| `TamanoBytes` | `bigint` | Obligatorio |
| `FechaCarga` | `timestamp with time zone` | Obligatorio, valor predeterminado `now()` |

**Relaciones:** cada documento pertenece a una atención externa (PDF/imagen del comprobante, factura, etc.).

## EMERGENCIA

| Campo | Tipo | Restricciones |
|---|---|---|
| `IdEmergencia` | `integer` | PK |
| `IdExpediente` | `integer` | Obligatorio, FK a `EXPEDIENTE` |
| `IdUsuarioSolicitante` | `integer` | Obligatorio, FK a `USUARIO` |
| `IdComercio` | `integer` | NULL, FK a `COMERCIO` |
| `IdVeterinario` | `integer` | NULL, FK a `VETERINARIO` |
| `Estado` | `varchar(20)` | Obligatorio, `CHECK IN ('Solicitada','Aceptada','EnAtencion','Finalizada','Cancelada')`, predeterminado `'Solicitada'` |
| `Ubicacion` | `varchar(500)` | Obligatorio |
| `Motivo` | `varchar(500)` | Obligatorio |
| `Descripcion` | `varchar(4000)` | NULL |
| `FechaSolicitud` | `timestamp with time zone` | Obligatorio, valor predeterminado `now()` |
| `FechaInicio` | `timestamp with time zone` | NULL |
| `FechaFinalizacion` | `timestamp with time zone` | NULL |
| `Diagnostico` | `varchar(4000)` | NULL |
| `Tratamiento` | `varchar(4000)` | NULL |
| `EsAtencionExterna` | `boolean` | Obligatorio, valor predeterminado `false` |
| `NombreVeterinarioExterno` | `varchar(200)` | NULL |
| `NombreClinicaExterna` | `varchar(200)` | NULL |

**Relaciones:** pertenece a un expediente y al usuario que la solicitó; opcionalmente a un comercio y a un veterinario (el que la acepta). El teléfono de contacto **no** se guarda aquí: se resuelve en el momento vía `USUARIO.Telefono` del solicitante (join en `EmergenciaService.PendientesAsync`/`EnCursoAsync`), para que la veterinaria siempre vea el número vigente en vez de una copia vieja.

> `IdComercio` es nullable a propósito: es el mecanismo de **broadcast**. Si el cliente no
> elige una veterinaria puntual, la emergencia se crea con `IdComercio = NULL` y se notifica a
> **todas** las veterinarias aprobadas; la primera que acepta (`EmergenciaService.AceptarAsync`)
> "reclama" la emergencia asignándole el comercio de quien aceptó, para que los reportes de esa
> clínica la reconozcan después. No hay bloqueo optimista sobre el `Estado`, así que en teoría
> dos aceptaciones simultáneas podrían pisarse — riesgo aceptado dado el volumen esperado, ver
> [[MEJORAS]].

## Resumen de relaciones

- `USUARIO` se relaciona con `ROL`, `VETERINARIO`, `PERSONA_LEGAL`, `COMERCIO_FUNCIONARIO`, `MASCOTA`, `CITA`, `CARRITO`, `ORDEN` y `USUARIO_PROVEEDOR_AUTH`.
- `COMERCIO` se relaciona con `PERSONA_LEGAL`, `TIPO_COMERCIO_CAT`, `ESTADO_SOLICITUD_CAT`, `PRODUCTO`, `SERVICIO` y `COMERCIO_FUNCIONARIO`.
- `PRODUCTO` se relaciona con `CATEGORIA_PRODUCTO_CAT`, `ESPECIE_CAT`, `MARCA_CAT`, `CARRITO_ITEM` y `ORDEN_DETALLE`.
- `VETERINARIO` se relaciona con `USUARIO`, `COMERCIO`, `HORARIO_VETERINARIO`, `SERVICIO` y `CITA`.
- `MASCOTA` se relaciona con `USUARIO`, `ESPECIE_CAT`, `CITA` y `EXPEDIENTE` (1 a 1).
- `CARRITO` se relaciona con `CARRITO_ITEM`; `ORDEN` se relaciona con `ORDEN_DETALLE`.
- `EXPEDIENTE` se relaciona con `MASCOTA` (1 a 1), `COMERCIO` (veterinaria actual, opcional), y con su propio historial en `EXPEDIENTE_COMERCIO`, `SOLICITUD_TRASLADO_EXPEDIENTE`, `ATENCION_EXTERNA` y `EMERGENCIA`.
- `EMERGENCIA` se relaciona con `EXPEDIENTE`, `USUARIO` (solicitante), `COMERCIO` (opcional, `NULL` = broadcast a todas) y `VETERINARIO` (quien acepta).
- `NOTIFICACION` se relaciona con `USUARIO`; referencia de forma polimórfica (`ReferenciaTipo`/`ReferenciaId`, sin FK) una `EMERGENCIA` o `SOLICITUD_TRASLADO_EXPEDIENTE`.

Las relaciones se identifican principalmente mediante campos FK escalares. Solo algunas entidades declaran propiedades de navegación en C# (`UsuarioProveedorAuth.Usuario`, `Carrito.Items`, `CarritoItem.Carrito`, `Orden.Detalles` y `OrdenDetalle.Orden`).
