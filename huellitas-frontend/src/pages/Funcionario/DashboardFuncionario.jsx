import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Package, LogOut, Store, Stethoscope, Users, ArrowLeftRight, Globe, Briefcase, Settings } from "lucide-react";
import { API_BASE } from "../../api/config";
import PanelProductos from "../../components/ComercioAdmin/PanelProductos/PanelProductos"; // ⚠️ ajustá la ruta según dónde tengas PanelProductos
import PanelServicios from "../../components/ComercioAdmin/PanelServicios/PanelServicios";
import PanelVeterinarios from "../../components/ComercioAdmin/PanelVeterinarios/PanelVeterinarios";
import PanelSolicitudesTraslado from "../../components/ComercioAdmin/PanelSolicitudesTraslado/PanelSolicitudesTraslado";
import PanelEmpleados from "../../components/ComercioAdmin/PanelEmpleados/PanelEmpleados";
import ConfiguracionCuenta from "../../components/Cuenta/ConfiguracionCuenta";
import NotificacionesBell from "../../components/Notificaciones/NotificacionesBell";
import { IconoDePerfil } from "../../components/Cliente/AvatarIconos";
import styles from "./DashboardFuncionario.module.css";

const TIPO_COMERCIO_VETERINARIA = 1;
const TIPO_COMERCIO_ALMACEN = 2;

const SECCIONES_VALIDAS = ["productos", "servicios", "veterinarios", "traslados", "empleados", "configuracion"];

const TITULOS_SECCION = {
  productos: { badge: "Gestión de comercio", hero: "Productos", sub: "Administrá el stock, catálogo y precios de tu almacén." },
  servicios: { badge: "Gestión de comercio", hero: "Servicios", sub: "Administrá los servicios que ofrece tu veterinaria." },
  veterinarios: { badge: "Gestión de comercio", hero: "Veterinarios", sub: "Vinculá y gestioná los veterinarios de tu clínica." },
  traslados: { badge: "Gestión de comercio", hero: "Solicitudes de traslado", sub: "Expedientes que otras personas quieren trasladar a tu veterinaria." },
  empleados: { badge: "Gestión de comercio", hero: "Empleados", sub: "Gestioná quién trabaja en tu comercio y qué cargo tiene." },
  configuracion: { badge: "Mi cuenta", hero: "Configuración", sub: "Gestioná los datos y ajustes de tu cuenta." },
};

const DashboardFuncionario = () => {
  const [usuario, setUsuario] = useState(null);
  const [avatarIcono, setAvatarIcono] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [searchParams] = useSearchParams();
  // Permite llegar directo a una sección desde afuera (p. ej. al tocar una notificación de
  // traslado: /funcionario?seccion=traslados) en vez de que la termine pisando la selección
  // automática de más abajo.
  const seccionDesdeUrl = SECCIONES_VALIDAS.includes(searchParams.get("seccion")) ? searchParams.get("seccion") : null;
  const [seccionActiva, setSeccionActiva] = useState(seccionDesdeUrl); // "productos" | "servicios" | "traslados"
  const navigate = useNavigate();

  // Si ya está en este panel (no se vuelve a montar) y toca una notificación que apunta acá
  // con otra sección, el useState de arriba no alcanza — hay que escuchar el cambio de query
  // param mientras el componente sigue vivo.
  useEffect(() => {
    const s = searchParams.get("seccion");
    if (s && SECCIONES_VALIDAS.includes(s)) setSeccionActiva(s);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    const cargarPerfil = async () => {
      const token = localStorage.getItem("token_huellitas");

      if (!token) {
        navigate("/login");
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/usuario/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();

        if (!res.ok || !data.success) {
          navigate("/login");
          return;
        }

        if (!data.usuario.esFuncionario) {
          navigate("/");
          return;
        }

        setUsuario(data.usuario);

        // Elegimos qué sección mostrar por defecto: preferimos Productos
        // (ya está lista), si no tiene almacén pero sí veterinaria, mostramos ese aviso.
        const comercios = data.usuario.comercios || [];
        const tieneAlmacenAprobado = comercios.some(c => c.idTipoComercio === TIPO_COMERCIO_ALMACEN && c.aprobado);
        const tieneVeterinariaAprobada = comercios.some(c => c.idTipoComercio === TIPO_COMERCIO_VETERINARIA && c.aprobado);

        // Si ya llegó con una sección puntual desde la URL (notificación), se respeta esa en
        // vez de pisarla con la selección automática.
        if (!seccionDesdeUrl) {
          if (tieneAlmacenAprobado) setSeccionActiva("productos");
          else if (tieneVeterinariaAprobada) setSeccionActiva("servicios");
          else setSeccionActiva(null);
        }

      } catch (error) {
        navigate("/login");
      } finally {
        setCargando(false);
      }
    };

    cargarPerfil();
  }, [navigate, seccionDesdeUrl]);

  // El ícono de avatar elegido no viene en la respuesta de /api/usuario/me (esa solo trae los
  // comercios) — se pide aparte, mismo patrón que ClienteLayout/DashboardAdmin/PanelVeterinario.
  useEffect(() => {
    let activo = true;
    const token = localStorage.getItem("token_huellitas");
    if (!token) return undefined;

    fetch(`${API_BASE}/usuario/perfil`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (activo && data?.avatarIcono) setAvatarIcono(data.avatarIcono);
      })
      .catch(() => {});

    return () => { activo = false; };
  }, []);

  const cerrarSesion = () => {
    localStorage.removeItem("token_huellitas");
    localStorage.removeItem("usuario_huellitas");
    navigate("/login");
  };

  if (cargando) {
    return <div className={styles.estadoCarga}>Cargando tu panel...</div>;
  }

  if (!usuario) return null; // ya se redirigió

  const comercios = usuario.comercios || [];

  // Preferimos un comercio APROBADO de cada tipo. Si no hay ninguno aprobado,
  // caemos al primero que exista igual, para poder mostrar el mensaje
  // "todavía no fue aprobado" con datos reales.
  const comercioAlmacen =
    comercios.find(c => c.idTipoComercio === TIPO_COMERCIO_ALMACEN && c.aprobado) ||
    comercios.find(c => c.idTipoComercio === TIPO_COMERCIO_ALMACEN);

  const comercioVeterinaria =
    comercios.find(c => c.idTipoComercio === TIPO_COMERCIO_VETERINARIA && c.aprobado) ||
    comercios.find(c => c.idTipoComercio === TIPO_COMERCIO_VETERINARIA);

  if (comercios.length === 0) {
    return (
      <div className={styles.sinComercio}>
        <Store size={40} />
        <h2>No tenés un comercio afiliado</h2>
        <p>Tu cuenta de funcionario todavía no está vinculada a ningún comercio.</p>
      </div>
    );
  }

  const nombreUsuario = usuario?.nombre || "Funcionario";
  const inicialAvatar = nombreUsuario.charAt(0).toUpperCase();
  const seccionInfo = TITULOS_SECCION[seccionActiva] || TITULOS_SECCION.productos;

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarContent}>
        <div className={styles.brandCard}>
          <img src="/Imagenes/logo-huellitas.png" alt="Logo Huellitas Vitales" />
          <div>
            <div className={styles.brandName}>Huellitas Vitales</div>
            <span className={styles.brandLabel}>Panel de Funcionario</span>
          </div>
        </div>

        <nav className={styles.nav}>
          {comercioAlmacen && (
            <button
              className={seccionActiva === "productos" ? styles.navItemActivo : styles.navItem}
              onClick={() => setSeccionActiva("productos")}
            >
              <Package size={18} /> Productos
            </button>
          )}
          {comercioVeterinaria && (
            <button
              className={seccionActiva === "servicios" ? styles.navItemActivo : styles.navItem}
              onClick={() => setSeccionActiva("servicios")}
            >
              <Stethoscope size={18} /> Servicios
            </button>
          )}
          {comercioVeterinaria && (
            <button
              className={seccionActiva === "veterinarios" ? styles.navItemActivo : styles.navItem}
              onClick={() => setSeccionActiva("veterinarios")}
            >
              <Users size={18} /> Veterinarios
            </button>
          )}
          {comercioVeterinaria && (
            <button
              className={seccionActiva === "traslados" ? styles.navItemActivo : styles.navItem}
              onClick={() => setSeccionActiva("traslados")}
            >
              <ArrowLeftRight size={18} /> Traslados
            </button>
          )}
          <button
            className={seccionActiva === "empleados" ? styles.navItemActivo : styles.navItem}
            onClick={() => setSeccionActiva("empleados")}
          >
            <Briefcase size={18} /> Empleados
          </button>
          <button
            className={seccionActiva === "configuracion" ? styles.navItemActivo : styles.navItem}
            onClick={() => setSeccionActiva("configuracion")}
          >
            <Settings size={18} /> Configuración
          </button>
        </nav>

        <button className={styles.navItem} onClick={() => navigate("/")}>
          <Globe size={18} /> Volver al inicio
        </button>

        <button className={styles.btnSalir} onClick={cerrarSesion}>
          <LogOut size={18} /> Cerrar sesión
        </button>
        </div>
      </aside>

      <main className={styles.contenido}>
        <section className={styles.topbar}>
          <div>
            <h1 className={styles.heroTitle}>{seccionInfo.hero}</h1>
            <p className={styles.heroSub}>{seccionInfo.sub}</p>
          </div>

          <div className={styles.topActions}>
            <div className={styles.iconButton}>
              <NotificacionesBell size={18} />
            </div>
            <div className={styles.profileMini}>
              <div className={styles.profileAvatar}>
                {avatarIcono ? <IconoDePerfil icono={avatarIcono} size={18} /> : inicialAvatar}
              </div>
              <div>
                <div className={styles.profileName}>{nombreUsuario}</div>
                <div className={styles.profileRole}>Funcionario</div>
              </div>
            </div>
          </div>
        </section>

        {seccionActiva === "productos" && comercioAlmacen && (
          comercioAlmacen.aprobado ? (
            <PanelProductos esAdmin={false} />
          ) : (
            <div className={styles.avisoServicios}>
              <p>"{comercioAlmacen.nombreComercial}" todavía no fue aprobado por un administrador.</p>
            </div>
          )
        )}

        {seccionActiva === "servicios" && comercioVeterinaria && (
          comercioVeterinaria.aprobado ? (
            <PanelServicios esAdmin={false} />
          ) : (
            <div className={styles.avisoServicios}>
              <p>"{comercioVeterinaria.nombreComercial}" todavía no fue aprobado por un administrador.</p>
            </div>
          )
        )}

        {seccionActiva === "veterinarios" && comercioVeterinaria && (
          comercioVeterinaria.aprobado ? (
            <PanelVeterinarios esAdmin={false} />
          ) : (
            <div className={styles.avisoServicios}>
              <p>"{comercioVeterinaria.nombreComercial}" todavía no fue aprobado por un administrador.</p>
            </div>
          )
        )}

        {seccionActiva === "traslados" && comercioVeterinaria && (
          comercioVeterinaria.aprobado ? (
            <PanelSolicitudesTraslado />
          ) : (
            <div className={styles.avisoServicios}>
              <p>"{comercioVeterinaria.nombreComercial}" todavía no fue aprobado por un administrador.</p>
            </div>
          )
        )}

        {seccionActiva === "empleados" && <PanelEmpleados />}

        {seccionActiva === "configuracion" && <ConfiguracionCuenta />}
      </main>
    </div>
  );
};

export default DashboardFuncionario;