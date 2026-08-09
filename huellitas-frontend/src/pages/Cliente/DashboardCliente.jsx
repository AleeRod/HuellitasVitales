import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // Importamos useNavigate para la redirección
import './DashboardCliente.css';
import { 
  Home, PawPrint, CalendarDays, Activity, Syringe, FileText, 
  Settings, LogOut, Bell, Plus, Download, Dog, Cat, Eye, CheckCircle2, AlertCircle
} from 'lucide-react';

import AgendarCitaModal from '../../components/Cliente/AgendarCitaModal/AgendarCitaModal';

const DashboardCliente = () => {
  // Estados para sesión y modal
  const [usuario, setUsuario] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
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

  // Función de cerrar sesión (Idéntica al Admin)
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

  const handleConfirmarCita = (datosCita) => {
    console.log("Cita agendada desde el dashboard:", datosCita);
    // Aquí conectaremos con el POST de citas luego
    setIsModalOpen(false);
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
          <a href="#mascotas" className="nav-link-client" onClick={(e) => e.preventDefault()}>
            <span className="nav-icon"><PawPrint size={18} /></span>
            Mis mascotas
          </a>
          <a href="#citas" className="nav-link-client" onClick={(e) => e.preventDefault()}>
            <span className="nav-icon"><CalendarDays size={18} /></span>
            Mis citas
          </a>
          <a href="#historial" className="nav-link-client" onClick={(e) => e.preventDefault()}>
            <span className="nav-icon"><Activity size={18} /></span>
            Historial clínico
          </a>
          <a href="#vacunas" className="nav-link-client" onClick={(e) => e.preventDefault()}>
            <span className="nav-icon"><Syringe size={18} /></span>
            Vacunas
          </a>
          <a href="#reportes" className="nav-link-client" onClick={(e) => e.preventDefault()}>
            <span className="nav-icon"><FileText size={18} /></span>
            Reportes
          </a>

          <div className="nav-section">Sistema</div>
          <a href="#configuracion" className="nav-link-client" onClick={(e) => e.preventDefault()}>
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
            <div className="stat-number">3</div>
            <div className="stat-note">Perros y gatos asociados a tu cuenta</div>
          </article>

          <article className="stat-card">
            <div className="stat-icon"><CalendarDays size={24} color="#52B788" /></div>
            <div className="stat-label">Citas pendientes</div>
            <div className="stat-number">2</div>
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
                <p className="card-subtitle">Resumen rápido de las mascotas registradas.</p>
              </div>
              <button className="btn-main">
                <Plus size={16} style={{marginRight: '6px'}} /> Agregar mascota
              </button>
            </div>

            <div className="pet-list">
              <div className="pet-item">
                <div className="pet-info">
                  <div className="pet-icon"><Dog size={24} color="#52B788" /></div>
                  <div>
                    <div className="pet-title">Max</div>
                    <div className="pet-detail">Perro · Golden Retriever · 4 años</div>
                  </div>
                </div>
                <span className="status-badge status-ok">● Salud estable</span>
              </div>

              <div className="pet-item">
                <div className="pet-info">
                  <div className="pet-icon"><Cat size={24} color="#f59e0b" /></div>
                  <div>
                    <div className="pet-title">Luna</div>
                    <div className="pet-detail">Gata · Persa · 2 años</div>
                  </div>
                </div>
                <span className="status-badge status-warn">● Vacuna pendiente</span>
              </div>
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
              <div className="appointment">
                <div className="date-box">
                  15
                  <span>Jul</span>
                </div>
                <div>
                  <div className="appointment-title">Consulta general — Max</div>
                  <div className="appointment-text">9:00 a.m. · Clínica Central · Dra. María López</div>
                </div>
              </div>

              <div className="appointment">
                <div className="date-box">
                  22
                  <span>Jul</span>
                </div>
                <div>
                  <div className="appointment-title">Vacunación — Luna</div>
                  <div className="appointment-text">2:30 p.m. · Área de vacunación · Dr. Carlos Rojas</div>
                </div>
              </div>
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
    </div>
  );
};

export default DashboardCliente;