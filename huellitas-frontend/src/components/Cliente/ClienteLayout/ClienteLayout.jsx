import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../../pages/Cliente/DashboardCliente.css';
import {
  Home, PawPrint, CalendarDays, Activity, Syringe, FileText,
  Settings, LogOut, Paperclip, ArrowLeftRight, AlertTriangle, Globe, Receipt
} from 'lucide-react';
import NotificacionesBell from '../../Notificaciones/NotificacionesBell';
import { IconoDePerfil } from '../AvatarIconos';
import { API_BASE } from '../../../api/config';

// Único lugar donde vive el menú del portal cliente. Antes cada página (Dashboard, Mis
// mascotas, Mis citas, Historial clínico, Vacunas, Reportes, Configuración...) tenía su propia
// copia pegada del sidebar completo, así que un link nuevo (o cualquier cambio) solo aparecía
// donde alguien se acordara de agregarlo a mano — por eso Atenciones externas/Trasladar
// expediente/Emergencia solo salían en el Dashboard. Con esto, un solo lugar para las 10
// páginas del portal.
const SECCIONES = {
  dashboard: { badge: 'Dashboard del cliente', hero: 'Bienvenido de nuevo', sub: 'Consulta tus mascotas, próximas citas y tu historial de salud.' },
  mascotas: { badge: 'Mis mascotas', hero: 'Gestioná tus mascotas', sub: 'Creá, editá y eliminá los datos de tus compañeros peludos.' },
  citas: { badge: 'Mis citas', hero: 'Tus citas veterinarias', sub: 'Visualizá todas tus citas agrupadas por estado de confirmación.' },
  historial: { badge: 'Historial clínico', hero: 'Historial clínico', sub: 'Consultas, atenciones externas y emergencias de tus mascotas, en una sola línea de tiempo.' },
  vacunas: { badge: 'Vacunas', hero: 'Control de vacunas', sub: 'Registro de vacunación de tus mascotas.' },
  reportes: { badge: 'Reportes', hero: 'Tus reportes', sub: 'Resumen de la actividad clínica de tus mascotas.' },
  compras: { badge: 'Mis compras', hero: 'Mis compras', sub: 'Historial de órdenes del marketplace y sus recibos.' },
  atenciones: { badge: 'Atenciones externas', hero: 'Atenciones externas', sub: 'Registrá consultas realizadas fuera de Huellitas Vitales.' },
  traslado: { badge: 'Trasladar expediente', hero: 'Trasladar expediente', sub: 'Solicitá mover el expediente de tu mascota a otra veterinaria.' },
  emergencia: { badge: 'Emergencia', hero: 'Solicitar emergencia', sub: 'Solicitá atención veterinaria inmediata para tu mascota.' },
  configuracion: { badge: 'Configuración', hero: 'Preferencias y configuración', sub: 'Gestioná los datos y ajustes de tu cuenta.' },
};

const ClienteLayout = ({ activo, children, titulo, subtitulo }) => {
  const [usuario, setUsuario] = useState(null);
  const [avatarIcono, setAvatarIcono] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const guardado = localStorage.getItem('usuario_huellitas') || localStorage.getItem('usuario') || localStorage.getItem('user');
      if (guardado) setUsuario(JSON.parse(guardado));
    } catch (err) {
      console.error('No se pudo leer el usuario guardado', err);
    }
  }, []);

  // El ícono de avatar elegido no viaja en el localStorage guardado al iniciar sesión, así que
  // se refresca desde el propio perfil — se vuelve a pedir en cada montaje (cada navegación
  // entre secciones del portal), por lo que un cambio hecho en Configuración se refleja de
  // inmediato en el resto del portal sin recargar la página.
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

  const nombreUsuario = usuario?.nombre || usuario?.Nombre || usuario?.nombreCompleto || 'Cliente';
  const rolUsuario = usuario?.rol?.nombre || usuario?.rolNombre || usuario?.rol || 'Cliente';
  const inicialAvatar = nombreUsuario.charAt(0).toUpperCase();

  const handleCerrarSesion = (e) => {
    e.preventDefault();
    localStorage.removeItem('usuario_huellitas');
    localStorage.removeItem('usuario');
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('token_huellitas');
    localStorage.removeItem('jwt');
    localStorage.removeItem('huellitas_token');
    navigate('/');
  };

  const ir = (ruta) => (e) => {
    e.preventDefault();
    navigate(ruta);
  };

  const seccion = SECCIONES[activo] || SECCIONES.dashboard;
  const heroTitulo = titulo || seccion.hero;
  const heroSub = subtitulo || seccion.sub;

  const linkClase = (clave) => `nav-link-client${activo === clave ? ' active' : ''}`;

  return (
    <div className="client-shell">
      {/* SIDEBAR — único lugar donde se define el menú del portal cliente */}
      <aside className="sidebar">
        <div className="sidebar-content">
          <div className="brand-card">
            <img src="/Imagenes/logo-huellitas.png" alt="Logo Huellitas Vitales" />
            <div>
              <div className="brand-name">Huellitas Vitales</div>
              <div className="brand-label">Portal Cliente</div>
            </div>
          </div>

          <div className="nav-section">Mi cuenta</div>
          <a href="#dashboard" className={linkClase('dashboard')} onClick={ir('/cliente')}>
            <span className="nav-icon"><Home size={18} /></span>
            Dashboard
          </a>
          <a href="#mascotas" className={linkClase('mascotas')} onClick={ir('/cliente/mis-mascotas')}>
            <span className="nav-icon"><PawPrint size={18} /></span>
            Mis mascotas
          </a>
          <a href="#citas" className={linkClase('citas')} onClick={ir('/cliente/mis-citas')}>
            <span className="nav-icon"><CalendarDays size={18} /></span>
            Mis citas
          </a>
          <a href="#historial" className={linkClase('historial')} onClick={ir('/cliente/historial-clinico')}>
            <span className="nav-icon"><Activity size={18} /></span>
            Historial clínico
          </a>
          <a href="#vacunas" className={linkClase('vacunas')} onClick={ir('/cliente/vacunas')}>
            <span className="nav-icon"><Syringe size={18} /></span>
            Vacunas
          </a>
          <a href="#reportes" className={linkClase('reportes')} onClick={ir('/cliente/reportes')}>
            <span className="nav-icon"><FileText size={18} /></span>
            Reportes
          </a>
          <a href="#compras" className={linkClase('compras')} onClick={ir('/cliente/mis-compras')}>
            <span className="nav-icon"><Receipt size={18} /></span>
            Mis compras
          </a>

          <div className="nav-section">Expediente</div>
          <a href="#atenciones-externas" className={linkClase('atenciones')} onClick={ir('/cliente/atenciones-externas')}>
            <span className="nav-icon"><Paperclip size={18} /></span>
            Atenciones externas
          </a>
          <a href="#trasladar-expediente" className={linkClase('traslado')} onClick={ir('/cliente/trasladar-expediente')}>
            <span className="nav-icon"><ArrowLeftRight size={18} /></span>
            Trasladar expediente
          </a>
          <a href="#emergencia" className={linkClase('emergencia')} onClick={ir('/cliente/emergencia')} style={{ color: activo === 'emergencia' ? undefined : '#ff8a80' }}>
            <span className="nav-icon"><AlertTriangle size={18} /></span>
            Solicitar emergencia
          </a>

          <div className="nav-section">Sistema</div>
          <a href="#configuracion" className={linkClase('configuracion')} onClick={ir('/cliente/configuracion')}>
            <span className="nav-icon"><Settings size={18} /></span>
            Configuración
          </a>

          <button
            onClick={ir('/')}
            className="nav-link-client"
            style={{ width: '100%', textAlign: 'left', border: 'none', background: 'none', cursor: 'pointer' }}
          >
            <span className="nav-icon"><Globe size={18} /></span>
            Volver al inicio
          </button>

          <button
            onClick={handleCerrarSesion}
            className="nav-link-client"
            style={{ width: '100%', textAlign: 'left', border: 'none', background: 'none', color: '#ff4d4d', cursor: 'pointer' }}
          >
            <span className="nav-icon"><LogOut size={18} /></span>
            Cerrar sesión
          </button>

          <div className="sidebar-pet-card">
            <div className="pet-mini">
              <div className="pet-avatar"><IconoDePerfil icono={avatarIcono} size={16} color="#4a4a4a" /></div>
              <div>
                <div className="pet-name">{nombreUsuario}</div>
                <div className="pet-text">{rolUsuario}</div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <main className="main-content">
        <section className="topbar">
          <div>
            <div className="hero-badge">
              <svg width="9" height="9" viewBox="0 0 10 10">
                <circle cx="5" cy="5" r="5" fill="#52B788" />
              </svg>
              {seccion.badge}
            </div>
            <h1 className="hero-title">{heroTitulo}</h1>
            <p className="hero-sub">{heroSub}</p>
          </div>

          <div className="top-actions">
            <div className="icon-button">
              <NotificacionesBell size={20} />
            </div>
            <div className="profile-mini">
              <div className="profile-avatar">
                {avatarIcono ? <IconoDePerfil icono={avatarIcono} size={18} /> : inicialAvatar}
              </div>
              <div>
                <div className="profile-name">{nombreUsuario}</div>
                <div className="profile-role">{rolUsuario}</div>
              </div>
            </div>
          </div>
        </section>

        {children}
      </main>
    </div>
  );
};

export default ClienteLayout;
