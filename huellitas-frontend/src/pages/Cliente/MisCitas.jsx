import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './DashboardCliente.css';
import { 
  Home, PawPrint, CalendarDays, Activity, Syringe, FileText, 
  Settings, LogOut, Bell, Plus, Download, Dog, Cat, Eye, CheckCircle2, AlertCircle
} from 'lucide-react';

import { API_BASE } from '../../api/config';
import { ToastContainer } from '../../components/Toast/Toast';
import { useToast } from '../../components/Toast/useToast';

const MisCitas = () => {
  const [usuario, setUsuario] = useState(null);
  const [citas, setCitas] = useState([]);
  const [cargandoCitas, setCargandoCitas] = useState(false);
  const { toasts, showToast, removeToast } = useToast();
  const navigate = useNavigate();

  // Lógica de carga de usuario (Idéntica al Dashboard)
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

  // Variables dinámicas para la interfaz
  const nombreUsuario = usuario?.nombre || usuario?.Nombre || usuario?.nombreCompleto || 'Cliente';
  const rolUsuario = usuario?.rol?.nombre || usuario?.rolNombre || usuario?.rol || 'Cliente';
  const inicialAvatar = nombreUsuario.charAt(0).toUpperCase();

  // Función de cerrar sesión
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

  const cargarMisCitas = async () => {
    const token = localStorage.getItem('token_huellitas') || localStorage.getItem('jwt') || localStorage.getItem('token');
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
      showToast('Error al cargar tus citas', 'error');
    } finally {
      setCargandoCitas(false);
    }
  };

  useEffect(() => {
    cargarMisCitas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Lógica de agrupación por estado
  const getIdEstado = (cita) => Number(cita?.idEstadoCita ?? cita?.IdEstadoCita ?? 0);
  const esReprogramada = (cita) => {
    const texto = `${cita?.notas ?? cita?.Notas ?? ''} ${cita?.motivo ?? cita?.Motivo ?? ''}`.toLowerCase();
    return /reprogram|reagend/.test(texto);
  };

  const misCitasAgrupadas = [
    {
      key: 'confirmadas',
      label: 'Confirmadas',
      badge: 'status-ok',
      items: citas.filter((c) => getIdEstado(c) === 2)
    },
    {
      key: 'pendientes',
      label: 'Pendientes',
      badge: 'status-warn',
      items: citas.filter((c) => getIdEstado(c) === 1 && !esReprogramada(c))
    },
    {
      key: 'reprogramadas',
      label: 'Reprogramadas',
      badge: 'status-warn',
      items: citas.filter((c) => getIdEstado(c) === 1 && esReprogramada(c))
    },
    {
      key: 'canceladas',
      label: 'Canceladas',
      badge: 'status-cancel',
      items: citas.filter((c) => getIdEstado(c) === 3)
    }
  ];

  const renderCitaCard = (cita) => {
    const idEstado = getIdEstado(cita);
    const estadoTexto = idEstado === 1 ? 'Pendiente' : idEstado === 2 ? 'Confirmada' : idEstado === 3 ? 'Cancelada' : 'Completada';
    const fechaRaw = cita?.fecha ?? cita?.Fecha;
    const hora = cita?.horaInicio ?? cita?.HoraInicio ?? '00:00';
    const fecha = fechaRaw ? new Date(fechaRaw) : null;
    const fechaLabel = fecha && !Number.isNaN(fecha.getTime())
      ? fecha.toLocaleDateString('es-CR', { day: '2-digit', month: 'short', year: 'numeric' })
      : 'Sin fecha';
    const dia = fecha && !Number.isNaN(fecha.getTime()) ? fecha.getDate() : '--';
    const mes = fecha && !Number.isNaN(fecha.getTime())
      ? fecha.toLocaleDateString('es-CR', { month: 'short' }).replace('.', '')
      : '---';
    const badgeStyle = {
      background: idEstado === 2 ? 'rgba(82,183,136,.16)' : idEstado === 3 ? 'rgba(239,68,68,.12)' : idEstado === 4 ? 'rgba(148,163,184,.16)' : 'rgba(221,161,94,.18)',
      color: idEstado === 2 ? '#2d6a4f' : idEstado === 3 ? '#b91c1c' : idEstado === 4 ? '#475569' : '#945d18'
    };

    return (
      <div className="appointment" key={cita.idCita ?? cita.IdCita}>
        <div className="date-box" style={{ background: idEstado === 2 ? 'rgba(82,183,136,.12)' : idEstado === 3 ? 'rgba(239,68,68,.12)' : 'rgba(27,67,50,.10)' }}>
          {dia}
          <span>{mes}</span>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', marginBottom: '.35rem' }}>
            <div className="appointment-title">{cita.nombreServicio ?? cita.NombreServicio ?? 'Consulta'} · {cita.nombreMascota ?? cita.NombreMascota ?? 'Mascota'}</div>
            <span className="status-badge" style={badgeStyle}>{estadoTexto}</span>
          </div>
          <div className="appointment-text">
            {fechaLabel} · {String(hora).slice(0, 5)} · {cita.nombreVeterinario ?? cita.NombreVeterinario ?? 'Veterinario'}
          </div>
          {cita.notas || cita.Notas ? (
            <div className="appointment-text" style={{ marginTop: '.35rem', fontSize: '.76rem', fontStyle: 'italic', color: '#718096' }}>
              Notas: {cita.notas ?? cita.Notas}
            </div>
          ) : null}
        </div>
      </div>
    );
  };

  return (
    <div className="client-shell">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="sidebar-content">
          <div className="brand-card">
            <img src="/Imagenes/logo.png" alt="Logo Huellitas Vitales" />
            <div>
              <div className="brand-name">Huellitas Vitales</div>
              <div className="brand-label">Portal Cliente</div>
            </div>
          </div>

          <div className="nav-section">Mi cuenta</div>
          <a href="#dashboard" className="nav-link-client" onClick={(e) => { e.preventDefault(); navigate('/cliente'); }}>
            <span className="nav-icon"><Home size={18} /></span>
            Dashboard
          </a>
          <a href="#mascotas" className="nav-link-client" onClick={(e) => { e.preventDefault(); navigate('/cliente/mis-mascotas'); }}>
            <span className="nav-icon"><PawPrint size={18} /></span>
            Mis mascotas
          </a>
          <a href="#citas" className="nav-link-client active" onClick={(e) => e.preventDefault()}>
            <span className="nav-icon"><CalendarDays size={18} /></span>
            Mis citas
          </a>
          <a href="#historial" className="nav-link-client" onClick={(e) => { e.preventDefault(); navigate('/cliente/historial-clinico'); }}>
            <span className="nav-icon"><Activity size={18} /></span>
            Historial clínico
          </a>
          <a href="#vacunas" className="nav-link-client" onClick={(e) => { e.preventDefault(); navigate('/cliente/vacunas'); }}>
            <span className="nav-icon"><Syringe size={18} /></span>
            Vacunas
          </a>
          <a href="#reportes" className="nav-link-client" onClick={(e) => { e.preventDefault(); navigate('/cliente/reportes'); }}>
            <span className="nav-icon"><FileText size={18} /></span>
            Reportes
          </a>

          <div className="nav-section">Sistema</div>
          <a href="#configuracion" className="nav-link-client" onClick={(e) => { e.preventDefault(); navigate('/cliente/configuracion'); }}>
            <span className="nav-icon"><Settings size={18} /></span>
            Configuración
          </a>
          
          {/* BOTÓN CERRAR SESIÓN */}
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
              <div className="pet-avatar"><Dog size={16} color="#4a4a4a" /></div>
              <div>
                <div className="pet-name">Max</div>
                <div className="pet-text">Próxima cita: 15 de julio</div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <main className="main-content">
        {/* TOPBAR */}
        <section className="topbar">
          <div>
            <div className="hero-badge">
              <svg width="9" height="9" viewBox="0 0 10 10">
                <circle cx="5" cy="5" r="5" fill="#52B788" />
              </svg>
              Mis citas
            </div>
            <h1 className="hero-title">Tus citas veterinarias 📋</h1>
            <p className="hero-sub">Visualiza todas tus citas agrupadas por estado de confirmación.</p>
          </div>

          <div className="top-actions">
            <button className="icon-button" title="Notificaciones">
              <Bell size={20} />
            </button>
            <div className="profile-mini">
              <div className="profile-avatar">{inicialAvatar}</div>
              <div>
                <div className="profile-name">{nombreUsuario}</div>
                <div className="profile-role">{rolUsuario}</div>
              </div>
            </div>
          </div>
        </section>

        {/* CONTENIDO PRINCIPAL */}
        <section className="dashboard-grid" style={{ gridTemplateColumns: '1fr' }}>
          <div className="content-card">
            <div className="card-head">
              <div>
                <h2 className="card-title">Mis citas</h2>
                <p className="card-subtitle">Consulta todas tus citas organizadas por estado.</p>
              </div>
            </div>

            {cargandoCitas && <div className="appointment-list"><div className="appointment" style={{ display: 'block' }}>Cargando tus citas…</div></div>}
            {!cargandoCitas && citas.length === 0 && (
              <div className="appointment-list"><div className="appointment" style={{ display: 'block' }}>Aún no tienes citas agendadas.</div></div>
            )}
            {!cargandoCitas && citas.length > 0 && (
              <div className="appointment-list">
                {misCitasAgrupadas.map((grupo) => (
                  <div key={grupo.key} style={{ border: '1px solid #e9ecef', borderRadius: 18, background: '#fbfdfb', padding: '1rem', marginBottom: '.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', paddingBottom: '.75rem', borderBottom: '1px solid #dde3d8' }}>
                      <strong style={{ color: '#1B4332', fontSize: '.98rem' }}>{grupo.label}</strong>
                      <span style={{ background: '#edf7f1', color: '#2d6a4f', borderRadius: 999, padding: '0.35rem 0.65rem', fontSize: '.74rem', fontWeight: 700 }}>
                        {grupo.items.length} {grupo.items.length === 1 ? 'cita' : 'citas'}
                      </span>
                    </div>
                    {grupo.items.length === 0 ? (
                      <div className="appointment" style={{ display: 'block', background: '#fafbfa', border: '1px dashed #dde3d8' }}>
                        No tienes citas en esta categoría.
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gap: '.75rem' }}>
                        {grupo.items.map((cita) => renderCitaCard(cita))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

export default MisCitas;
