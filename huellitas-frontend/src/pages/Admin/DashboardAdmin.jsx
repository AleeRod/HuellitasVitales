import React from 'react';
import './DashboardAdmin.css';

const DashboardAdmin = () => {
  return (
    <>
      <div className="admin-shell">
        {/* SIDEBAR */}
        <aside className="sidebar">
          <div className="sidebar-inner">
            <div className="brand-card">
              <img src="/Imagenes/logo.png" alt="Logo Huellitas Vitales" />
              <div>
                <div className="brand-name">Huellitas Vitales</div>
                <div className="brand-badge">Clínica Veterinaria</div>
              </div>
            </div>

            <div className="sidebar-section">Panel global</div>
            <a href="#" className="nav-link-admin active">
              <span className="nav-icon">🏠</span>
              Dashboard
            </a>
            <a href="#" className="nav-link-admin">
              <span className="nav-icon">👥</span>
              Usuarios
            </a>
            <a href="#" className="nav-link-admin">
              <span className="nav-icon">🐾</span>
              Mascotas
            </a>
            <a href="#" className="nav-link-admin">
              <span className="nav-icon">🩺</span>
              Veterinarios
            </a>
            <a href="#" className="nav-link-admin">
              <span className="nav-icon">📅</span>
              Citas
            </a>
            <a href="#" className="nav-link-admin">
              <span className="nav-icon">📊</span>
              Reportes
            </a>

            <div className="sidebar-section">Administración</div>
            <a href="#" className="nav-link-admin">
              <span className="nav-icon">🔐</span>
              Roles y permisos
            </a>
            <a href="#" className="nav-link-admin">
              <span className="nav-icon">⚙️</span>
              Configuración
            </a>
            <a href="/login" className="nav-link-admin">
              <span className="nav-icon">🚪</span>
              Cerrar sesión
            </a>

            <div className="sidebar-footer">
              <div className="sidebar-footer-title">Sistema seguro</div>
              <div className="sidebar-footer-text">
                Control de usuarios, roles y estados para proteger la información clínica.
              </div>
            </div>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className="main-content">
          {/* TOPBAR */}
          <section className="topbar">
            <div>
              <div className="hero-badge">
                <svg width="9" height="9" viewBox="0 0 10 10">
                  <circle cx="5" cy="5" r="5" fill="#52B788" />
                </svg>
                Administración global
              </div>
              <h1 className="hero-title">Panel de administración</h1>
              <p className="hero-sub">
                Controla usuarios, permisos y estados dentro de Huellitas Vitales.
              </p>
            </div>

            <div className="top-actions">
              <div className="top-search">
                <span>🔎</span>
                <input type="text" placeholder="Buscar en el sistema..." />
              </div>

              <button className="icon-button" title="Notificaciones">🔔</button>

              <div className="profile-mini">
                <div className="profile-avatar">A</div>
                <div>
                  <div className="profile-name">Administrador</div>
                  <div className="profile-role">Acceso global</div>
                </div>
              </div>
            </div>
          </section>

          {/* STATS */}
          <section className="stat-grid">
            <article className="stat-card">
              <div className="stat-top">
                <div className="stat-icon">👥</div>
                <div className="stat-chip">+12</div>
              </div>
              <div className="stat-label">Total de usuarios</div>
              <div className="stat-number">152</div>
              <div className="stat-note">Usuarios registrados en la plataforma</div>
            </article>

            <article className="stat-card">
              <div className="stat-top">
                <div className="stat-icon">✅</div>
                <div className="stat-chip">91%</div>
              </div>
              <div className="stat-label">Usuarios activos</div>
              <div className="stat-number">139</div>
              <div className="stat-note">Cuentas habilitadas actualmente</div>
            </article>

            <article className="stat-card">
              <div className="stat-top">
                <div className="stat-icon">🩺</div>
                <div className="stat-chip">Equipo</div>
              </div>
              <div className="stat-label">Veterinarios</div>
              <div className="stat-number">18</div>
              <div className="stat-note">Personal médico registrado</div>
            </article>

            <article className="stat-card">
              <div className="stat-top">
                <div className="stat-icon">🔐</div>
                <div className="stat-chip">Admin</div>
              </div>
              <div className="stat-label">Administradores</div>
              <div className="stat-number">5</div>
              <div className="stat-note">Usuarios con permisos globales</div>
            </article>
          </section>

          {/* TABLE CARD */}
          <section className="content-card">
            <div className="card-top">
              <div>
                <h2 className="card-title">Gestión de usuarios</h2>
                <p className="card-subtitle">
                  Maquetación de tabla administrativa para consultar, filtrar, editar y controlar usuarios.
                </p>
              </div>

              <button className="btn-main" data-bs-toggle="modal" data-bs-target="#userModal">
                <span>＋</span> Nuevo usuario
              </button>
            </div>

            <div className="toolbar">
              <div className="search-field">
                <span>🔎</span>
                <input type="text" placeholder="Buscar por nombre, correo o ID..." />
              </div>

              <select className="filter-field" style={{ maxWidth: '190px' }}>
                <option>Todos los roles</option>
                <option>Administrador</option>
                <option>Veterinario</option>
                <option>Cliente</option>
              </select>

              <select className="filter-field" style={{ maxWidth: '190px' }}>
                <option>Todos los estados</option>
                <option>Activo</option>
                <option>Inactivo</option>
                <option>Bloqueado</option>
              </select>

              <button className="btn-soft">Exportar</button>
            </div>

            <div className="table-wrap">
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead>
                    <tr>
                      <th>Usuario</th>
                      <th>Correo</th>
                      <th>Rol</th>
                      <th>Estado</th>
                      <th>Registro</th>
                      <th>Último acceso</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>

                  <tbody>
                    <tr>
                      <td>
                        <div className="user-info">
                          <div className="user-avatar">AM</div>
                          <div>
                            <div className="user-name">Ana Mora</div>
                            <div className="user-id">ID: USR-001</div>
                          </div>
                        </div>
                      </td>
                      <td>ana.mora@email.com</td>
                      <td><span className="role-badge role-admin">🔐 Administrador</span></td>
                      <td><span className="status-badge status-active">● Activo</span></td>
                      <td>29/06/2026</td>
                      <td>Hoy, 8:30 a.m.</td>
                      <td>
                        <div className="action-group">
                          <button className="action-btn" title="Ver">👁</button>
                          <button className="action-btn" title="Editar">✏️</button>
                          <button className="action-btn danger" title="Eliminar">🗑</button>
                        </div>
                      </td>
                    </tr>

                    <tr>
                      <td>
                        <div className="user-info">
                          <div className="user-avatar">CR</div>
                          <div>
                            <div className="user-name">Carlos Rojas</div>
                            <div className="user-id">ID: USR-002</div>
                          </div>
                        </div>
                      </td>
                      <td>carlos.rojas@email.com</td>
                      <td><span className="role-badge role-vet">🩺 Veterinario</span></td>
                      <td><span className="status-badge status-active">● Activo</span></td>
                      <td>20/06/2026</td>
                      <td>Ayer, 5:12 p.m.</td>
                      <td>
                        <div className="action-group">
                          <button className="action-btn" title="Ver">👁</button>
                          <button className="action-btn" title="Editar">✏️</button>
                          <button className="action-btn danger" title="Eliminar">🗑</button>
                        </div>
                      </td>
                    </tr>

                    <tr>
                      <td>
                        <div className="user-info">
                          <div className="user-avatar">LP</div>
                          <div>
                            <div className="user-name">Laura Pérez</div>
                            <div className="user-id">ID: USR-003</div>
                          </div>
                        </div>
                      </td>
                      <td>laura.perez@email.com</td>
                      <td><span className="role-badge role-client">🐾 Cliente</span></td>
                      <td><span className="status-badge status-active">● Activo</span></td>
                      <td>18/06/2026</td>
                      <td>Hoy, 10:45 a.m.</td>
                      <td>
                        <div className="action-group">
                          <button className="action-btn" title="Ver">👁</button>
                          <button className="action-btn" title="Editar">✏️</button>
                          <button className="action-btn danger" title="Eliminar">🗑</button>
                        </div>
                      </td>
                    </tr>

                    <tr>
                      <td>
                        <div className="user-info">
                          <div className="user-avatar">JM</div>
                          <div>
                            <div className="user-name">José Méndez</div>
                            <div className="user-id">ID: USR-004</div>
                          </div>
                        </div>
                      </td>
                      <td>jose.mendez@email.com</td>
                      <td><span className="role-badge role-client">🐾 Cliente</span></td>
                      <td><span className="status-badge status-inactive">● Inactivo</span></td>
                      <td>10/06/2026</td>
                      <td>Hace 7 días</td>
                      <td>
                        <div className="action-group">
                          <button className="action-btn" title="Ver">👁</button>
                          <button className="action-btn" title="Editar">✏️</button>
                          <button className="action-btn danger" title="Eliminar">🗑</button>
                        </div>
                      </td>
                    </tr>

                    <tr>
                      <td>
                        <div className="user-info">
                          <div className="user-avatar">RS</div>
                          <div>
                            <div className="user-name">Ricardo Solís</div>
                            <div className="user-id">ID: USR-005</div>
                          </div>
                        </div>
                      </td>
                      <td>ricardo.solis@email.com</td>
                      <td><span className="role-badge role-client">🐾 Cliente</span></td>
                      <td><span className="status-badge status-blocked">● Bloqueado</span></td>
                      <td>01/06/2026</td>
                      <td>Sin acceso</td>
                      <td>
                        <div className="action-group">
                          <button className="action-btn" title="Ver">👁</button>
                          <button className="action-btn" title="Editar">✏️</button>
                          <button className="action-btn danger" title="Eliminar">🗑</button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="pagination-bar">
              <div>Mostrando 5 de 152 usuarios registrados</div>
              <div>
                <button className="btn-soft" style={{ padding: '.55rem .8rem' }}>Anterior</button>
                <button className="btn-main" style={{ padding: '.55rem .8rem' }}>Siguiente</button>
              </div>
            </div>
          </section>

        </main>
      </div>

      {/* MODAL */}
      <div className="modal fade" id="userModal" tabIndex="-1" aria-labelledby="userModalLabel" aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">

            <div className="modal-header">
              <div>
                <h5 className="modal-title" id="userModalLabel">Registrar nuevo usuario</h5>
                <div style={{ fontSize: '.78rem', color: 'rgba(255, 255, 255, .62)' }}>
                  Formulario visual para alta de usuarios administrativos.
                </div>
              </div>
              <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Cerrar"></button>
            </div>

            <div className="modal-body">
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Nombre</label>
                  <input type="text" className="form-control" placeholder="Nombre" />
                </div>

                <div className="col-md-6">
                  <label className="form-label">Apellido</label>
                  <input type="text" className="form-control" placeholder="Apellido" />
                </div>

                <div className="col-12">
                  <label className="form-label">Correo electrónico</label>
                  <input type="email" className="form-control" placeholder="correo@email.com" />
                </div>

                <div className="col-md-6">
                  <label className="form-label">Rol</label>
                  <select className="form-select">
                    <option>Cliente</option>
                    <option>Veterinario</option>
                    <option>Administrador</option>
                  </select>
                </div>

                <div className="col-md-6">
                  <label className="form-label">Estado</label>
                  <select className="form-select">
                    <option>Activo</option>
                    <option>Inactivo</option>
                    <option>Bloqueado</option>
                  </select>
                </div>

                <div className="col-12">
                  <label className="form-label">Observaciones</label>
                  <textarea className="form-control" rows="3" placeholder="Notas internas del usuario"></textarea>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn-soft" data-bs-dismiss="modal">Cancelar</button>
              <button type="button" className="btn-main">Guardar usuario</button>
            </div>

          </div>
        </div>
      </div>
    </>
  );
};
export default DashboardAdmin;