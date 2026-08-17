import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './DashboardCliente.css';
import { 
  Home, PawPrint, CalendarDays, Activity, Syringe, FileText, 
  Settings, LogOut, Bell, Plus, Download, Dog, Cat, Eye, CheckCircle2, AlertCircle
} from 'lucide-react';

import AgendarCitaModal from '../../components/Cliente/AgendarCitaModal/AgendarCitaModal';
import { API_BASE } from '../../api/config';
import { ToastContainer } from '../../components/Toast/Toast';
import { useToast } from '../../components/Toast/useToast';

const DashboardCliente = () => {
  const [usuario, setUsuario] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [citas, setCitas] = useState([]);
  const [mascotas, setMascotas] = useState([]);
  const [cargandoCitas, setCargandoCitas] = useState(false);
  const [cargandoMascotas, setCargandoMascotas] = useState(false);
  const [mostrarFormularioMascota, setMostrarFormularioMascota] = useState(false);
  const [editandoMascotaId, setEditandoMascotaId] = useState(null);
  const [formMascota, setFormMascota] = useState({
    nombre: '',
    idEspecie: 1,
    raza: '',
    fechaNacimiento: '',
    activo: true
  });
  const { toasts, showToast, removeToast } = useToast();

  const navigate = useNavigate();

  // Lógica de carga de usuario (Idéntica al Admin)
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
  const citasPendientes = citas.filter((c) => c.idEstadoCita !== 3 && c.idEstadoCita !== 4).length;
  const citasProximas = citas
    .filter((c) => c.idEstadoCita !== 3 && c.idEstadoCita !== 4)
    .slice(0, 2);

  // Función de cerrar sesión (Idéntica al Admin)
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
    } finally {
      setCargandoCitas(false);
    }
  };

  const cargarMisMascotas = async () => {
    const token = localStorage.getItem('token_huellitas') || localStorage.getItem('jwt') || localStorage.getItem('token');
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

  useEffect(() => {
    cargarMisCitas();
    cargarMisMascotas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetFormularioMascota = () => {
    setFormMascota({
      nombre: '',
      idEspecie: 1,
      raza: '',
      fechaNacimiento: '',
      activo: true
    });
    setEditandoMascotaId(null);
    setMostrarFormularioMascota(false);
  };

  const abrirFormularioNuevaMascota = () => {
    resetFormularioMascota();
    setMostrarFormularioMascota(true);
  };

  const abrirFormularioEdicionMascota = (mascota) => {
    setEditandoMascotaId(mascota.idMascota ?? mascota.IdMascota);
    setFormMascota({
      nombre: mascota.nombre || mascota.Nombre || '',
      idEspecie: Number(mascota.idEspecie ?? mascota.IdEspecie ?? 1),
      raza: mascota.raza || mascota.Raza || '',
      fechaNacimiento: mascota.fechaNacimiento || mascota.FechaNacimiento ? (mascota.fechaNacimiento || mascota.FechaNacimiento).slice(0, 10) : '',
      activo: mascota.activo ?? mascota.Activo ?? true
    });
    setMostrarFormularioMascota(true);
  };

  const guardarMascota = async () => {
    const token = localStorage.getItem('token_huellitas') || localStorage.getItem('jwt') || localStorage.getItem('token');
    if (!token) {
      showToast('Debes iniciar sesión para gestionar mascotas.', 'warning');
      return;
    }

    const payload = {
      nombre: formMascota.nombre.trim(),
      idEspecie: Number(formMascota.idEspecie),
      raza: formMascota.raza?.trim() || null,
      fechaNacimiento: formMascota.fechaNacimiento || null,
      activo: formMascota.activo
    };

    if (!payload.nombre) {
      showToast('El nombre de la mascota es obligatorio.', 'error');
      return;
    }

    try {
      const url = editandoMascotaId
        ? `${API_BASE}/usuario/mascotas/${editandoMascotaId}`
        : `${API_BASE}/usuario/mascotas`;
      const method = editandoMascotaId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.mensaje || 'No se pudo guardar la mascota.');

      showToast(data?.mensaje || 'Mascota guardada correctamente.', 'success');
      resetFormularioMascota();
      await cargarMisMascotas();
    } catch (error) {
      showToast(error.message || 'Error al guardar la mascota.', 'error');
    }
  };

  const eliminarMascota = async (mascota) => {
    const idMascota = mascota.idMascota ?? mascota.IdMascota;
    const nombre = mascota.nombre || mascota.Nombre || 'esta mascota';

    const confirmar = window.confirm(`¿Deseas eliminar a ${nombre}?`);
    if (!confirmar) return;

    const token = localStorage.getItem('token_huellitas') || localStorage.getItem('jwt') || localStorage.getItem('token');
    if (!token) {
      showToast('Debes iniciar sesión para eliminar mascotas.', 'warning');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/usuario/mascotas/${idMascota}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.mensaje || 'No se pudo eliminar la mascota.');

      showToast(data?.mensaje || 'Mascota eliminada.', 'success');
      await cargarMisMascotas();
    } catch (error) {
      showToast(error.message || 'Error al eliminar la mascota.', 'error');
    }
  };

  const handleConfirmarCita = async (datosCita) => {
    const token = localStorage.getItem('token_huellitas') || localStorage.getItem('jwt') || localStorage.getItem('token');
    if (!token) {
      showToast('Debes iniciar sesión para agendar una cita.', 'warning');
      setIsModalOpen(false);
      return;
    }

    try {
      const payload = {
        idMascota: Number(datosCita.idMascota),
        idServicio: Number(datosCita.idServicio),
        idVeterinario: datosCita.idVeterinario ? Number(datosCita.idVeterinario) : null,
        fecha: datosCita.fecha,
        horaInicio: datosCita.horaInicio,
        notas: datosCita.notas || ''
      };

      const res = await fetch(`${API_BASE}/cita`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.mensaje || 'No se pudo agendar la cita.');
      }

      setIsModalOpen(false);
      showToast(data?.mensaje || 'Cita agendada correctamente.', 'success');
      await cargarMisCitas();
    } catch (error) {
      showToast(error.message || 'Ocurrió un error al agendar la cita.', 'error');
    }
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
          <a href="#dashboard" className="nav-link-client active" onClick={(e) => e.preventDefault()}>
            <span className="nav-icon"><Home size={18} /></span>
            Dashboard
          </a>
          <a href="#mascotas" className="nav-link-client" onClick={(e) => { e.preventDefault(); navigate('/cliente/mis-mascotas'); }}>
            <span className="nav-icon"><PawPrint size={18} /></span>
            Mis mascotas
          </a>
          <a href="#citas" className="nav-link-client" onClick={(e) => { e.preventDefault(); navigate('/cliente/mis-citas'); }}>
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
          
          {/* BOTÓN CERRAR SESIÓN CON LÓGICA INTEGADA */}
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
              Dashboard del cliente
            </div>
            {/* SALUDO DINÁMICO */}
            <h1 className="hero-title">Hola, {nombreUsuario.split(' ')[0]} 👋</h1>
            <p className="hero-sub">Consulta tus mascotas, próximas citas, vacunas e historial de salud.</p>
          </div>

          <div className="top-actions">
            <button className="icon-button" title="Notificaciones">
              <Bell size={20} />
            </button>
            <div className="profile-mini">
              {/* AVATAR Y DATOS DINÁMICOS */}
              <div className="profile-avatar">{inicialAvatar}</div>
              <div>
                <div className="profile-name">{nombreUsuario}</div>
                <div className="profile-role">{rolUsuario}</div>
              </div>
            </div>
          </div>
        </section>

        {/* STATS */}
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
            <div className="stat-icon"><Syringe size={24} color="#52B788" /></div>
            <div className="stat-label">Vacunas al día</div>
            <div className="stat-number">8</div>
            <div className="stat-note">Control preventivo actualizado</div>
          </article>

          <article className="stat-card">
            <div className="stat-icon"><Activity size={24} color="#52B788" /></div>
            <div className="stat-label">Consultas realizadas</div>
            <div className="stat-number">12</div>
            <div className="stat-note">Historial clínico disponible</div>
          </article>
        </section>

        <section className="dashboard-grid">
          {/* MASCOTAS */}
          <div className="content-card">
            <div className="card-head">
              <div>
                <h2 className="card-title">Mis mascotas</h2>
                <p className="card-subtitle">Gestiona las mascotas registradas en tu cuenta.</p>
              </div>
              <button className="btn-main" onClick={abrirFormularioNuevaMascota}>
                <Plus size={16} style={{marginRight: '6px'}} /> Agregar mascota
              </button>
            </div>

            {mostrarFormularioMascota && (
              <div style={{ marginTop: 18, marginBottom: 18, padding: 18, border: '1px solid #e9ecef', borderRadius: 14, background: '#f7f9f8' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Nombre</label>
                    <input
                      value={formMascota.nombre}
                      onChange={(e) => setFormMascota({ ...formMascota, nombre: e.target.value })}
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid #dfe6e9', borderRadius: 10 }}
                      placeholder="Ej. Luna"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Especie</label>
                    <select
                      value={formMascota.idEspecie}
                      onChange={(e) => setFormMascota({ ...formMascota, idEspecie: Number(e.target.value) })}
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid #dfe6e9', borderRadius: 10 }}
                    >
                      <option value={1}>Perro</option>
                      <option value={2}>Gato</option>
                      <option value={3}>Otra</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Raza</label>
                    <input
                      value={formMascota.raza}
                      onChange={(e) => setFormMascota({ ...formMascota, raza: e.target.value })}
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid #dfe6e9', borderRadius: 10 }}
                      placeholder="Opcional"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Nacimiento</label>
                    <input
                      type="date"
                      value={formMascota.fechaNacimiento}
                      onChange={(e) => setFormMascota({ ...formMascota, fechaNacimiento: e.target.value })}
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid #dfe6e9', borderRadius: 10 }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14, gap: 10 }}>
                  <button className="btn-soft" onClick={resetFormularioMascota}>Cancelar</button>
                  <button className="btn-main" onClick={guardarMascota}>{editandoMascotaId ? 'Guardar cambios' : 'Guardar mascota'}</button>
                </div>
              </div>
            )}

            <div className="pet-list">
              {cargandoMascotas && <div className="appointment" style={{ display: 'block' }}>Cargando tus mascotas…</div>}
              {!cargandoMascotas && mascotas.length === 0 && (
                <div className="appointment" style={{ display: 'block' }}>Aún no tienes mascotas vinculadas a tu cuenta.</div>
              )}
              {!cargandoMascotas && mascotas.map((mascota) => {
                const nombre = mascota.nombre || mascota.Nombre;
                const especie = mascota.especie || mascota.Especie || 'Otra';
                const raza = mascota.raza || mascota.Raza || 'Sin raza';
                const edad = mascota.fechaNacimiento || mascota.FechaNacimiento
                  ? `${new Date(mascota.fechaNacimiento || mascota.FechaNacimiento).getFullYear() === new Date().getFullYear() ? 'Este año' : 'Registrada'}`
                  : 'Sin edad registrada';
                const Icon = especie === 'Gato' ? Cat : Dog;
                const mascotaId = mascota.idMascota ?? mascota.IdMascota;

                return (
                  <div className="pet-item" key={mascotaId}>
                    <div className="pet-info">
                      <div className="pet-icon"><Icon size={24} color="#52B788" /></div>
                      <div>
                        <div className="pet-title">{nombre}</div>
                        <div className="pet-detail">{especie} · {raza} · {edad}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <button className="btn-soft" onClick={() => abrirFormularioEdicionMascota(mascota)} style={{ padding: '8px 10px' }}>Editar</button>
                      <button className="btn-main" onClick={() => eliminarMascota(mascota)} style={{ padding: '8px 10px', background: '#ef4444', borderColor: '#ef4444' }}>Eliminar</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* CITAS */}
          <div className="content-card">
            <div className="card-head">
              <div>
                <h2 className="card-title">Próximas citas</h2>
                <p className="card-subtitle">Visitas veterinarias programadas.</p>
              </div>
              <button className="btn-main" onClick={() => setIsModalOpen(true)}>
                <CalendarDays size={16} style={{marginRight: '6px'}} /> Agendar cita
              </button>
            </div>

            <div className="appointment-list">
              {cargandoCitas && <div className="appointment" style={{ display: 'block' }}>Cargando tus citas…</div>}
              {!cargandoCitas && citasProximas.length === 0 && (
                <div className="appointment" style={{ display: 'block' }}>Aún no tienes citas agendadas.</div>
              )}
              {!cargandoCitas && citasProximas.map((cita) => {
                const fecha = new Date(cita.fecha);
                const fechaLabel = fecha.toLocaleDateString('es-CR', { day: '2-digit', month: 'short' });
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

          {/* SALUD */}
          <div className="content-card">
            <div className="card-head">
              <div>
                <h2 className="card-title">Estado de salud</h2>
                <p className="card-subtitle">Indicadores principales de tus mascotas.</p>
              </div>
            </div>

            <div className="health-card">
              <div className="health-row">
                <div>
                  <div className="health-label">Vacunas completadas</div>
                  <div className="progress mt-2" style={{ width: '220px' }}>
                    <div className="progress-bar" style={{ width: '85%' }}></div>
                  </div>
                </div>
                <div className="health-value">85%</div>
              </div>

              <div className="health-row">
                <div>
                  <div className="health-label">Controles veterinarios</div>
                  <div className="progress mt-2" style={{ width: '220px' }}>
                    <div className="progress-bar" style={{ width: '70%' }}></div>
                  </div>
                </div>
                <div className="health-value">70%</div>
              </div>
            </div>
          </div>

          {/* RECORDATORIOS */}
          <div className="content-card">
            <div className="card-head">
              <div>
                <h2 className="card-title">Recordatorios</h2>
                <p className="card-subtitle">Alertas importantes para el cliente.</p>
              </div>
            </div>

            <div className="appointment-list">
              <div className="appointment">
                <div className="date-box" style={{ background: '#fef3c7', color: '#d97706' }}>
                  <Syringe size={20} />
                </div>
                <div>
                  <div className="appointment-title">Vacuna pendiente</div>
                  <div className="appointment-text">Luna tiene una vacuna pendiente para este mes.</div>
                </div>
              </div>

              <div className="appointment">
                <div className="date-box" style={{ background: '#d1fae5', color: '#059669' }}>
                  <FileText size={20} />
                </div>
                <div>
                  <div className="appointment-title">Reporte disponible</div>
                  <div className="appointment-text">Ya puedes consultar el reporte clínico de Max.</div>
                </div>
              </div>
            </div>
          </div>

          {/* HISTORIAL */}
          <div className="content-card table-area">
            <div className="card-head">
              <div>
                <h2 className="card-title">Historial reciente</h2>
                <p className="card-subtitle">Últimas consultas y movimientos registrados.</p>
              </div>
              <button className="btn-soft">
                <Download size={16} style={{marginRight: '6px'}} /> Descargar historial
              </button>
            </div>

            <div className="table-wrap">
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Mascota</th>
                      <th>Servicio</th>
                      <th>Veterinario</th>
                      <th>Estado</th>
                      <th>Acción</th>
                    </tr>
                  </thead>

                  <tbody>
                    <tr>
                      <td>28/06/2026</td>
                      <td>Max</td>
                      <td>Consulta general</td>
                      <td>Dra. María López</td>
                      <td>
                        <span className="status-badge status-ok">
                          <CheckCircle2 size={12} style={{marginRight: '4px'}} /> Completado
                        </span>
                      </td>
                      <td>
                        <button className="action-btn" title="Ver detalle">
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

        </section>
      </main>

      {/* RENDERIZAMOS EL MODAL AQUÍ */}
      <AgendarCitaModal 
        open={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onConfirm={handleConfirmarCita} 
      />
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

export default DashboardCliente;