import React from 'react';
import './PanelVeterinario.css';
// Si el logo está en src/assets descomenta la siguiente línea y cambia el src del img:
// import logo from '../../assets/logo.png';

const PanelVeterinario = () => {
  return (
    <div className="vet-shell">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="sidebar-content">
          <div className="brand-card">
            <img src="/Imagenes/logo.png" alt="Logo Huellitas Vitales" />
            <div>
              <div className="brand-name">Huellitas Vitales</div>
              <div className="brand-label">Panel Veterinario</div>
            </div>
          </div>

          <div className="nav-section">Clínica</div>
          <a href="#" className="nav-link-vet active">
            <span className="nav-icon">🏠</span>
            Panel clínico
          </a>
          <a href="#" className="nav-link-vet">
            <span className="nav-icon">📅</span>
            Agenda diaria
          </a>
          <a href="#" className="nav-link-vet">
            <span className="nav-icon">🐾</span>
            Pacientes
          </a>
          <a href="#" className="nav-link-vet">
            <span className="nav-icon">📋</span>
            Expedientes
          </a>
          <a href="#" className="nav-link-vet">
            <span className="nav-icon">💉</span>
            Vacunas
          </a>

          <div className="nav-section">Gestión</div>
          <a href="#" className="nav-link-vet">
            <span className="nav-icon">🧾</span>
            Recetas
          </a>
          <a href="#" className="nav-link-vet">
            <span className="nav-icon">📊</span>
            Reportes
          </a>
          <a href="/login" className="nav-link-vet">
            <span className="nav-icon">🚪</span>
            Cerrar sesión
          </a>

          <div className="sidebar-note">
            <div className="note-title">Turno de hoy</div>
            <div className="note-text">
              8 citas agendadas, 2 controles urgentes y 1 vacunación pendiente.
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
              Panel clínico
            </div>
            <h1 className="hero-title">Agenda diaria del veterinario</h1>
            <p className="hero-sub">Consulta citas del día, pacientes, expedientes y notas clínicas.</p>
          </div>

          <div className="top-actions">
            <button className="icon-button" title="Notificaciones">🔔</button>
            <div className="profile-mini">
              <div className="profile-avatar">V</div>
              <div>
                <div className="profile-name">Dr. Carlos Rojas</div>
                <div className="profile-role">Veterinario</div>
              </div>
            </div>
          </div>
        </section>

        {/* STATS */}
        <section className="stats-grid">
          <article className="stat-card">
            <div className="stat-icon">📅</div>
            <div className="stat-label">Citas de hoy</div>
            <div className="stat-number">8</div>
            <div className="stat-note">Consultas y controles programados</div>
          </article>

          <article className="stat-card">
            <div className="stat-icon">🐾</div>
            <div className="stat-label">Pacientes atendidos</div>
            <div className="stat-number">3</div>
            <div className="stat-note">Consultas completadas durante el día</div>
          </article>

          <article className="stat-card">
            <div className="stat-icon">💉</div>
            <div className="stat-label">Vacunas pendientes</div>
            <div className="stat-number">2</div>
            <div className="stat-note">Aplicaciones programadas</div>
          </article>

          <article className="stat-card">
            <div className="stat-icon">⚠️</div>
            <div className="stat-label">Casos urgentes</div>
            <div className="stat-number">1</div>
            <div className="stat-note">Requiere atención prioritaria</div>
          </article>
        </section>

        <section className="panel-grid">
          {/* AGENDA DIARIA */}
          <div className="content-card agenda-card">
            <div className="card-head">
              <div>
                <h2 className="card-title">Vista de agenda diaria</h2>
                <p className="card-subtitle">Listado visual de citas, horarios, pacientes y estado de atención.</p>
              </div>
              <button className="btn-main">＋ Nueva cita</button>
            </div>

            <div className="agenda-toolbar">
              <div className="date-pill">📅 Martes, 06 de julio de 2026</div>
              <div className="d-flex gap-2 flex-wrap">
                <select className="filter-select">
                  <option>Todos los estados</option>
                  <option>En espera</option>
                  <option>En consulta</option>
                  <option>Finalizado</option>
                </select>
                <button className="btn-soft">Exportar agenda</button>
              </div>
            </div>

            <div className="schedule-list">
              <div className="schedule-item">
                <div className="time-box">
                  8:00
                  <span>a.m.</span>
                </div>

                <div className="patient-info">
                  <div className="pet-icon">🐶</div>
                  <div>
                    <div className="patient-title">Max — Consulta general</div>
                    <div className="patient-detail">Golden Retriever · 4 años · Dueño: Brandon Alfaro</div>
                  </div>
                </div>

                <span className="status-badge status-done">● Finalizado</span>
              </div>

              <div className="schedule-item">
                <div className="time-box">
                  9:30
                  <span>a.m.</span>
                </div>

                <div className="patient-info">
                  <div className="pet-icon">🐱</div>
                  <div>
                    <div className="patient-title">Luna — Vacunación</div>
                    <div className="patient-detail">Gata Persa · 2 años · Dueña: Laura Pérez</div>
                  </div>
                </div>

                <span className="status-badge status-ready">● En consulta</span>
              </div>

              <div className="schedule-item">
                <div className="time-box">
                  11:00
                  <span>a.m.</span>
                </div>

                <div className="patient-info">
                  <div className="pet-icon">🐶</div>
                  <div>
                    <div className="patient-title">Rocky — Control dental</div>
                    <div className="patient-detail">French Poodle · 6 años · Dueño: José Méndez</div>
                  </div>
                </div>

                <span className="status-badge status-next">● En espera</span>
              </div>

              <div className="schedule-item">
                <div className="time-box">
                  1:30
                  <span>p.m.</span>
                </div>

                <div className="patient-info">
                  <div className="pet-icon">🐕</div>
                  <div>
                    <div className="patient-title">Toby — Revisión por dolor</div>
                    <div className="patient-detail">Beagle · 5 años · Dueña: Ana Mora</div>
                  </div>
                </div>

                <span className="status-badge status-urgent">● Urgente</span>
              </div>
            </div>
          </div>

          {/* PACIENTES ACTIVOS */}
          <div className="content-card">
            <div className="card-head">
              <div>
                <h2 className="card-title">Pacientes en atención</h2>
                <p className="card-subtitle">Mascotas activas para consulta clínica.</p>
              </div>
              <button className="btn-soft">Ver todos</button>
            </div>

            <div className="patient-list">
              <div className="patient-card">
                <div className="patient-info">
                  <div className="pet-icon">🐱</div>
                  <div>
                    <div className="patient-title">Luna</div>
                    <div className="patient-detail">Vacunación · Consultorio 1</div>
                  </div>
                </div>
                <span className="status-badge status-ready">En consulta</span>
              </div>

              <div className="patient-card">
                <div className="patient-info">
                  <div className="pet-icon">🐶</div>
                  <div>
                    <div className="patient-title">Rocky</div>
                    <div className="patient-detail">Control dental · Sala de espera</div>
                  </div>
                </div>
                <span className="status-badge status-next">En espera</span>
              </div>

              <div className="patient-card">
                <div className="patient-info">
                  <div className="pet-icon">🐕</div>
                  <div>
                    <div className="patient-title">Toby</div>
                    <div className="patient-detail">Dolor abdominal · Prioridad alta</div>
                  </div>
                </div>
                <span className="status-badge status-urgent">Urgente</span>
              </div>
            </div>
          </div>

          {/* FORMULARIO NOTA CLINICA */}
          <div className="content-card">
            <div className="card-head">
              <div>
                <h2 className="card-title">Nota clínica rápida</h2>
                <p className="card-subtitle">Maquetación para registrar observaciones de consulta.</p>
              </div>
            </div>

            <div className="form-area">
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Paciente</label>
                  <select className="form-select">
                    <option>Luna</option>
                    <option>Rocky</option>
                    <option>Toby</option>
                    <option>Max</option>
                  </select>
                </div>

                <div className="col-md-6">
                  <label className="form-label">Tipo de consulta</label>
                  <select className="form-select">
                    <option>Consulta general</option>
                    <option>Vacunación</option>
                    <option>Control dental</option>
                    <option>Urgencia</option>
                  </select>
                </div>

                <div className="col-md-6">
                  <label className="form-label">Peso</label>
                  <input type="text" className="form-control" placeholder="Ej: 12 kg" />
                </div>

                <div className="col-md-6">
                  <label className="form-label">Temperatura</label>
                  <input type="text" className="form-control" placeholder="Ej: 38.5 °C" />
                </div>

                <div className="col-12">
                  <label className="form-label">Observaciones</label>
                  <textarea className="form-control" rows="4" placeholder="Anotar síntomas, diagnóstico preliminar o recomendaciones..."></textarea>
                </div>

                <div className="col-12 d-flex justify-content-end gap-2">
                  <button className="btn-soft">Cancelar</button>
                  <button className="btn-main">Guardar nota</button>
                </div>
              </div>
            </div>
          </div>

          {/* HISTORIAL */}
          <div className="content-card table-area">
            <div className="card-head">
              <div>
                <h2 className="card-title">Historial clínico reciente</h2>
                <p className="card-subtitle">Últimas atenciones realizadas por el veterinario.</p>
              </div>
              <button className="btn-soft">Descargar reporte</button>
            </div>

            <div className="table-wrap">
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead>
                    <tr>
                      <th>Hora</th>
                      <th>Paciente</th>
                      <th>Servicio</th>
                      <th>Dueño</th>
                      <th>Estado</th>
                      <th>Acción</th>
                    </tr>
                  </thead>

                  <tbody>
                    <tr>
                      <td>8:00 a.m.</td>
                      <td>Max</td>
                      <td>Consulta general</td>
                      <td>Brandon Alfaro</td>
                      <td><span className="status-badge status-done">Finalizado</span></td>
                      <td><button className="action-btn">Ver ficha</button></td>
                    </tr>

                    <tr>
                      <td>9:30 a.m.</td>
                      <td>Luna</td>
                      <td>Vacunación</td>
                      <td>Laura Pérez</td>
                      <td><span className="status-badge status-ready">En consulta</span></td>
                      <td><button className="action-btn">Abrir</button></td>
                    </tr>

                    <tr>
                      <td>11:00 a.m.</td>
                      <td>Rocky</td>
                      <td>Control dental</td>
                      <td>José Méndez</td>
                      <td><span className="status-badge status-next">En espera</span></td>
                      <td><button className="action-btn">Abrir</button></td>
                    </tr>

                    <tr>
                      <td>1:30 p.m.</td>
                      <td>Toby</td>
                      <td>Urgencia</td>
                      <td>Ana Mora</td>
                      <td><span className="status-badge status-urgent">Urgente</span></td>
                      <td><button className="action-btn">Atender</button></td>
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

export default PanelVeterinario;