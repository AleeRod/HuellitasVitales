import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Home,
  Users,
  PawPrint,
  Stethoscope,
  Calendar,
  BarChart3,
  ShieldCheck,
  Settings,
  LogOut,
  Search,
  Tags,
  Package,
  Store,
  Briefcase,
  ArrowLeftRight,
  AlertTriangle,
  Globe,
} from 'lucide-react';
import { IconoDePerfil } from '../../components/Cliente/AvatarIconos';
import { API_BASE } from '../../api/config';
import PanelServicios from '../../components/ComercioAdmin/PanelServicios/PanelServicios';
import PanelProductos from '../../components/ComercioAdmin/PanelProductos/PanelProductos';
import PanelComercios from '../../components/Admin/PanelComercios/PanelComercios';
import PanelEmpleados from '../../components/ComercioAdmin/PanelEmpleados/PanelEmpleados';
import PanelVeterinarios from '../../components/ComercioAdmin/PanelVeterinarios/PanelVeterinarios';
import PanelSolicitudesTraslado from '../../components/ComercioAdmin/PanelSolicitudesTraslado/PanelSolicitudesTraslado';
import PanelEmergencias from '../../components/ComercioAdmin/PanelEmergencias/PanelEmergencias';
import PanelReportes from '../../components/ComercioAdmin/PanelReportes/PanelReportes';
import PanelDashboardAdmin from '../../components/Admin/PanelDashboard/PanelDashboardAdmin';
import PanelUsuarios from '../../components/Admin/PanelUsuarios/PanelUsuarios';
import PanelMascotasAdmin from '../../components/Admin/PanelMascotas/PanelMascotasAdmin';
import PanelCitasAdmin from '../../components/Admin/PanelCitas/PanelCitasAdmin';
import PanelRolesPermisos from '../../components/Admin/PanelRolesPermisos/PanelRolesPermisos';
import PanelConfiguracionAdmin from '../../components/Admin/PanelConfiguracion/PanelConfiguracionAdmin';
import NotificacionesBell from '../../components/Notificaciones/NotificacionesBell';

import styles from './DashboardAdmin.module.css';

const SECCIONES_VALIDAS = [
  'dashboard', 'usuarios', 'mascotas', 'citas', 'veterinarios', 'reportes', 'tiposServicio', 'PanelProductos',
  'solicitudesComercio', 'empleados', 'traslados', 'emergencias', 'roles', 'configuracion'
];

const DashboardAdmin = () => {
  const [searchParams] = useSearchParams();
  // Permite llegar directo a una sección desde afuera (p. ej. al tocar una notificación de
  // emergencia: /admin?seccion=emergencias) en vez de aterrizar siempre en el Dashboard.
  const seccionInicial = SECCIONES_VALIDAS.includes(searchParams.get('seccion')) ? searchParams.get('seccion') : 'dashboard';
  const [seccionActiva, setSeccionActiva] = useState(seccionInicial);
  const [usuario, setUsuario] = useState(null);
  const [avatarIcono, setAvatarIcono] = useState(null);
  const navigate = useNavigate();

  // Si el admin ya está en este panel (no se vuelve a montar) y toca una notificación que
  // apunta acá con otra sección, el useState de arriba no alcanza — hay que escuchar el
  // cambio de query param mientras el componente sigue vivo.
  useEffect(() => {
    const s = searchParams.get('seccion');
    if (s && SECCIONES_VALIDAS.includes(s)) setSeccionActiva(s);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    try {
      const guardado = localStorage.getItem('usuario_huellitas') || localStorage.getItem('usuario') || localStorage.getItem('user');
      if (guardado) {
        setUsuario(JSON.parse(guardado));
      }
    } catch (err) {
      console.error('No se pudo leer el usuario guardado', err);
    }
  }, []);

  // El ícono de avatar elegido no viaja en el localStorage guardado al iniciar sesión, así que
  // se refresca desde el propio perfil (mismo patrón que ClienteLayout).
  useEffect(() => {
    let activo = true;
    const token = localStorage.getItem('token_huellitas') || localStorage.getItem('jwt') || localStorage.getItem('token');
    if (!token) return undefined;

    fetch(`${API_BASE}/usuario/perfil`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (activo && data?.avatarIcono) setAvatarIcono(data.avatarIcono);
      })
      .catch(() => {});

    return () => { activo = false; };
  }, []);

  const nombreUsuario = usuario?.nombre || usuario?.Nombre || usuario?.nombreCompleto || 'Administrador';
  const rolUsuario = usuario?.rol?.nombre || usuario?.rolNombre || usuario?.rol || (Number(usuario?.idRol) === 1 ? 'Administrador' : 'Admin');
  const inicialAvatar = nombreUsuario.charAt(0).toUpperCase();

  const handleCerrarSesion = (e) => {
    e.preventDefault();
    localStorage.removeItem('usuario_huellitas');
    localStorage.removeItem('usuario');
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('jwt');
    localStorage.removeItem('huellitas_token');
    navigate('/');
  };

  return (
    <>
      <div className={styles.adminShell}>
        {/* SIDEBAR */}
        <aside className={styles.sidebar}>
          <div className={styles.sidebarInner} style={{ overflowY: 'auto', paddingBottom: '30px' }}>
            <div className={styles.brandCard}>
              <img src="/Imagenes/logo-huellitas.png" alt="Logo Huellitas Vitales" />
              <div>
                <div className={styles.brandName}>Huellitas Vitales</div>
                <div className={styles.brandBadge}>Clínica Veterinaria</div>
              </div>
            </div>

            <div className={styles.sidebarSection}>Panel global</div>
            <button
              className={`${styles.navLinkAdmin} ${seccionActiva === 'dashboard' ? styles.active : ''}`}
              onClick={() => setSeccionActiva('dashboard')}
            >
              <Home size={18} className={styles.navIcon} />
              Dashboard
            </button>
            <button
              className={`${styles.navLinkAdmin} ${seccionActiva === 'usuarios' ? styles.active : ''}`}
              onClick={() => setSeccionActiva('usuarios')}
            >
              <Users size={18} className={styles.navIcon} />
              Usuarios
            </button>
            <button
              className={`${styles.navLinkAdmin} ${seccionActiva === 'mascotas' ? styles.active : ''}`}
              onClick={() => setSeccionActiva('mascotas')}
            >
              <PawPrint size={18} className={styles.navIcon} />
              Mascotas
            </button>
            <button
              className={`${styles.navLinkAdmin} ${seccionActiva === 'veterinarios' ? styles.active : ''}`}
              onClick={() => setSeccionActiva('veterinarios')}
            >
              <Stethoscope size={18} className={styles.navIcon} />
              Veterinarios
            </button>
            <button
              className={`${styles.navLinkAdmin} ${seccionActiva === 'citas' ? styles.active : ''}`}
              onClick={() => setSeccionActiva('citas')}
            >
              <Calendar size={18} className={styles.navIcon} />
              Citas
            </button>
            <button
              className={`${styles.navLinkAdmin} ${seccionActiva === 'reportes' ? styles.active : ''}`}
              onClick={() => setSeccionActiva('reportes')}
            >
              <BarChart3 size={18} className={styles.navIcon} />
              Reportes
            </button>

            <div className={styles.sidebarSection}>Administración</div>

            <button
              className={`${styles.navLinkAdmin} ${seccionActiva === 'tiposServicio' ? styles.active : ''}`}
              onClick={() => setSeccionActiva('tiposServicio')}
            >
              <Tags size={18} className={styles.navIcon} />
              Servicios
            </button>

            <button
              className={`${styles.navLinkAdmin} ${seccionActiva === 'PanelProductos' ? styles.active : ''}`}
              onClick={() => setSeccionActiva('PanelProductos')}
            >
              <Package size={18} className={styles.navIcon} />
              Productos
            </button>

            <button
              className={`${styles.navLinkAdmin} ${seccionActiva === 'solicitudesComercio' ? styles.active : ''}`}
              onClick={() => setSeccionActiva('solicitudesComercio')}
            >
              <Store size={18} className={styles.navIcon} />
              Comercios
            </button>

            <button
              className={`${styles.navLinkAdmin} ${seccionActiva === 'empleados' ? styles.active : ''}`}
              onClick={() => setSeccionActiva('empleados')}
            >
              <Briefcase size={18} className={styles.navIcon} />
              Empleados
            </button>

            <button
              className={`${styles.navLinkAdmin} ${seccionActiva === 'traslados' ? styles.active : ''}`}
              onClick={() => setSeccionActiva('traslados')}
            >
              <ArrowLeftRight size={18} className={styles.navIcon} />
              Traslados
            </button>

            <button
              className={`${styles.navLinkAdmin} ${seccionActiva === 'emergencias' ? styles.active : ''}`}
              onClick={() => setSeccionActiva('emergencias')}
            >
              <AlertTriangle size={18} className={styles.navIcon} />
              Emergencias
            </button>

            <button
              className={`${styles.navLinkAdmin} ${seccionActiva === 'roles' ? styles.active : ''}`}
              onClick={() => setSeccionActiva('roles')}
            >
              <ShieldCheck size={18} className={styles.navIcon} />
              Roles y permisos
            </button>
            <button
              className={`${styles.navLinkAdmin} ${seccionActiva === 'configuracion' ? styles.active : ''}`}
              onClick={() => setSeccionActiva('configuracion')}
            >
              <Settings size={18} className={styles.navIcon} />
              Configuración
            </button>

            <button
              onClick={() => navigate('/')}
              className={styles.navLinkAdmin}
              style={{ marginTop: '10px' }}
            >
              <Globe size={18} className={styles.navIcon} />
              Volver al inicio
            </button>

            <button
              onClick={handleCerrarSesion}
              className={styles.navLinkAdmin}
              style={{ color: '#ff4d4d' }}
            >
              <LogOut size={18} className={styles.navIcon} />
              Cerrar sesión
            </button>

            <div className={styles.sidebarFooter} style={{ marginTop: '20px' }}>
              <div className={styles.sidebarFooterTitle}>Sistema seguro</div>
              <div className={styles.sidebarFooterText}>
                Control de usuarios, roles y estados para proteger la información clínica.
              </div>
            </div>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className={styles.mainContent}>
          {/* TOPBAR */}
          <section className={styles.topbar}>
            <div>
              <div className={styles.heroBadge}>
                <svg width="9" height="9" viewBox="0 0 10 10">
                  <circle cx="5" cy="5" r="5" fill="#52B788" />
                </svg>
                Administración global
              </div>
              <h1 className={styles.heroTitle}>Panel de administración</h1>
              <p className={styles.heroSub}>
                Controla usuarios, permisos y estados dentro de Huellitas Vitales.
              </p>
            </div>

            <div className={styles.topActions}>
              <div className={styles.topSearch}>
                <Search size={16} />
                <input type="text" placeholder="Buscar en el sistema..." />
              </div>

              <div className={styles.iconButton}>
                <NotificacionesBell size={18} />
              </div>

              <div className={styles.profileMini}>
                <div className={styles.profileAvatar}>
                  {avatarIcono ? <IconoDePerfil icono={avatarIcono} size={18} /> : inicialAvatar}
                </div>
                <div>
                  <div className={styles.profileName}>{nombreUsuario}</div>
                  <div className={styles.profileRole}>{rolUsuario}</div>
                </div>
              </div>
            </div>
          </section>

          {seccionActiva === 'dashboard' && <PanelDashboardAdmin />}

          {seccionActiva === 'usuarios' && <PanelUsuarios />}

          {seccionActiva === 'mascotas' && <PanelMascotasAdmin />}

          {seccionActiva === 'citas' && <PanelCitasAdmin />}

          {seccionActiva === 'roles' && <PanelRolesPermisos />}

          {seccionActiva === 'configuracion' && <PanelConfiguracionAdmin />}

          {seccionActiva === 'tiposServicio' && (
            <div style={{ width: '100%' }}>
              <PanelServicios esAdmin={true} />
            </div>
          )}

          {seccionActiva === 'veterinarios' && (
            <div style={{ width: '100%' }}>
              <PanelVeterinarios esAdmin={true} />
            </div>
          )}

          {/* AQUÍ ESTABA EL PROBLEMA: Faltaba esta condición para renderizar los productos */}
          {seccionActiva === 'PanelProductos' && (
            <div style={{ width: '100%' }}>
              <PanelProductos />
            </div>
          )}

          {seccionActiva === 'solicitudesComercio' && (
            <div style={{ width: '100%' }}>
              <PanelComercios />
            </div>
          )}

          {seccionActiva === 'empleados' && (
            <div style={{ width: '100%' }}>
              <PanelEmpleados />
            </div>
          )}

          {seccionActiva === 'traslados' && (
            <div style={{ width: '100%' }}>
              <PanelSolicitudesTraslado />
            </div>
          )}

          {seccionActiva === 'emergencias' && (
            <div style={{ width: '100%' }}>
              <PanelEmergencias />
            </div>
          )}

          {seccionActiva === 'reportes' && (
            <div style={{ width: '100%' }}>
              <PanelReportes />
            </div>
          )}

        </main>
      </div>
    </>
  );
};

export default DashboardAdmin;