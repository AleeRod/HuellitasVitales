import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  PawPrint, CalendarDays, Activity, Paperclip, Dog, Cat, Clock, Stethoscope, AlertTriangle, ArrowRight
} from 'lucide-react';

import ClienteLayout from '../../components/Cliente/ClienteLayout/ClienteLayout';
import { API_BASE } from '../../api/config';

const ICONO_HISTORIAL = {
  Cita: Stethoscope,
  AtencionExterna: Paperclip,
  Emergencia: AlertTriangle,
};

// El Dashboard es solo un panorama general de la cuenta: estadísticas y vistazos rápidos de
// mascotas/citas/historial, todo de solo lectura. Gestionar de verdad (agregar/editar/eliminar
// mascotas, agendar citas) vive en sus propias pantallas ("Mis mascotas", "Mis citas"), a las
// que este panel solo enlaza — no duplica ningún CRUD acá adentro.
const DashboardCliente = () => {
  const [usuario, setUsuario] = useState(null);
  const [citas, setCitas] = useState([]);
  const [mascotas, setMascotas] = useState([]);
  const [resumen, setResumen] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [cargandoCitas, setCargandoCitas] = useState(false);
  const [cargandoMascotas, setCargandoMascotas] = useState(false);

  useEffect(() => {
    try {
      const guardado = localStorage.getItem('usuario_huellitas') || localStorage.getItem('usuario') || localStorage.getItem('user');
      if (guardado) setUsuario(JSON.parse(guardado));
    } catch (err) {
      console.error('No se pudo leer el usuario guardado', err);
    }
  }, []);

  const nombreUsuario = usuario?.nombre || usuario?.Nombre || usuario?.nombreCompleto || 'Cliente';
  const citasPendientes = citas.filter((c) => c.idEstadoCita !== 3 && c.idEstadoCita !== 4).length;
  const citasProximas = citas
    .filter((c) => c.idEstadoCita !== 3 && c.idEstadoCita !== 4)
    .slice(0, 2);
  const mascotasVistazo = mascotas.slice(0, 3);

  const obtenerToken = () => localStorage.getItem('token_huellitas') || localStorage.getItem('jwt') || localStorage.getItem('token');

  const cargarMisCitas = async () => {
    const token = obtenerToken();
    if (!token) return;

    try {
      setCargandoCitas(true);
      const res = await fetch(`${API_BASE}/cita/mis-citas`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('No se pudo cargar tus citas');
      const data = await res.json();
      setCitas(data?.citas || []);
    } catch (error) {
      console.error(error);
      setCitas([]);
    } finally {
      setCargandoCitas(false);
    }
  };

  const cargarMisMascotas = async () => {
    const token = obtenerToken();
    if (!token) return;

    try {
      setCargandoMascotas(true);
      const res = await fetch(`${API_BASE}/usuario/mascotas`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.mensaje || 'No se pudo cargar tus mascotas');
      setMascotas(Array.isArray(data?.mascotas) ? data.mascotas : []);
    } catch (error) {
      console.error(error);
      setMascotas([]);
    } finally {
      setCargandoMascotas(false);
    }
  };

  const cargarResumen = async () => {
    const token = obtenerToken();
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/reporte/resumen`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json().catch(() => ({}));
      if (res.ok) setResumen(data.reporte);
    } catch (error) {
      console.error(error);
    }
  };

  const cargarHistorial = async () => {
    const token = obtenerToken();
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/reporte/historial-clinico`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json().catch(() => ({}));
      if (res.ok) setHistorial((data.historial || []).slice(0, 5));
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    cargarMisCitas();
    cargarMisMascotas();
    cargarResumen();
    cargarHistorial();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatFecha = (fechaISO) => {
    if (!fechaISO) return null;
    return new Date(fechaISO).toLocaleDateString('es-CR', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <ClienteLayout activo="dashboard" titulo={`Hola, ${nombreUsuario.split(' ')[0]}`}>
      {/* STATS — todas conectadas a datos reales */}
      <section className="stats-grid">
        <article className="stat-card">
          <div className="stat-icon"><PawPrint size={24} color="#52B788" /></div>
          <div className="stat-label">Mascotas registradas</div>
          <div className="stat-number">{mascotas.length}</div>
          <div className="stat-note">Perros y gatos asociados a tu cuenta</div>
        </article>

        <article className="stat-card">
          <div className="stat-icon"><CalendarDays size={24} color="#52B788" /></div>
          <div className="stat-label">Citas pendientes</div>
          <div className="stat-number">{cargandoCitas ? '…' : citasPendientes}</div>
          <div className="stat-note">Próximas visitas programadas</div>
        </article>

        <article className="stat-card">
          <div className="stat-icon"><Stethoscope size={24} color="#52B788" /></div>
          <div className="stat-label">Citas completadas</div>
          <div className="stat-number">{resumen ? resumen.citasCompletadas : '…'}</div>
          <div className="stat-note">Consultas ya atendidas</div>
        </article>

        <article className="stat-card">
          <div className="stat-icon"><Paperclip size={24} color="#52B788" /></div>
          <div className="stat-label">Atenciones externas</div>
          <div className="stat-number">{resumen ? resumen.atencionesExternasRegistradas : '…'}</div>
          <div className="stat-note">Registradas fuera de la plataforma</div>
        </article>
      </section>

      <section className="dashboard-grid">
        {/* MASCOTAS — solo vistazo; la gestión real vive en "Mis mascotas" */}
        <div className="content-card">
          <div className="card-head">
            <div>
              <h2 className="card-title">Mis mascotas</h2>
              <p className="card-subtitle">Un vistazo rápido de tus mascotas registradas.</p>
            </div>
            <Link to="/cliente/mis-mascotas" className="btn-soft" style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}>
              Ver todas <ArrowRight size={15} style={{ marginLeft: '6px' }} />
            </Link>
          </div>

          <div className="pet-list">
            {cargandoMascotas && <div className="appointment" style={{ display: 'block' }}>Cargando tus mascotas…</div>}
            {!cargandoMascotas && mascotas.length === 0 && (
              <div className="appointment" style={{ display: 'block' }}>Aún no tienes mascotas vinculadas a tu cuenta.</div>
            )}
            {!cargandoMascotas && mascotasVistazo.map((mascota) => {
              const nombre = mascota.nombre || mascota.Nombre;
              const especie = mascota.especie || mascota.Especie || 'Otra';
              const raza = mascota.raza || mascota.Raza || 'Sin raza';
              const Icon = especie === 'Gato' ? Cat : Dog;
              const mascotaId = mascota.idMascota ?? mascota.IdMascota;

              return (
                <div className="pet-item" key={mascotaId}>
                  <div className="pet-info">
                    <div className="pet-icon"><Icon size={24} color="#52B788" /></div>
                    <div>
                      <div className="pet-title">{nombre}</div>
                      <div className="pet-detail">{especie} · {raza}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CITAS — solo vistazo; agendar/reprogramar vive en "Mis citas" */}
        <div className="content-card">
          <div className="card-head">
            <div>
              <h2 className="card-title">Próximas citas</h2>
              <p className="card-subtitle">Visitas veterinarias programadas.</p>
            </div>
            <Link to="/cliente/mis-citas" className="btn-soft" style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}>
              Ver todas <ArrowRight size={15} style={{ marginLeft: '6px' }} />
            </Link>
          </div>

          <div className="appointment-list">
            {cargandoCitas && <div className="appointment" style={{ display: 'block' }}>Cargando tus citas…</div>}
            {!cargandoCitas && citasProximas.length === 0 && (
              <div className="appointment" style={{ display: 'block' }}>Aún no tienes citas agendadas.</div>
            )}
            {!cargandoCitas && citasProximas.map((cita) => {
              const fecha = new Date(cita.fecha);
              const dia = fecha.getDate();
              const mes = fecha.toLocaleDateString('es-CR', { month: 'short' }).replace('.', '');
              return (
                <div className="appointment" key={cita.idCita}>
                  <div className="date-box">
                    {dia}
                    <span>{mes}</span>
                  </div>
                  <div>
                    <div className="appointment-title">{cita.nombreServicio} — {cita.nombreMascota}</div>
                    <div className="appointment-text">{cita.horaInicio?.slice(0, 5)} · {cita.nombreVeterinario} · {cita.estadoCita}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RESUMEN DE CUENTA */}
        <div className="content-card">
          <div className="card-head">
            <div>
              <h2 className="card-title">Resumen de tu cuenta</h2>
              <p className="card-subtitle">Actividad clínica registrada hasta hoy.</p>
            </div>
          </div>

          <div className="appointment-list">
            <div className="appointment">
              <div className="date-box" style={{ background: 'rgba(82,183,136,.12)' }}>
                <Clock size={20} />
              </div>
              <div>
                <div className="appointment-title">Próxima cita</div>
                <div className="appointment-text">
                  {resumen?.proximaCita ? formatFecha(resumen.proximaCita) : 'No tenés citas programadas todavía.'}
                </div>
              </div>
            </div>

            <div className="appointment">
              <div className="date-box" style={{ background: 'rgba(239,68,68,.1)', color: '#b91c1c' }}>
                <AlertTriangle size={20} />
              </div>
              <div>
                <div className="appointment-title">Emergencias solicitadas</div>
                <div className="appointment-text">{resumen ? resumen.emergenciasSolicitadas : '…'} en total</div>
              </div>
            </div>
          </div>
        </div>

        {/* HISTORIAL — timeline real (citas completadas + atenciones externas + emergencias) */}
        <div className="content-card table-area">
          <div className="card-head">
            <div>
              <h2 className="card-title">Historial reciente</h2>
              <p className="card-subtitle">Últimas consultas y movimientos registrados.</p>
            </div>
          </div>

          <div className="appointment-list">
            {historial.length === 0 && (
              <div className="appointment" style={{ display: 'block' }}>Todavía no hay actividad clínica registrada.</div>
            )}
            {historial.map((item, index) => {
              const Icon = ICONO_HISTORIAL[item.tipo] || Activity;
              return (
                <div className="appointment" key={index}>
                  <div className="date-box" style={{ background: 'rgba(27,67,50,.10)' }}>
                    <Icon size={18} />
                  </div>
                  <div>
                    <div className="appointment-title">{item.nombreMascota} — {item.titulo}</div>
                    <div className="appointment-text">{formatFecha(item.fecha)} · {item.detalle}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </ClienteLayout>
  );
};

export default DashboardCliente;
