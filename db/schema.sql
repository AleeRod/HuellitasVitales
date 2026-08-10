-- Esquema de referencia de la base de datos (Supabase / PostgreSQL).
--
-- NO EJECUTAR. Es un volcado de solo lectura para consulta: el orden de las
-- tablas y las restricciones no están garantizados para ejecución. La fuente
-- de verdad es la base de datos en Supabase; el proyecto no usa migraciones
-- de EF Core, así que este archivo debe actualizarse a mano cuando el esquema
-- cambie.
--
-- Los identificadores son sensibles a mayúsculas (quoted) en Postgres: las
-- entidades de EF deben mapear el nombre exacto con [Table]/[Column].

CREATE TABLE public.CARGO_CAT (
  IdCargo smallint GENERATED ALWAYS AS IDENTITY NOT NULL,
  Nombre character varying NOT NULL UNIQUE,
  CONSTRAINT CARGO_CAT_pkey PRIMARY KEY (IdCargo)
);
CREATE TABLE public.CATEGORIA_PRODUCTO_CAT (
  IdCategoria smallint GENERATED ALWAYS AS IDENTITY NOT NULL,
  Nombre character varying NOT NULL UNIQUE,
  CONSTRAINT CATEGORIA_PRODUCTO_CAT_pkey PRIMARY KEY (IdCategoria)
);
CREATE TABLE public.ESPECIE_CAT (
  IdEspecie smallint GENERATED ALWAYS AS IDENTITY NOT NULL,
  Nombre character varying NOT NULL UNIQUE,
  CONSTRAINT ESPECIE_CAT_pkey PRIMARY KEY (IdEspecie)
);
CREATE TABLE public.ESTADO_CUENTA_CAT (
  IdEstadoCuenta smallint GENERATED ALWAYS AS IDENTITY NOT NULL,
  Nombre character varying NOT NULL UNIQUE,
  CONSTRAINT ESTADO_CUENTA_CAT_pkey PRIMARY KEY (IdEstadoCuenta)
);
CREATE TABLE public.ESTADO_SOLICITUD_CAT (
  IdEstadoSolicitud smallint GENERATED ALWAYS AS IDENTITY NOT NULL,
  Nombre character varying NOT NULL UNIQUE,
  CONSTRAINT ESTADO_SOLICITUD_CAT_pkey PRIMARY KEY (IdEstadoSolicitud)
);
CREATE TABLE public.MARCA_CAT (
  IdMarca integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  Nombre character varying NOT NULL UNIQUE,
  CONSTRAINT MARCA_CAT_pkey PRIMARY KEY (IdMarca)
);
CREATE TABLE public.ROL (
  IdRol smallint GENERATED ALWAYS AS IDENTITY NOT NULL,
  Nombre character varying NOT NULL UNIQUE,
  CONSTRAINT ROL_pkey PRIMARY KEY (IdRol)
);
CREATE TABLE public.TIPO_COMERCIO_CAT (
  IdTipoComercio smallint GENERATED ALWAYS AS IDENTITY NOT NULL,
  Nombre character varying NOT NULL UNIQUE,
  CONSTRAINT TIPO_COMERCIO_CAT_pkey PRIMARY KEY (IdTipoComercio)
);
CREATE TABLE public.TIPO_PERSONA_CAT (
  IdTipoPersona smallint GENERATED ALWAYS AS IDENTITY NOT NULL,
  Nombre character varying NOT NULL UNIQUE,
  CONSTRAINT TIPO_PERSONA_CAT_pkey PRIMARY KEY (IdTipoPersona)
);
CREATE TABLE public.USUARIO (
  IdUsuario integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  Nombre character varying NOT NULL,
  Apellidos character varying NOT NULL,
  Correo character varying NOT NULL UNIQUE,
  Telefono character varying,
  PasswordHash character varying,
  Proveedor_Auth character varying DEFAULT 'Local'::character varying,
  Proveedor_Id character varying,
  IdEstadoCuenta smallint NOT NULL DEFAULT 1,
  IdRol smallint NOT NULL,
  FechaRegistro timestamp without time zone DEFAULT now(),
  CONSTRAINT USUARIO_pkey PRIMARY KEY (IdUsuario),
  CONSTRAINT usuario_idestadocuenta_fkey FOREIGN KEY (IdEstadoCuenta) REFERENCES public.ESTADO_CUENTA_CAT(IdEstadoCuenta),
  CONSTRAINT usuario_idrol_fkey FOREIGN KEY (IdRol) REFERENCES public.ROL(IdRol)
);
CREATE TABLE public.PERSONA_LEGAL (
  IdPersonaLegal integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  IdTipoPersona smallint NOT NULL,
  Identificacion character varying NOT NULL UNIQUE,
  RAZON_SOCIAL character varying,
  IdUsuario integer NOT NULL,
  CONSTRAINT PERSONA_LEGAL_pkey PRIMARY KEY (IdPersonaLegal),
  CONSTRAINT persona_legal_idtipopersona_fkey FOREIGN KEY (IdTipoPersona) REFERENCES public.TIPO_PERSONA_CAT(IdTipoPersona),
  CONSTRAINT persona_legal_idusuario_fkey FOREIGN KEY (IdUsuario) REFERENCES public.USUARIO(IdUsuario)
);
CREATE TABLE public.COMERCIO (
  IdComercio integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  IdPersonaLegal integer NOT NULL,
  IdTipoComercio smallint NOT NULL,
  NOMBRE_COMERCIAL character varying NOT NULL,
  Direccion character varying,
  Telefono character varying,
  IdEstadoSolicitud smallint NOT NULL DEFAULT 1,
  FECHA_SOLICITUD timestamp without time zone DEFAULT now(),
  FECHA_RESOLUCION timestamp without time zone,
  IDUSUARIO_RESOLVIO integer,
  CONSTRAINT COMERCIO_pkey PRIMARY KEY (IdComercio),
  CONSTRAINT comercio_idestadosolicitud_fkey FOREIGN KEY (IdEstadoSolicitud) REFERENCES public.ESTADO_SOLICITUD_CAT(IdEstadoSolicitud),
  CONSTRAINT comercio_idpersonalegal_fkey FOREIGN KEY (IdPersonaLegal) REFERENCES public.PERSONA_LEGAL(IdPersonaLegal),
  CONSTRAINT comercio_idtipocomercio_fkey FOREIGN KEY (IdTipoComercio) REFERENCES public.TIPO_COMERCIO_CAT(IdTipoComercio),
  CONSTRAINT comercio_idusuario_resolvio_fkey FOREIGN KEY (IDUSUARIO_RESOLVIO) REFERENCES public.USUARIO(IdUsuario)
);
CREATE TABLE public.COMERCIO_FUNCIONARIO (
  IdComercioFuncionario integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  IdComercio integer NOT NULL,
  IdUsuario integer NOT NULL,
  IdCargo smallint NOT NULL,
  Activo boolean DEFAULT true,
  FECHA_INGRESO timestamp without time zone DEFAULT now(),
  CONSTRAINT COMERCIO_FUNCIONARIO_pkey PRIMARY KEY (IdComercioFuncionario),
  CONSTRAINT comercio_funcionario_idcargo_fkey FOREIGN KEY (IdCargo) REFERENCES public.CARGO_CAT(IdCargo),
  CONSTRAINT comercio_funcionario_idcomercio_fkey FOREIGN KEY (IdComercio) REFERENCES public.COMERCIO(IdComercio),
  CONSTRAINT comercio_funcionario_idusuario_fkey FOREIGN KEY (IdUsuario) REFERENCES public.USUARIO(IdUsuario)
);
CREATE TABLE public.PRODUCTO (
  IdProducto integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  IdComercio integer NOT NULL,
  IdCategoria smallint NOT NULL,
  IdEspecie smallint,
  IdMarca integer,
  Sku character varying,
  Nombre character varying NOT NULL,
  Descripcion character varying,
  Precio numeric NOT NULL,
  PRECIO_DESCUENTO numeric,
  Stock integer,
  IMAGEN_URL character varying,
  Activo boolean DEFAULT true,
  FECHA_CREACION timestamp without time zone DEFAULT now(),
  CONSTRAINT PRODUCTO_pkey PRIMARY KEY (IdProducto),
  CONSTRAINT producto_idcategoria_fkey FOREIGN KEY (IdCategoria) REFERENCES public.CATEGORIA_PRODUCTO_CAT(IdCategoria),
  CONSTRAINT producto_idcomercio_fkey FOREIGN KEY (IdComercio) REFERENCES public.COMERCIO(IdComercio),
  CONSTRAINT producto_idespecie_fkey FOREIGN KEY (IdEspecie) REFERENCES public.ESPECIE_CAT(IdEspecie),
  CONSTRAINT producto_idmarca_fkey FOREIGN KEY (IdMarca) REFERENCES public.MARCA_CAT(IdMarca)
);
CREATE TABLE public.VETERINARIO (
  IdVeterinario integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  IdUsuario integer NOT NULL UNIQUE,
  Especialidad character varying,
  Descripcion character varying,
  CONSTRAINT VETERINARIO_pkey PRIMARY KEY (IdVeterinario),
  CONSTRAINT veterinario_idusuario_fkey FOREIGN KEY (IdUsuario) REFERENCES public.USUARIO(IdUsuario)
);
CREATE TABLE public.ESTADO_ORDEN_CAT (
  IdEstadoOrden smallint GENERATED ALWAYS AS IDENTITY NOT NULL,
  Nombre character varying NOT NULL,
  CONSTRAINT ESTADO_ORDEN_CAT_pkey PRIMARY KEY (IdEstadoOrden)
);
CREATE TABLE public.CARRITO (
  IdCarrito integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  IdUsuario bigint NOT NULL,
  FechaCreacion timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT CARRITO_pkey PRIMARY KEY (IdCarrito),
  CONSTRAINT CARRITO_IdUsuario_fkey FOREIGN KEY (IdUsuario) REFERENCES public.USUARIO(IdUsuario)
);
CREATE TABLE public.CARRITO_ITEM (
  IdCarritoItem integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  IdCarrito integer NOT NULL,
  IdProducto integer NOT NULL,
  Cantidad integer NOT NULL,
  PrecioUnitario numeric NOT NULL,
  FechaAgregado timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT CARRITO_ITEM_pkey PRIMARY KEY (IdCarritoItem),
  CONSTRAINT CARRITO_ITEM_IdCarrito_fkey FOREIGN KEY (IdCarrito) REFERENCES public.CARRITO(IdCarrito),
  CONSTRAINT CARRITO_ITEM_IdProducto_fkey FOREIGN KEY (IdProducto) REFERENCES public.PRODUCTO(IdProducto)
);
CREATE TABLE public.ORDEN (
  IdOrden integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  IdUsuario bigint NOT NULL,
  IdEstadoOrden smallint NOT NULL,
  Total numeric NOT NULL,
  FechaOrden timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT ORDEN_pkey PRIMARY KEY (IdOrden),
  CONSTRAINT ORDEN_IdUsuario_fkey FOREIGN KEY (IdUsuario) REFERENCES public.USUARIO(IdUsuario),
  CONSTRAINT ORDEN_IdEstadoOrden_fkey FOREIGN KEY (IdEstadoOrden) REFERENCES public.ESTADO_ORDEN_CAT(IdEstadoOrden)
);
CREATE TABLE public.ORDEN_DETALLE (
  IdOrdenDetalle integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  IdOrden integer NOT NULL,
  IdProducto integer NOT NULL,
  Cantidad integer NOT NULL,
  PrecioUnitario numeric NOT NULL,
  CONSTRAINT ORDEN_DETALLE_pkey PRIMARY KEY (IdOrdenDetalle),
  CONSTRAINT ORDEN_DETALLE_IdOrden_fkey FOREIGN KEY (IdOrden) REFERENCES public.ORDEN(IdOrden),
  CONSTRAINT ORDEN_DETALLE_IdProducto_fkey FOREIGN KEY (IdProducto) REFERENCES public.PRODUCTO(IdProducto)
);
CREATE TABLE public.MASCOTA (
  IdMascota integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  IdUsuario integer NOT NULL,
  Nombre character varying NOT NULL,
  IdEspecie smallint,
  Raza character varying,
  FechaNacimiento date,
  Activo boolean NOT NULL DEFAULT true,
  CONSTRAINT MASCOTA_pkey PRIMARY KEY (IdMascota),
  CONSTRAINT MASCOTA_IdUsuario_fkey FOREIGN KEY (IdUsuario) REFERENCES public.USUARIO(IdUsuario),
  CONSTRAINT MASCOTA_IdEspecie_fkey FOREIGN KEY (IdEspecie) REFERENCES public.ESPECIE_CAT(IdEspecie)
);
CREATE TABLE public.SERVICIO (
  IdServicio integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  IdComercio integer NOT NULL,
  Nombre character varying NOT NULL,
  Descripcion character varying,
  DuracionMinutos integer NOT NULL,
  Precio numeric NOT NULL,
  Activo boolean NOT NULL DEFAULT true,
  IdTipoServicio smallint NOT NULL,
  CONSTRAINT SERVICIO_pkey PRIMARY KEY (IdServicio),
  CONSTRAINT SERVICIO_IdComercio_fkey FOREIGN KEY (IdComercio) REFERENCES public.COMERCIO(IdComercio),
  CONSTRAINT SERVICIO_IdTipoServicio_fkey FOREIGN KEY (IdTipoServicio) REFERENCES public.TIPO_SERVICIO_CAT(IdTipoServicio)
);
CREATE TABLE public.ESTADO_CITA_CAT (
  IdEstadoCita smallint GENERATED ALWAYS AS IDENTITY NOT NULL,
  Nombre character varying NOT NULL UNIQUE,
  CONSTRAINT ESTADO_CITA_CAT_pkey PRIMARY KEY (IdEstadoCita)
);
CREATE TABLE public.HORARIO_VETERINARIO (
  IdHorario integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  IdVeterinario integer NOT NULL,
  DiaSemana smallint NOT NULL CHECK ("DiaSemana" >= 0 AND "DiaSemana" <= 6),
  HoraInicio time without time zone NOT NULL,
  HoraFin time without time zone NOT NULL,
  Activo boolean NOT NULL DEFAULT true,
  CONSTRAINT HORARIO_VETERINARIO_pkey PRIMARY KEY (IdHorario),
  CONSTRAINT HORARIO_VETERINARIO_IdVeterinario_fkey FOREIGN KEY (IdVeterinario) REFERENCES public.VETERINARIO(IdVeterinario)
);
CREATE TABLE public.CITA (
  IdCita integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  IdUsuario integer NOT NULL,
  IdMascota integer NOT NULL,
  IdVeterinario integer NOT NULL,
  IdServicio integer NOT NULL,
  IdEstadoCita smallint NOT NULL DEFAULT 1,
  Fecha date NOT NULL,
  HoraInicio time without time zone NOT NULL,
  HoraFin time without time zone NOT NULL,
  Notas character varying,
  FechaCreacion timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT CITA_pkey PRIMARY KEY (IdCita),
  CONSTRAINT CITA_IdUsuario_fkey FOREIGN KEY (IdUsuario) REFERENCES public.USUARIO(IdUsuario),
  CONSTRAINT CITA_IdMascota_fkey FOREIGN KEY (IdMascota) REFERENCES public.MASCOTA(IdMascota),
  CONSTRAINT CITA_IdVeterinario_fkey FOREIGN KEY (IdVeterinario) REFERENCES public.VETERINARIO(IdVeterinario),
  CONSTRAINT CITA_IdServicio_fkey FOREIGN KEY (IdServicio) REFERENCES public.SERVICIO(IdServicio),
  CONSTRAINT CITA_IdEstadoCita_fkey FOREIGN KEY (IdEstadoCita) REFERENCES public.ESTADO_CITA_CAT(IdEstadoCita)
);
CREATE TABLE public.TIPO_SERVICIO_CAT (
  IdTipoServicio smallint GENERATED ALWAYS AS IDENTITY NOT NULL,
  Nombre character varying NOT NULL UNIQUE,
  Activo boolean NOT NULL DEFAULT true,
  CONSTRAINT TIPO_SERVICIO_CAT_pkey PRIMARY KEY (IdTipoServicio)
);
