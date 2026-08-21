import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import styles from './PanelVeterinario.module.css';
import {
  Home,
  CalendarDays,
  PawPrint,
  ClipboardList,
  Syringe,
  Receipt,
  BarChart3,
  LogOut,
  AlertTriangle,
  ArrowLeftRight,
  CheckCircle2,
  Clock,
  Globe,
} from 'lucide-react';
import PanelServicios from '../../components/ComercioAdmin/PanelServicios/PanelServicios';
import PanelSolicitudesTraslado from '../../components/ComercioAdmin/PanelSolicitudesTraslado/PanelSolicitudesTraslado';
import PanelEmergencias from '../../components/ComercioAdmin/PanelEmergencias/PanelEmergencias';
import PanelReportes from '../../components/ComercioAdmin/PanelReportes/PanelReportes';
import NotificacionesBell from '../../components/Notificaciones/NotificacionesBell';
import AgendaDiariaVeterinario from '../../components/Veterinario/AgendaDiariaVeterinario/AgendaDiariaVeterinario';
import { IconoDePerfil } from '../../components/Cliente/AvatarIconos';
import CustomSelect from '../../components/CustomSelect/CustomSelect';
import { API_BASE } from '../../api/config';
import { ToastContainer } from '../../components/Toast/Toast';
import { useToast } from '../../components/Toast/useToast';

const ESTADO_CITA_INFO = {
  1: { texto: 'Pendiente', clase: 'statusNext' },
  2: { texto: 'Confirmada', clase: 'statusReady' },
  3: { texto: 'Cancelada', clase: 'statusUrgent' },
  4: { texto: 'Completada', clase: 'statusDone' },
};

const soloFecha = (valor) => (valor ? String(valor).slice(0, 10) : '');

const VISTAS_VALIDAS = ['clinico', 'servicios', 'agenda', 'traslados', 'emergencias', 'pacientes', 'expedientes', 'vacunas', 'reportes'];

const PanelVeterinario = () => {
  const [searchParams] = useSearchParams();
  // Permite llegar directo a una pestaña desde afuera (p. ej. al tocar una notificación de
  // emergencia: /veterinario?vista=emergencias) en vez de aterrizar siempre en el panel clínico.
  const vistaInicial = VISTAS_VALIDAS.includes(searchParams.get('vista')) ? searchParams.get('vista') : 'clinico';
  const [vista, setVista] = useState(vistaInicial);
  const [usuario, setUsuario] = useState(null);
  const [avatarIcono, setAvatarIcono] = useState(null);

  // Si el veterinario ya está en este panel (no se vuelve a montar) y toca una notificación
  // que apunta acá con otra pestaña, el useState de arriba no alcanza — hay que escuchar el
  // cambio de query param mientras el componente sigue vivo.
  useEffect(() => {
    const v = searchParams.get('vista');
    if (v && VISTAS_VALIDAS.includes(v)) setVista(v);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);
  const [citas, setCitas] = useState([]);
  const [cargandoCitas, setCargandoCitas] = useState(true);
  const [pendientesTraslados, setPendientesTraslados] = useState([]);
  const [pendientesEmergencias, setPendientesEmergencias] = useState([]);
  const [citaParaCompletar, setCitaParaCompletar] = useState('');
  const [notaCompletar, setNotaCompletar] = useState('');
  const [guardandoNota, setGuardandoNota] = useState(false);
  const { toasts, showToast, removeToast } = useToast();
  const navigate = useNavigate();

  const token = () => localStorage.getItem('token_huellitas') || localStorage.getItem('jwt') || localStorage.getItem('token');
  const headers = () => ({ Authorization: `Bearer ${token()}` });

  useEffect(() => {
    try {
      const guardado = localStorage.getItem('usuario_huellitas');
      if (guardado) setUsuario(JSON.parse(guardado));
    } catch (err) {
      console.error('No se pudo leer el usuario guardado', err);
    }
  }, []);

  // El ícono de avatar elegido no viaja en el localStorage guardado al iniciar sesión, así que
  // se refresca desde el propio perfil (mismo patrón que ClienteLayout/DashboardAdmin).
  useEffect(() => {
    let activo = true;
    const t = token();
    if (!t) return undefined;

    fetch(`${API_BASE}/usuario/perfil`, { headers: { Authorization: `Bearer ${t}` } })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (activo && data?.avatarIcono) setAvatarIcono(data.avatarIcono);
      })
      .catch(() => {});

    return () => { activo = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cargarCitas = async () => {
    setCargandoCitas(true);
    try {
      const r = await fetch(`${API_BASE}/cita/veterinario`, { headers: headers() });
      const d = await r.json().catch(() => ({}));
      setCitas(Array.isArray(d.citas) ? d.citas : []);
    } catch (err) {
      console.error('No se pudo cargar la agenda del veterinario', err);
      setCitas([]);
    } finally {
      setCargandoCitas(false);
    }
  };

  const cargarPendientes = async () => {
    try {
      const [rt, re] = await Promise.all([
        fetch(`${API_BASE}/trasladoexpediente/solicitudes/pendientes`, { headers: headers() }),
        fetch(`${API_BASE}/emergencias/pendientes`, { headers: headers() }),
      ]);
      const dt = await rt.json().catch(() => ({}));
      const de = await re.json().catch(() => ({}));
      setPendientesTraslados(Array.isArray(dt.solicitudes) ? dt.solicitudes : []);
      setPendientesEmergencias(Array.isArray(de.emergencias) ? de.emergencias : []);
    } catch (err) {
      // Son solo contadores del dashboard: si fallan, las secciones dedicadas (Traslados,
      // Emergencias) igual cargan los suyos por su cuenta.
      console.error('No se pudieron cargar los contadores de pendientes', err);
    }
  };

  useEffect(() => {
    cargarCitas();
    cargarPendientes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cerrarSesion = () => {
    localStorage.removeItem('token_huellitas');
    localStorage.removeItem('usuario_huellitas');
    localStorage.removeItem('token');
    localStorage.removeItem('jwt');
    localStorage.removeItem('huellitas_token');
    navigate('/');
  };

  // Fallbacks por si el campo viene con otro nombre desde el backend
  const nombreUsuario = usuario?.nombre || usuario?.Nombre || usuario?.nombreCompleto || 'Usuario';
  const rolUsuario = usuario?.rol?.nombre || usuario?.rolNombre || 'Veterinario';
  const inicialAvatar = nombreUsuario.charAt(0).toUpperCase();

  const irA = (destino) => (e) => {
    e.preventDefault();
    setVista(destino);
  };

  const hoyISO = soloFecha(new Date().toISOString());

  const citasHoy = useMemo(
    () => citas.filter((c) => soloFecha(c.fecha) === hoyISO).sort((a, b) => (a.horaInicio || '').localeCompare(b.horaInicio || '')),
    [citas, hoyISO]
  );

  const completadasHoy = citasHoy.filter((c) => c.idEstadoCita === 4).length;

  const citasCompletables = useMemo(
    () => citasHoy.filter((c) => c.idEstadoCita === 1 || c.idEstadoCita === 2),
    [citasHoy]
  );

  const historialReciente = useMemo(
    () =>
      citas
        .filter((c) => c.idEstadoCita === 4)
        .sort((a, b) => (b.fecha || '').localeCompare(a.fecha || '') || (b.horaInicio || '').localeCompare(a.horaInicio || ''))
        .slice(0, 8),
    [citas]
  );

  const pacientes = useMemo(() => {
    const mapa = new Map();
    citas.forEach((c) => {
      if (!mapa.has(c.idMascota)) {
        mapa.set(c.idMascota, {
          idMascota: c.idMascota,
          nombre: c.nombreMascota,
          especie: c.especie,
          dueno: c.nombreCliente,
          visitas: 0,
          ultima: null,
        });
      }
      const p = mapa.get(c.idMascota);
      p.visitas += 1;
      if (!p.ultima || (c.fecha || '') > p.ultima) p.ultima = c.fecha;
    });
    return Array.from(mapa.values()).sort((a, b) => (b.ultima || '').localeCompare(a.ultima || ''));
  }, [citas]);

  const completarCita = async (e) => {
    e.preventDefault();
    if (!citaParaCompletar) return showToast('Elegí una cita del día para completar.', 'warning');

    setGuardandoNota(true);
    try {
      const r = await fetch(`${API_BASE}/cita/${citaParaCompletar}/completar`, {
        method: 'PUT',
        headers: { ...headers(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ notas: notaCompletar }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.mensaje || 'No se pudo completar la cita.');

      showToast('Cita marcada como completada.', 'success');
      setCitaParaCompletar('');
      setNotaCompletar('');
      cargarCitas();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setGuardandoNota(false);
    }
  };

  const formatFecha = (fechaISO) => {
    if (!fechaISO) return '-';
    return new Date(fechaISO).toLocaleDateString('es-CR', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatHora = (hhmmss) => {
    if (!hhmmss) return '-';
    const [h, m] = hhmmss.split(':');
    const hora = Number(h);
    const sufijo = hora >= 12 ? 'p.m.' : 'a.m.';
    const hora12 = hora % 12 === 0 ? 12 : hora % 12;
    return `${hora12}:${m} ${sufijo}`;
  };

  const tituloVista = {
    clinico: 'Panel clínico',
    servicios: 'Gestión de servicios',
    agenda: 'Agenda diaria',
    traslados: 'Traslados de expediente',
    emergencias: 'Emergencias',
    pacientes: 'Pacientes',
    expedientes: 'Expedientes',
    vacunas: 'Vacunas',
    reportes: 'Reportes',
  }[vista];

  const heroTituloVista = {
    clinico: 'Agenda diaria del veterinario',
    servicios: 'Servicios de la clínica',
    agenda: 'Agenda diaria del veterinario',
    traslados: 'Solicitudes de traslado',
    emergencias: 'Emergencias veterinarias',
    pacientes: 'Tus pacientes',
    expedientes: 'Expedientes clínicos',
    vacunas: 'Control de vacunas',
    reportes: 'Reportes de actividad',
  }[vista];

  const heroSubVista = {
    clinico: 'Consultá las citas del día, completá atenciones y revisá tu historial reciente.',
    servicios: 'Administrá las consultas, groomings y procedimientos que ofrecés.',
    agenda: 'Navegá por semana, filtrá por estado y confirmá, completá o cancelá citas.',
    traslados: 'Aceptá o rechazá expedientes que otras personas quieren trasladar a tu veterinaria.',
    emergencias: 'Aceptá, iniciá y cerrá las solicitudes de atención inmediata.',
    pacientes: 'Mascotas que atendiste, con su última visita y dueño.',
    expedientes: 'Historial clínico completo de cada mascota que atendés.',
    vacunas: 'Registro de vacunación de las mascotas que atendés.',
    reportes: 'Citas, emergencias, atenciones externas y traslados recientes.',
  }[vista];

  return (
    <div className={styles.vetShell}>
      {/* SIDEBAR */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarContent}>
          <div className={styles.brandCard}>
            <img src="/Imagenes/logo-huellitas.png" alt="Logo Huellitas Vitales" />
            <div>
              <div className={styles.brandName}>Huellitas Vitales</div>
              <div className={styles.brandLabel}>Panel Veterinario</div>
            </div>
          </div>

          <div className={styles.navSection}>Clínica</div>
          <a href="#" className={`${styles.navLinkVet} ${vista === 'clinico' ? styles.active : ''}`} onClick={irA('clinico')}>
            <span className={styles.navIcon}><Home size={17} /></span>
            Panel clínico
          </a>
          <a href="#" className={`${styles.navLinkVet} ${vista === 'agenda' ? styles.active : ''}`} onClick={irA('agenda')}>
            <span className={styles.navIcon}><CalendarDays size={17} /></span>
            Agenda diaria
          </a>
          <a href="#" className={`${styles.navLinkVet} ${vista === 'pacientes' ? styles.active : ''}`} onClick={irA('pacientes')}>
            <span className={styles.navIcon}><PawPrint size={17} /></span>
            Pacientes
          </a>
          <a href="#" className={`${styles.navLinkVet} ${vista === 'expedientes' ? styles.active : ''}`} onClick={irA('expedientes')}>
            <span className={styles.navIcon}><ClipboardList size={17} /></span>
            Expedientes
          </a>
          <a href="#" className={`${styles.navLinkVet} ${vista === 'vacunas' ? styles.active : ''}`} onClick={irA('vacunas')}>
            <span className={styles.navIcon}><Syringe size={17} /></span>
            Vacunas
          </a>

          <div className={styles.navSection}>Gestión</div>
          <a href="#" className={`${styles.navLinkVet} ${vista === 'servicios' ? styles.active : ''}`} onClick={irA('servicios')}>
            <span className={styles.navIcon}><Receipt size={17} /></span>
            Servicios
          </a>
          <a href="#" className={`${styles.navLinkVet} ${vista === 'traslados' ? styles.active : ''}`} onClick={irA('traslados')}>
            <span className={styles.navIcon}><ArrowLeftRight size={17} /></span>
            Traslados
          </a>
          <a href="#" className={`${styles.navLinkVet} ${vista === 'emergencias' ? styles.active : ''}`} onClick={irA('emergencias')}>
            <span className={styles.navIcon}><AlertTriangle size={17} /></span>
            Emergencias
          </a>
          <a href="#" className={`${styles.navLinkVet} ${vista === 'reportes' ? styles.active : ''}`} onClick={irA('reportes')}>
            <span className={styles.navIcon}><BarChart3 size={17} /></span>
            Reportes
          </a>
          <button onClick={() => navigate('/')} className={styles.navLinkVet} style={{ width: '100%', textAlign: 'left', border: 'none', background: 'none', font: 'inherit' }}>
            <span className={styles.navIcon}><Globe size={17} /></span>
            Volver al inicio
          </button>
          <button onClick={cerrarSesion} className={styles.navLinkVet} style={{ width: '100%', textAlign: 'left', border: 'none', background: 'none', font: 'inherit' }}>
            <span className={styles.navIcon}><LogOut size={17} /></span>
            Cerrar sesión
          </button>

          <div className={styles.sidebarNote}>
            <div className={styles.noteTitle}>Hoy</div>
            <div className={styles.noteText}>
              {cargandoCitas
                ? 'Cargando agenda…'
                : citasHoy.length === 0
                ? 'No tenés citas agendadas para hoy.'
                : `${citasHoy.length} cita${citasHoy.length === 1 ? '' : 's'} agendada${citasHoy.length === 1 ? '' : 's'}, ${completadasHoy} completada${completadasHoy === 1 ? '' : 's'}.`}
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <main className={styles.mainContent}>
        {/* TOPBAR */}
        <section className={styles.topbar}>
          <div>
            <div className={styles.heroBadge}>
              <svg width="9" height="9" viewBox="0 0 10 10">
                <circle cx="5" cy="5" r="5" fill="#52B788" />
              </svg>
              {tituloVista}
            </div>
            <h1 className={styles.heroTitle}>{heroTituloVista}</h1>
            <p className={styles.heroSub}>{heroSubVista}</p>
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
                <div className={styles.profileRole}>{rolUsuario}</div>
              </div>
            </div>
          </div>
        </section>

        {vista === 'servicios' && (
          <section className={styles.panelGrid}>
            <div className={styles.tableArea}>
              <PanelServicios />
            </div>
          </section>
        )}

        {vista === 'agenda' && (
          <section className={styles.panelGrid}>
            <AgendaDiariaVeterinario />
          </section>
        )}

        {vista === 'traslados' && (
          <section className={styles.panelGrid}>
            <div className={styles.tableArea}>
              <PanelSolicitudesTraslado />
            </div>
          </section>
        )}

        {vista === 'emergencias' && (
          <section className={styles.panelGrid}>
            <div className={styles.tableArea}>
              <PanelEmergencias />
            </div>
          </section>
        )}

        {vista === 'reportes' && (
          <section className={styles.panelGrid}>
            <div className={styles.tableArea}>
              <PanelReportes />
            </div>
          </section>
        )}

        {vista === 'pacientes' && (
          <section className={styles.panelGrid}>
            <div className={`${styles.contentCard} ${styles.tableArea}`}>
              <div className={styles.cardHead}>
                <div>
                  <h2 className={styles.cardTitle}>Pacientes</h2>
                  <p className={styles.cardSubtitle}>Mascotas que tuvieron al menos una cita con vos.</p>
                </div>
              </div>

              {cargandoCitas ? (
                <div className={styles.formArea}>Cargando pacientes…</div>
              ) : pacientes.length === 0 ? (
                <div className={styles.formArea}>Todavía no atendiste ninguna mascota.</div>
              ) : (
                <div className={styles.patientList}>
                  {pacientes.map((p) => (
                    <div className={styles.patientCard} key={p.idMascota}>
                      <div className={styles.patientInfo}>
                        <div className={styles.petIcon}><PawPrint size={20} /></div>
                        <div>
                          <div className={styles.patientTitle}>{p.nombre || 'Mascota'}</div>
                          <div className={styles.patientDetail}>
                            {p.especie ? `${p.especie} · ` : ''}Dueño: {p.dueno || 'Sin datos'}
                          </div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div className={styles.patientDetail}>{p.visitas} visita{p.visitas === 1 ? '' : 's'}</div>
                        <div className={styles.patientDetail}>Última: {formatFecha(p.ultima)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {vista === 'expedientes' && (
          <section className={styles.panelGrid}>
            <div className={`${styles.contentCard} ${styles.tableArea}`}>
              <div className={styles.cardHead}>
                <div>
                  <h2 className={styles.cardTitle}>Expedientes</h2>
                  <p className={styles.cardSubtitle}>Historial clínico completo por mascota.</p>
                </div>
              </div>
              <div className={styles.formArea} style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                <ClipboardList size={48} style={{ color: 'var(--line)', marginBottom: '1rem' }} />
                <div style={{ color: 'var(--text-lt)', fontWeight: 700 }}>Próximamente</div>
                <p style={{ color: 'var(--text-lt)', fontSize: '.85rem', marginTop: '.5rem', maxWidth: 420, marginInline: 'auto' }}>
                  Un buscador de expedientes por mascota todavía no está disponible en esta vista. Mientras tanto,
                  podés ver el historial de cada mascota desde una solicitud de traslado o emergencia en curso.
                </p>
              </div>
            </div>
          </section>
        )}

        {vista === 'vacunas' && (
          <section className={styles.panelGrid}>
            <div className={`${styles.contentCard} ${styles.tableArea}`}>
              <div className={styles.cardHead}>
                <div>
                  <h2 className={styles.cardTitle}>Vacunas</h2>
                  <p className={styles.cardSubtitle}>Registro de vacunación de tus pacientes.</p>
                </div>
              </div>
              <div className={styles.formArea} style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                <Syringe size={48} style={{ color: 'var(--line)', marginBottom: '1rem' }} />
                <div style={{ color: 'var(--text-lt)', fontWeight: 700 }}>Próximamente</div>
                <p style={{ color: 'var(--text-lt)', fontSize: '.85rem', marginTop: '.5rem', maxWidth: 420, marginInline: 'auto' }}>
                  El control de vacunas todavía no está disponible en la plataforma. Cuando esté listo, vas a poder
                  registrar y consultar acá la vacunación de cada mascota.
                </p>
              </div>
            </div>
          </section>
        )}

        {vista === 'clinico' && (
          <>
            {/* STATS */}
            <section className={styles.statsGrid}>
              <article className={styles.statCard}>
                <div className={styles.statIcon}><CalendarDays size={20} /></div>
                <div className={styles.statLabel}>Citas de hoy</div>
                <div className={styles.statNumber}>{cargandoCitas ? '…' : citasHoy.length}</div>
                <div className={styles.statNote}>Consultas y controles programados</div>
              </article>

              <article className={styles.statCard}>
                <div className={styles.statIcon}><PawPrint size={20} /></div>
                <div className={styles.statLabel}>Pacientes atendidos hoy</div>
                <div className={styles.statNumber}>{cargandoCitas ? '…' : completadasHoy}</div>
                <div className={styles.statNote}>Consultas completadas durante el día</div>
              </article>

              <article
                className={styles.statCard}
                style={{ cursor: 'pointer' }}
                onClick={() => setVista('traslados')}
                title="Ver traslados pendientes"
              >
                <div className={styles.statIcon}><ArrowLeftRight size={20} /></div>
                <div className={styles.statLabel}>Traslados pendientes</div>
                <div className={styles.statNumber}>{pendientesTraslados.length}</div>
                <div className={styles.statNote}>Esperando tu respuesta</div>
              </article>

              <article
                className={styles.statCard}
                style={{ cursor: 'pointer' }}
                onClick={() => setVista('emergencias')}
                title="Ver emergencias pendientes"
              >
                <div className={styles.statIcon}><AlertTriangle size={20} /></div>
                <div className={styles.statLabel}>Emergencias pendientes</div>
                <div className={styles.statNumber}>{pendientesEmergencias.length}</div>
                <div className={styles.statNote}>Requieren atención prioritaria</div>
              </article>
            </section>

            <section className={styles.panelGrid}>
              {/* AGENDA DIARIA (componente real, mismo que la vista dedicada) */}
              <AgendaDiariaVeterinario />

              {/* CITAS DE HOY */}
              <div className={styles.contentCard}>
                <div className={styles.cardHead}>
                  <div>
                    <h2 className={styles.cardTitle}>Citas de hoy</h2>
                    <p className={styles.cardSubtitle}>Tu agenda del día, en orden de horario.</p>
                  </div>
                </div>

                {cargandoCitas ? (
                  <div className={styles.formArea}>Cargando…</div>
                ) : citasHoy.length === 0 ? (
                  <div className={styles.formArea}>No tenés citas agendadas para hoy.</div>
                ) : (
                  <div className={styles.patientList}>
                    {citasHoy.map((c) => {
                      const info = ESTADO_CITA_INFO[c.idEstadoCita] || ESTADO_CITA_INFO[1];
                      return (
                        <div className={styles.patientCard} key={c.idCita}>
                          <div className={styles.patientInfo}>
                            <div className={styles.petIcon}><PawPrint size={20} /></div>
                            <div>
                              <div className={styles.patientTitle}>{c.nombreMascota}</div>
                              <div className={styles.patientDetail}>{c.nombreServicio} · {formatHora(c.horaInicio)}</div>
                            </div>
                          </div>
                          <span className={`${styles.statusBadge} ${styles[info.clase]}`}>{info.texto}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* COMPLETAR CITA (nota clínica) */}
              <div className={styles.contentCard}>
                <div className={styles.cardHead}>
                  <div>
                    <h2 className={styles.cardTitle}>Completar cita</h2>
                    <p className={styles.cardSubtitle}>Cerrá una cita del día con una nota clínica.</p>
                  </div>
                </div>

                <div className={styles.formArea}>
                  {citasCompletables.length === 0 ? (
                    <p style={{ color: 'var(--text-lt)', fontSize: '.88rem' }}>
                      No tenés citas pendientes o confirmadas para completar hoy.
                    </p>
                  ) : (
                    <form onSubmit={completarCita} className="row g-3">
                      <div className="col-12">
                        <label className={styles.formLabel}>Cita</label>
                        <CustomSelect
                          style={{ width: '100%' }}
                          value={citaParaCompletar}
                          onChange={setCitaParaCompletar}
                          placeholder="Elegí una cita..."
                          opciones={citasCompletables.map((c) => ({
                            value: c.idCita,
                            label: `${formatHora(c.horaInicio)} · ${c.nombreMascota} · ${c.nombreServicio}`
                          }))}
                        />
                      </div>

                      <div className="col-12">
                        <label className={styles.formLabel}>Observaciones</label>
                        <textarea
                          className={styles.formControl}
                          style={{ width: '100%' }}
                          rows="4"
                          placeholder="Diagnóstico, tratamiento o recomendaciones para el dueño..."
                          value={notaCompletar}
                          onChange={(e) => setNotaCompletar(e.target.value)}
                        />
                      </div>

                      <div className="col-12 d-flex justify-content-end gap-2">
                        <button type="submit" className={styles.btnMain} disabled={guardandoNota || !citaParaCompletar}>
                          <CheckCircle2 size={15} />
                          {guardandoNota ? 'Guardando…' : 'Marcar como completada'}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>

              {/* HISTORIAL */}
              <div className={`${styles.contentCard} ${styles.tableArea}`}>
                <div className={styles.cardHead}>
                  <div>
                    <h2 className={styles.cardTitle}>Historial clínico reciente</h2>
                    <p className={styles.cardSubtitle}>Últimas atenciones completadas.</p>
                  </div>
                </div>

                <div className={styles.tableWrap}>
                  {cargandoCitas ? (
                    <div>Cargando…</div>
                  ) : historialReciente.length === 0 ? (
                    <div>Todavía no completaste ninguna cita.</div>
                  ) : (
                    <div className={styles.tableResponsive}>
                      <table className={styles.table}>
                        <thead>
                          <tr>
                            <th>Fecha</th>
                            <th>Hora</th>
                            <th>Paciente</th>
                            <th>Servicio</th>
                            <th>Dueño</th>
                            <th>Estado</th>
                          </tr>
                        </thead>

                        <tbody>
                          {historialReciente.map((c) => (
                            <tr key={c.idCita}>
                              <td>{formatFecha(c.fecha)}</td>
                              <td>{formatHora(c.horaInicio)}</td>
                              <td>{c.nombreMascota}</td>
                              <td>{c.nombreServicio}</td>
                              <td>{c.nombreCliente}</td>
                              <td><span className={`${styles.statusBadge} ${styles.statusDone}`}><Clock size={12} /> Finalizado</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </section>
          </>
        )}
      </main>

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

export default PanelVeterinario;
