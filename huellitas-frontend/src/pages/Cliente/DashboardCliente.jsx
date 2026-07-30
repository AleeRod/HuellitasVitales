import React from 'react';
import './DashboardCliente.css';

const DashboardCliente = () => {
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
          <a href="#" className="nav-link-client active">
            <span className="nav-icon">🏠</span>
            Dashboard
          </a>
          <a href="#" className="nav-link-client">
            <span className="nav-icon">🐾</span>
            Mis mascotas
          </a>
          <a href="#" className="nav-link-client">
            <span className="nav-icon">📅</span>
            Mis citas
          </a>
          <a href="#" className="nav-link-client">
            <span className="nav-icon">🩺</span>
            Historial clínico
          </a>
          <a href="#" className="nav-link-client">
            <span className="nav-icon">💉</span>
            Vacunas
          </a>
          <a href="#" className="nav-link-client">
            <span className="nav-icon">📄</span>
            Reportes
          </a>

          <div className="nav-section">Sistema</div>
          <a href="#" className="nav-link-client">
            <span className="nav-icon">⚙️</span>
            Configuración
          </a>
          <a href="/login" className="nav-link-client">
            <span className="nav-icon">🚪</span>
            Cerrar sesión
          </a>

          <div className="sidebar-pet-card">
            <div className="pet-mini">
              <div className="pet-avatar">🐶</div>
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
            <h1 className="hero-title">Hola, Brandon 👋</h1>
            <p className="hero-sub">Consulta tus mascotas, próximas citas, vacunas e historial de salud.</p>
          </div>

          <div className="top-actions">
            <button className="icon-button" title="Notificaciones">🔔</button>
            <div className="profile-mini">
              <div className="profile-avatar">B</div>
              <div>
                <div className="profile-name">Brandon Alfaro</div>
                <div className="profile-role">Cliente</div>
              </div>
            </div>
          </div>
        </section>

        {/* STATS */}
        <section className="stats-grid">
          <article className="stat-card">
            <div className="stat-icon">🐾</div>
            <div className="stat-label">Mascotas registradas</div>
            <div className="stat-number">3</div>
            <div className="stat-note">Perros y gatos asociados a tu cuenta</div>
          </article>

          <article className="stat-card">
            <div className="stat-icon">📅</div>
            <div className="stat-label">Citas pendientes</div>
            <div className="stat-number">2</div>
            <div className="stat-note">Próximas visitas programadas</div>
          </article>

          <article className="stat-card">
            <div className="stat-icon">💉</div>
            <div className="stat-label">Vacunas al día</div>
            <div className="stat-number">8</div>
            <div className="stat-note">Control preventivo actualizado</div>
          </article>

          <article className="stat-card">
            <div className="stat-icon">🩺</div>
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
              <button className="btn-main">＋ Agregar mascota</button>
            </div>

            <div className="pet-list">
              <div className="pet-item">
                <div className="pet-info">
                  <div className="pet-icon">🐶</div>
                  <div>
                    <div className="pet-title">Max</div>
                    <div className="pet-detail">Perro · Golden Retriever · 4 años</div>
                  </div>
                </div>
                <span className="status-badge status-ok">● Salud estable</span>
              </div>

              <div className="pet-item">
                <div className="pet-info">
                  <div className="pet-icon">🐱</div>
                  <div>
                    <div className="pet-title">Luna</div>
                    <div className="pet-detail">Gata · Persa · 2 años</div>
                  </div>
                </div>
                <span className="status-badge status-warn">● Vacuna pendiente</span>
              </div>

              <div className="pet-item">
                <div className="pet-info">
                  <div className="pet-icon">🐶</div>
                  <div>
                    <div className="pet-title">Rocky</div>
                    <div className="pet-detail">Perro · French Poodle · 6 años</div>
                  </div>
                </div>
                <span className="status-badge status-ok">● Control al día</span>
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
              <button className="btn-soft">Ver agenda</button>
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

              <div className="appointment">
                <div className="date-box">
                  02
                  <span>Ago</span>
                </div>
                <div>
                  <div className="appointment-title">Control dental — Rocky</div>
                  <div className="appointment-text">11:15 a.m. · Consultorio 2 · Dra. Ana Mora</div>
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

              <div className="health-row">
                <div>
                  <div className="health-label">Tratamientos activos</div>
                  <div className="progress mt-2" style={{ width: '220px' }}>
                    <div className="progress-bar" style={{ width: '45%' }}></div>
                  </div>
                </div>
                <div className="health-value">2</div>
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
                <div className="date-box">💉</div>
                <div>
                  <div className="appointment-title">Vacuna pendiente</div>
                  <div className="appointment-text">Luna tiene una vacuna pendiente para este mes.</div>
                </div>
              </div>

              <div className="appointment">
                <div className="date-box">📄</div>
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
              <button className="btn-soft">Descargar historial</button>
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
                      <td><span className="status-badge status-ok">Completado</span></td>
                      <td><button className="action-btn">Ver</button></td>
                    </tr>

                    <tr>
                      <td>18/06/2026</td>
                      <td>Luna</td>
                      <td>Desparasitación</td>
                      <td>Dr. Carlos Rojas</td>
                      <td><span className="status-badge status-ok">Completado</span></td>
                      <td><button className="action-btn">Ver</button></td>
                    </tr>

                    <tr>
                      <td>05/06/2026</td>
                      <td>Rocky</td>
                      <td>Control dental</td>
                      <td>Dra. Ana Mora</td>
                      <td><span className="status-badge status-warn">Seguimiento</span></td>
                      <td><button className="action-btn">Ver</button></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

        </section>
      </main>
    </div>
  );
};

export default DashboardCliente;