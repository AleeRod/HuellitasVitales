import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Home,
  Users,
  PawPrint,
  Stethoscope,
  Calendar,
  BarChart3,
  ShieldCheck,
  Settings,
  LogOut,
  Search,
  Bell,
  CheckCircle2,
  Eye,
  Pencil,
  Trash2,
  Plus,
  Tags,
  Package,
} from 'lucide-react';
import PanelServicios from '../../components/ComercioAdmin/PanelServicios/PanelServicios';
import PanelProductos from '../../components/ComercioAdmin/PanelProductos/PanelProductos';
import styles from './DashboardAdmin.module.css';

const DashboardAdmin = () => {
  const [seccionActiva, setSeccionActiva] = useState('usuarios');
  const [usuario, setUsuario] = useState(null);
  const navigate = useNavigate();

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

  const nombreUsuario = usuario?.nombre || usuario?.Nombre || usuario?.nombreCompleto || 'Administrador';
  const rolUsuario = usuario?.rol?.nombre || usuario?.rolNombre || usuario?.rol || (Number(usuario?.idRol) === 1 ? 'Administrador' : 'Admin');
  const inicialAvatar = nombreUsuario.charAt(0).toUpperCase();

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

  return (
    <>
      <div className={styles.adminShell}>
        {/* SIDEBAR */}
        <aside className={styles.sidebar}>
          <div className={styles.sidebarInner} style={{ overflowY: 'auto', paddingBottom: '30px' }}>
            <div className={styles.brandCard}>
              <img src="/Imagenes/logo.png" alt="Logo Huellitas Vitales" />
              <div>
                <div className={styles.brandName}>Huellitas Vitales</div>
                <div className={styles.brandBadge}>Clínica Veterinaria</div>
              </div>
            </div>

            <div className={styles.sidebarSection}>Panel global</div>
            <button
              className={`${styles.navLinkAdmin} ${seccionActiva === 'usuarios' ? styles.active : ''}`}
              onClick={() => setSeccionActiva('usuarios')}
            >
              <Home size={18} className={styles.navIcon} />
              Dashboard
            </button>
            <a href="#usuarios" className={styles.navLinkAdmin} onClick={(e) => { e.preventDefault(); setSeccionActiva('usuarios'); }}>
              <Users size={18} className={styles.navIcon} />
              Usuarios
            </a>
            <a href="#mascotas" className={styles.navLinkAdmin} onClick={(e) => e.preventDefault()}>
              <PawPrint size={18} className={styles.navIcon} />
              Mascotas
            </a>
            <a href="#veterinarios" className={styles.navLinkAdmin} onClick={(e) => e.preventDefault()}>
              <Stethoscope size={18} className={styles.navIcon} />
              Veterinarios
            </a>
            <a href="#citas" className={styles.navLinkAdmin} onClick={(e) => e.preventDefault()}>
              <Calendar size={18} className={styles.navIcon} />
              Citas
            </a>
            <a href="#reportes" className={styles.navLinkAdmin} onClick={(e) => e.preventDefault()}>
              <BarChart3 size={18} className={styles.navIcon} />
              Reportes
            </a>

            <div className={styles.sidebarSection}>Administración</div>

            <button
              className={`${styles.navLinkAdmin} ${seccionActiva === 'tiposServicio' ? styles.active : ''}`}
              onClick={() => setSeccionActiva('tiposServicio')}
            >
              <Tags size={18} className={styles.navIcon} />
              Servicios
            </button>

            <button
              className={`${styles.navLinkAdmin} ${seccionActiva === 'PanelProductos' ? styles.active : ''}`}
              onClick={() => setSeccionActiva('PanelProductos')}
            >
              <Package size={18} className={styles.navIcon} />
              Productos
            </button>

            <a href="#roles" className={styles.navLinkAdmin} onClick={(e) => e.preventDefault()}>
              <ShieldCheck size={18} className={styles.navIcon} />
              Roles y permisos
            </a>
            <a href="#configuracion" className={styles.navLinkAdmin} onClick={(e) => e.preventDefault()}>
              <Settings size={18} className="nav-icon" />
              Configuración
            </a>

            <button
              onClick={handleCerrarSesion}
              className={styles.navLinkAdmin}
              style={{ marginTop: '10px', color: '#ff4d4d' }}
            >
              <LogOut size={18} className={styles.navIcon} />
              Cerrar sesión
            </button>

            <div className={styles.sidebarFooter} style={{ marginTop: '20px' }}>
              <div className={styles.sidebarFooterTitle}>Sistema seguro</div>
              <div className={styles.sidebarFooterText}>
                Control de usuarios, roles y estados para proteger la información clínica.
              </div>
            </div>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className={styles.mainContent}>
          {/* TOPBAR */}
          <section className={styles.topbar}>
            <div>
              <div className={styles.heroBadge}>
                <svg width="9" height="9" viewBox="0 0 10 10">
                  <circle cx="5" cy="5" r="5" fill="#52B788" />
                </svg>
                Administración global
              </div>
              <h1 className={styles.heroTitle}>Panel de administración</h1>
              <p className={styles.heroSub}>
                Controla usuarios, permisos y estados dentro de Huellitas Vitales.
              </p>
            </div>

            <div className={styles.topActions}>
              <div className={styles.topSearch}>
                <Search size={16} />
                <input type="text" placeholder="Buscar en el sistema..." />
              </div>

              <button className={styles.iconButton} title="Notificaciones">
                <Bell size={18} />
              </button>

              <div className={styles.profileMini}>
                <div className={styles.profileAvatar}>{inicialAvatar}</div>
                <div>
                  <div className={styles.profileName}>{nombreUsuario}</div>
                  <div className={styles.profileRole}>{rolUsuario}</div>
                </div>
              </div>
            </div>
          </section>

          {seccionActiva === 'usuarios' && (
            <>
              {/* STATS */}
              <section className={styles.statGrid}>
                <article className={styles.statCard}>
                  <div className={styles.statTop}>
                    <div className={styles.statIcon}><Users size={20} /></div>
                    <div className={styles.statChip}>+12</div>
                  </div>
                  <div className={styles.statLabel}>Total de usuarios</div>
                  <div className={styles.statNumber}>152</div>
                  <div className={styles.statNote}>Usuarios registrados en la plataforma</div>
                </article>

                <article className={styles.statCard}>
                  <div className={styles.statTop}>
                    <div className={styles.statIcon}><CheckCircle2 size={20} /></div>
                    <div className={styles.statChip}>91%</div>
                  </div>
                  <div className={styles.statLabel}>Usuarios activos</div>
                  <div className={styles.statNumber}>139</div>
                  <div className={styles.statNote}>Cuentas habilitadas actualmente</div>
                </article>

                <article className={styles.statCard}>
                  <div className={styles.statTop}>
                    <div className={styles.statIcon}><Stethoscope size={20} /></div>
                    <div className={styles.statChip}>Equipo</div>
                  </div>
                  <div className={styles.statLabel}>Profesionales</div>
                  <div className={styles.statNumber}>18</div>
                  <div className={styles.statNote}>Personal médico registrado</div>
                </article>

                <article className={styles.statCard}>
                  <div className={styles.statTop}>
                    <div className={styles.statIcon}><ShieldCheck size={20} /></div>
                    <div className={styles.statChip}>Admin</div>
                  </div>
                  <div className={styles.statLabel}>Administradores</div>
                  <div className={styles.statNumber}>5</div>
                  <div className={styles.statNote}>Usuarios con permisos globales</div>
                </article>
              </section>

              {/* TABLE CARD */}
              <section className={styles.contentCard}>
                <div className={styles.cardTop}>
                  <div>
                    <h2 className={styles.cardTitle}>Gestión de usuarios</h2>
                    <p className={styles.cardSubtitle}>
                      Maquetación de tabla administrativa para consultar, filtrar, editar y controlar usuarios.
                    </p>
                  </div>

                  <button className={styles.btnMain} data-bs-toggle="modal" data-bs-target="#userModal">
                    <Plus size={16} /> Nuevo usuario
                  </button>
                </div>

                <div className={styles.toolbar}>
                  <div className={styles.searchField}>
                    <Search size={16} />
                    <input type="text" placeholder="Buscar por nombre, correo o ID..." />
                  </div>

                  <select className={styles.filterField} style={{ maxWidth: '190px' }}>
                    <option>Todos los roles</option>
                    <option>Admin</option>
                    <option>Profesional</option>
                    <option>Cliente</option>
                  </select>

                  <select className={styles.filterField} style={{ maxWidth: '190px' }}>
                    <option>Todos los estados</option>
                    <option>Activo</option>
                    <option>Inactivo</option>
                    <option>Bloqueado</option>
                  </select>

                  <button className={styles.btnSoft}>Exportar</button>
                </div>

                <div className={styles.tableWrap}>
                  <div className={styles.tableResponsive}>
                    <table className={`table ${styles.table} align-middle`}>
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
                            <div className={styles.userInfo}>
                              <div className={styles.userAvatar}>AM</div>
                              <div>
                                <div className={styles.userName}>Ana Mora</div>
                                <div className={styles.userId}>ID: USR-001</div>
                              </div>
                            </div>
                          </td>
                          <td>ana.mora@email.com</td>
                          <td><span className={`${styles.roleBadge} ${styles.roleAdmin}`}><ShieldCheck size={14} /> Admin</span></td>
                          <td><span className={`${styles.statusBadge} ${styles.statusActive}`}>● Activo</span></td>
                          <td>29/06/2026</td>
                          <td>Hoy, 8:30 a.m.</td>
                          <td>
                            <div className={styles.actionGroup}>
                              <button className={styles.actionBtn} title="Ver"><Eye size={16} /></button>
                              <button className={styles.actionBtn} title="Editar"><Pencil size={16} /></button>
                              <button className={`${styles.actionBtn} ${styles.danger}`} title="Eliminar"><Trash2 size={16} /></button>
                            </div>
                          </td>
                        </tr>

                        <tr>
                          <td>
                            <div className={styles.userInfo}>
                              <div className={styles.userAvatar}>CR</div>
                              <div>
                                <div className={styles.userName}>Carlos Rojas</div>
                                <div className={styles.userId}>ID: USR-002</div>
                              </div>
                            </div>
                          </td>
                          <td>carlos.rojas@email.com</td>
                          <td><span className={`${styles.roleBadge} ${styles.roleVet}`}><Stethoscope size={14} /> Profesional</span></td>
                          <td><span className={`${styles.statusBadge} ${styles.statusActive}`}>● Activo</span></td>
                          <td>20/06/2026</td>
                          <td>Ayer, 5:12 p.m.</td>
                          <td>
                            <div className={styles.actionGroup}>
                              <button className={styles.actionBtn} title="Ver"><Eye size={16} /></button>
                              <button className={styles.actionBtn} title="Editar"><Pencil size={16} /></button>
                              <button className={`${styles.actionBtn} ${styles.danger}`} title="Eliminar"><Trash2 size={16} /></button>
                            </div>
                          </td>
                        </tr>

                        <tr>
                          <td>
                            <div className={styles.userInfo}>
                              <div className={styles.userAvatar}>LP</div>
                              <div>
                                <div className={styles.userName}>Laura Pérez</div>
                                <div className={styles.userId}>ID: USR-003</div>
                              </div>
                            </div>
                          </td>
                          <td>laura.perez@email.com</td>
                          <td><span className={`${styles.roleBadge} ${styles.roleClient}`}><PawPrint size={14} /> Cliente</span></td>
                          <td><span className={`${styles.statusBadge} ${styles.statusActive}`}>● Activo</span></td>
                          <td>18/06/2026</td>
                          <td>Hoy, 10:45 a.m.</td>
                          <td>
                            <div className={styles.actionGroup}>
                              <button className={styles.actionBtn} title="Ver"><Eye size={16} /></button>
                              <button className={styles.actionBtn} title="Editar"><Pencil size={16} /></button>
                              <button className={`${styles.actionBtn} ${styles.danger}`} title="Eliminar"><Trash2 size={16} /></button>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className={styles.paginationBar}>
                  <div>Mostrando 3 de 152 usuarios registrados</div>
                  <div>
                    <button className={styles.btnSoft} style={{ padding: '.55rem .8rem' }}>Anterior</button>
                    <button className={styles.btnMain} style={{ padding: '.55rem .8rem' }}>Siguiente</button>
                  </div>
                </div>
              </section>
            </>
          )}

          {seccionActiva === 'tiposServicio' && (
            <div style={{ width: '100%' }}>
              <PanelServicios />
            </div>
          )}

          {/* AQUÍ ESTABA EL PROBLEMA: Faltaba esta condición para renderizar los productos */}
          {seccionActiva === 'PanelProductos' && (
            <div style={{ width: '100%' }}>
              <PanelProductos />
            </div>
          )}

        </main>
      </div>

      {/* MODAL */}
      <div className="modal fade" id="userModal" tabIndex="-1" aria-labelledby="userModalLabel" aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <div>
                <h5 className={styles.modalTitle} id="userModalLabel">Registrar nuevo usuario</h5>
                <div style={{ fontSize: '.78rem', color: 'rgba(255, 255, 255, .62)' }}>
                  Formulario visual para alta de usuarios administrativos.
                </div>
              </div>
              <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Cerrar"></button>
            </div>

            <div className={styles.modalBody}>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className={styles.formLabel}>Nombre</label>
                  <input type="text" className={styles.formControl} placeholder="Nombre" />
                </div>

                <div className="col-md-6">
                  <label className={styles.formLabel}>Apellido</label>
                  <input type="text" className={styles.formControl} placeholder="Apellido" />
                </div>

                <div className="col-12">
                  <label className={styles.formLabel}>Correo electrónico</label>
                  <input type="email" className={styles.formControl} placeholder="correo@email.com" />
                </div>

                <div className="col-md-6">
                  <label className={styles.formLabel}>Rol</label>
                  <select className={styles.formSelect}>
                    <option>Cliente</option>
                    <option>Profesional</option>
                    <option>Admin</option>
                  </select>
                </div>

                <div className="col-md-6">
                  <label className={styles.formLabel}>Estado</label>
                  <select className={styles.formSelect}>
                    <option>Activo</option>
                    <option>Inactivo</option>
                    <option>Bloqueado</option>
                  </select>
                </div>

                <div className="col-12">
                  <label className={styles.formLabel}>Observaciones</label>
                  <textarea className={styles.formControl} rows="3" placeholder="Notas internas del usuario"></textarea>
                </div>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button type="button" className={styles.btnSoft} data-bs-dismiss="modal">Cancelar</button>
              <button type="button" className={styles.btnMain}>Guardar usuario</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DashboardAdmin;