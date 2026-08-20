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

**Relaciones:** un usuario puede tener un rol, varias mascotas, varias citas, varios comercios como funcionario, varios carritos y varias órdenes. También puede tener registros de autenticación externa y resolver solicitudes de comercio.

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

**Relaciones:** pertenece a un usuario, tiene un estado y contiene muchos detalles mediante `ORDEN_DETALLE`.

> `IdUsuario` es `bigint` en esta tabla, mientras que `USUARIO.IdUsuario` es `integer`.

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

## Resumen de relaciones

- `USUARIO` se relaciona con `ROL`, `VETERINARIO`, `PERSONA_LEGAL`, `COMERCIO_FUNCIONARIO`, `MASCOTA`, `CITA`, `CARRITO`, `ORDEN` y `USUARIO_PROVEEDOR_AUTH`.
- `COMERCIO` se relaciona con `PERSONA_LEGAL`, `TIPO_COMERCIO_CAT`, `ESTADO_SOLICITUD_CAT`, `PRODUCTO`, `SERVICIO` y `COMERCIO_FUNCIONARIO`.
- `PRODUCTO` se relaciona con `CATEGORIA_PRODUCTO_CAT`, `ESPECIE_CAT`, `MARCA_CAT`, `CARRITO_ITEM` y `ORDEN_DETALLE`.
- `VETERINARIO` se relaciona con `USUARIO`, `COMERCIO`, `HORARIO_VETERINARIO`, `SERVICIO` y `CITA`.
- `MASCOTA` se relaciona con `USUARIO`, `ESPECIE_CAT` y `CITA`.
- `CARRITO` se relaciona con `CARRITO_ITEM`; `ORDEN` se relaciona con `ORDEN_DETALLE`.

Las relaciones se identifican principalmente mediante campos FK escalares. Solo algunas entidades declaran propiedades de navegación en C# (`UsuarioProveedorAuth.Usuario`, `Carrito.Items`, `CarritoItem.Carrito`, `Orden.Detalles` y `OrdenDetalle.Orden`).
