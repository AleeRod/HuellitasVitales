import React, { useCallback, useEffect, useState } from 'react';
import {
  Users, ClipboardCheck, CalendarDays, AlertTriangle, Stethoscope,
  Paperclip, ArrowLeftRight, CheckCircle2
} from 'lucide-react';
import { API_BASE } from '../../../api/config';
import BarraChart from '../Charts/BarraChart';
import DonaChart from '../Charts/DonaChart';
import chartStyles from '../Charts/Charts.module.css';
import styles from '../../../pages/Admin/DashboardAdmin.module.css';

const obtenerToken = () =>
  localStorage.getItem('token_huellitas') ||
  localStorage.getItem('token') ||
  localStorage.getItem('huellitas_token') ||
  localStorage.getItem('jwt') || '';

const authHeaders = () => ({ Authorization: `Bearer ${obtenerToken()}` });

const PERIODOS = [
  { valor: 'semanal', etiqueta: 'Semanal' },
  { valor: 'mensual', etiqueta: 'Mensual' },
  { valor: 'anual', etiqueta: 'Anual' }
];

// Antes "Dashboard" en el sidebar apuntaba a la misma sección que "Usuarios" (la maqueta de
// gestión de usuarios) — esta es la vista real y separada: gráficos con datos reales de toda
// la plataforma, no una tabla de gestión.
const PanelDashboardAdmin = () => {
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const [estadisticasUsuarios, setEstadisticasUsuarios] = useState(null);
  const [resumenClinico, setResumenClinico] = useState(null);
  const [estadisticasCitas, setEstadisticasCitas] = useState(null);
  const [solicitudesPendientes, setSolicitudesPendientes] = useState(0);

  const [periodo, setPeriodo] = useState('mensual');
  const [puntosRegistro, setPuntosRegistro] = useState([]);
  const [cargandoRegistros, setCargandoRegistros] = useState(true);

  const cargarRegistros = useCallback(async (periodoElegido) => {
    setCargandoRegistros(true);
    try {
      const res = await fetch(`${API_BASE}/usuario/estadisticas/registros?periodo=${periodoElegido}`, { headers: authHeaders() });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.success) setPuntosRegistro(data.puntos || []);
    } catch (err) {
      console.error('Error al cargar registros por período:', err);
    } finally {
      setCargandoRegistros(false);
    }
  }, []);

  const cargarTodo = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const [resUsuarios, resReporte, resCitas, resSolicitudes] = await Promise.all([
        fetch(`${API_BASE}/usuario/estadisticas`, { headers: authHeaders() }),
        fetch(`${API_BASE}/reporte/resumen`, { headers: authHeaders() }),
        fetch(`${API_BASE}/admin/citas/estadisticas`, { headers: authHeaders() }),
        fetch(`${API_BASE}/Comercio/pendientes`, { headers: authHeaders() })
      ]);

      if (!resUsuarios.ok) throw new Error('No se pudieron cargar las estadísticas de usuarios.');
      const dataUsuarios = await resUsuarios.json();
      setEstadisticasUsuarios(dataUsuarios.estadisticas);

      if (resReporte.ok) {
        const dataReporte = await resReporte.json();
        setResumenClinico(dataReporte.reporte);
      }

      if (resCitas.ok) {
        const dataCitas = await resCitas.json();
        setEstadisticasCitas(dataCitas.estadisticas);
      }

      if (resSolicitudes.ok) {
        const dataSolicitudes = await resSolicitudes.json().catch(() => []);
        setSolicitudesPendientes(Array.isArray(dataSolicitudes) ? dataSolicitudes.length : 0);
      }
    } catch (err) {
      setError(err.message || 'Ocurrió un error al cargar el dashboard.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargarTodo(); }, [cargarTodo]);
  useEffect(() => { cargarRegistros(periodo); }, [periodo, cargarRegistros]);

  if (cargando) {
    return <p style={{ padding: '1.5rem', color: '#718096' }}>Cargando el dashboard…</p>;
  }

  if (error) {
    return <p style={{ padding: '1.5rem', color: '#dc3545' }}>{error}</p>;
  }

  const porRol = estadisticasUsuarios?.porRol || { administradores: 0, veterinarios: 0, clientes: 0, funcionarios: 0 };
  const porEstado = estadisticasUsuarios?.porEstado || { activas: 0, invitadas: 0, suspendidas: 0 };

  const citasPorEstado = [
    { etiqueta: 'Pendientes', cantidad: estadisticasCitas?.pendientes || 0 },
    { etiqueta: 'Confirmadas', cantidad: estadisticasCitas?.confirmadas || 0 },
    { etiqueta: 'Canceladas', cantidad: estadisticasCitas?.canceladas || 0 },
    { etiqueta: 'Completadas', cantidad: estadisticasCitas?.completadas || 0 }
  ];

  return (
    <div style={{ width: '100%' }}>
      {/* ─── STATS GENERALES ─── */}
      <section className={styles.statGrid}>
        <article className={styles.statCard}>
          <div className={styles.statTop}><div className={styles.statIcon}><Users size={20} /></div></div>
          <div className={styles.statLabel}>Total de usuarios</div>
          <div className={styles.statNumber}>{estadisticasUsuarios?.total ?? 0}</div>
          <div className={styles.statNote}>Registrados en toda la plataforma</div>
        </article>

        <article className={styles.statCard}>
          <div className={styles.statTop}><div className={styles.statIcon}><ClipboardCheck size={20} /></div></div>
          <div className={styles.statLabel}>Solicitudes pendientes</div>
          <div className={styles.statNumber}>{solicitudesPendientes}</div>
          <div className={styles.statNote}>Comercios esperando aprobación</div>
        </article>

        <article className={styles.statCard}>
          <div className={styles.statTop}><div className={styles.statIcon}><CalendarDays size={20} /></div></div>
          <div className={styles.statLabel}>Citas totales</div>
          <div className={styles.statNumber}>{resumenClinico?.citasTotales ?? 0}</div>
          <div className={styles.statNote}>{resumenClinico?.citasCompletadas ?? 0} completadas</div>
        </article>

        <article className={styles.statCard}>
          <div className={styles.statTop}><div className={styles.statIcon}><AlertTriangle size={20} /></div></div>
          <div className={styles.statLabel}>Emergencias activas</div>
          <div className={styles.statNumber}>{resumenClinico?.emergenciasActivas ?? 0}</div>
          <div className={styles.statNote}>{resumenClinico?.emergenciasAtendidas ?? 0} atendidas en total</div>
        </article>
      </section>

      {/* ─── REGISTROS DE USUARIOS EN EL TIEMPO ─── */}
      <section className={styles.contentCard}>
        <div className={styles.cardTop}>
          <div>
            <h2 className={styles.cardTitle}>Registros de usuarios</h2>
            <p className={styles.cardSubtitle}>Cuántas cuentas nuevas se crearon, según el período elegido.</p>
          </div>

          <div className={chartStyles.periodoSelector}>
            {PERIODOS.map((p) => (
              <button
                key={p.valor}
                type="button"
                className={`${chartStyles.periodoBtn} ${periodo === p.valor ? chartStyles.periodoBtnActivo : ''}`}
                onClick={() => setPeriodo(p.valor)}
              >
                {p.etiqueta}
              </button>
            ))}
          </div>
        </div>

        {cargandoRegistros ? (
          <p style={{ padding: '1.5rem', color: '#718096' }}>Cargando…</p>
        ) : (
          <BarraChart datos={puntosRegistro} color="#52B788" />
        )}
      </section>

      {/* ─── DISTRIBUCIÓN DE USUARIOS ─── */}
      <div className="row g-3" style={{ margin: '0 0 1.2rem' }}>
        <div className="col-md-6" style={{ padding: '0 .6rem 0 0' }}>
          <section className={styles.contentCard} style={{ height: '100%' }}>
            <div className={styles.cardTop}>
              <div>
                <h2 className={styles.cardTitle}>Usuarios por rol</h2>
              </div>
            </div>
            <DonaChart
              segmentos={[
                { etiqueta: 'Clientes', valor: porRol.clientes, color: '#DDA15E' },
                { etiqueta: 'Veterinarios', valor: porRol.veterinarios, color: '#52B788' },
                { etiqueta: 'Funcionarios', valor: porRol.funcionarios, color: '#6366f1' },
                { etiqueta: 'Administradores', valor: porRol.administradores, color: '#1B4332' }
              ]}
            />
          </section>
        </div>

        <div className="col-md-6" style={{ padding: '0 0 0 .6rem' }}>
          <section className={styles.contentCard} style={{ height: '100%' }}>
            <div className={styles.cardTop}>
              <div>
                <h2 className={styles.cardTitle}>Usuarios por estado de cuenta</h2>
              </div>
            </div>
            <DonaChart
              segmentos={[
                { etiqueta: 'Activas', valor: porEstado.activas, color: '#52B788' },
                { etiqueta: 'Invitadas', valor: porEstado.invitadas, color: '#718096' },
                { etiqueta: 'Suspendidas', valor: porEstado.suspendidas, color: '#dc3545' }
              ]}
            />
          </section>
        </div>
      </div>

      {/* ─── CITAS POR ESTADO ─── */}
      <section className={styles.contentCard}>
        <div className={styles.cardTop}>
          <div>
            <h2 className={styles.cardTitle}>Citas por estado</h2>
            <p className={styles.cardSubtitle}>Distribución de todas las citas agendadas en la plataforma.</p>
          </div>
        </div>
        <BarraChart datos={citasPorEstado} color="#1B4332" />
      </section>

      {/* ─── ACTIVIDAD CLÍNICA ─── */}
      <section className={styles.contentCard}>
        <div className={styles.cardTop}>
          <div>
            <h2 className={styles.cardTitle}>Actividad clínica</h2>
            <p className={styles.cardSubtitle}>Resumen operativo de toda la plataforma.</p>
          </div>
        </div>

        <div className={styles.statGrid} style={{ padding: 0 }}>
          <article className={styles.statCard}>
            <div className={styles.statTop}><div className={styles.statIcon}><CheckCircle2 size={20} /></div></div>
            <div className={styles.statLabel}>Citas completadas</div>
            <div className={styles.statNumber}>{resumenClinico?.citasCompletadas ?? 0}</div>
          </article>

          <article className={styles.statCard}>
            <div className={styles.statTop}><div className={styles.statIcon}><Stethoscope size={20} /></div></div>
            <div className={styles.statLabel}>Emergencias atendidas</div>
            <div className={styles.statNumber}>{resumenClinico?.emergenciasAtendidas ?? 0}</div>
          </article>

          <article className={styles.statCard}>
            <div className={styles.statTop}><div className={styles.statIcon}><Paperclip size={20} /></div></div>
            <div className={styles.statLabel}>Atenciones externas</div>
            <div className={styles.statNumber}>{resumenClinico?.atencionesExternasRegistradas ?? 0}</div>
          </article>

          <article className={styles.statCard}>
            <div className={styles.statTop}><div className={styles.statIcon}><ArrowLeftRight size={20} /></div></div>
            <div className={styles.statLabel}>Traslados resueltos</div>
            <div className={styles.statNumber}>{resumenClinico?.trasladosResueltos ?? 0}</div>
          </article>
        </div>
      </section>
    </div>
  );
};

export default PanelDashboardAdmin;
