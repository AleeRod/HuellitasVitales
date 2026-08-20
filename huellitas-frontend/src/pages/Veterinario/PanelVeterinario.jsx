import React, { useEffect, useState } from 'react';
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
  Bell,
  AlertTriangle,
  Download,
} from 'lucide-react';
import PanelServicios from '../../components/ComercioAdmin/PanelServicios/PanelServicios';
// Ajusta esta ruta según donde coloques el componente y su .module.css:
import AgendaDiariaVeterinario from '../../components/Veterinario/AgendaDiariaVeterinario/AgendaDiariaVeterinario';
// Si el logo está en src/assets descomenta la siguiente línea y cambia el src del img:
// import logo from '../../assets/logo.png';

const PanelVeterinario = () => {
  const [vista, setVista] = useState('clinico'); // 'clinico' | 'servicios' | 'agenda'
  const [usuario, setUsuario] = useState(null);

  useEffect(() => {
    try {
      const guardado = localStorage.getItem('usuario_huellitas');
      if (guardado) setUsuario(JSON.parse(guardado));
    } catch (err) {
      console.error('No se pudo leer el usuario guardado', err);
    }
  }, []);

  // Fallbacks por si el campo viene con otro nombre desde el backend
  const nombreUsuario = usuario?.nombre || usuario?.Nombre || usuario?.nombreCompleto || 'Usuario';
  const rolUsuario = usuario?.rol?.nombre || usuario?.rolNombre || 'Veterinario';
  const inicialAvatar = nombreUsuario.charAt(0).toUpperCase();

  const irA = (destino) => (e) => {
    e.preventDefault();
    setVista(destino);
  };

  const tituloVista = {
    clinico: 'Panel clínico',
    servicios: 'Gestión de servicios',
    agenda: 'Agenda diaria',
  }[vista];

  const heroTituloVista = {
    clinico: 'Agenda diaria del veterinario',
    servicios: 'Servicios de la clínica',
    agenda: 'Agenda diaria del veterinario',
  }[vista];

  const heroSubVista = {
    clinico: 'Consulta citas del día, pacientes, expedientes y notas clínicas.',
    servicios: 'Administrá las consultas, groomings y procedimientos que ofrecés.',
    agenda: 'Navegá por semana, filtrá por estado y confirmá, completá o cancelá citas.',
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
          <a
            href="#"
            className={`${styles.navLinkVet} ${vista === 'clinico' ? styles.active : ''}`}
            onClick={irA('clinico')}
          >
            <span className={styles.navIcon}><Home size={17} /></span>
            Panel clínico
          </a>
          <a
            href="#"
            className={`${styles.navLinkVet} ${vista === 'agenda' ? styles.active : ''}`}
            onClick={irA('agenda')}
          >
            <span className={styles.navIcon}><CalendarDays size={17} /></span>
            Agenda diaria
          </a>
          <a href="#" className={styles.navLinkVet}>
            <span className={styles.navIcon}><PawPrint size={17} /></span>
            Pacientes
          </a>
          <a href="#" className={styles.navLinkVet}>
            <span className={styles.navIcon}><ClipboardList size={17} /></span>
            Expedientes
          </a>
          <a href="#" className={styles.navLinkVet}>
            <span className={styles.navIcon}><Syringe size={17} /></span>
            Vacunas
          </a>

          <div className={styles.navSection}>Gestión</div>
          <a
            href="#"
            className={`${styles.navLinkVet} ${vista === 'servicios' ? styles.active : ''}`}
            onClick={irA('servicios')}
          >
            <span className={styles.navIcon}><Receipt size={17} /></span>
            Servicios
          </a>
          <a href="#" className={styles.navLinkVet}>
            <span className={styles.navIcon}><BarChart3 size={17} /></span>
            Reportes
          </a>
          <a href="/LandingPage" className={styles.navLinkVet}>
            <span className={styles.navIcon}><LogOut size={17} /></span>
            Cerrar sesión
          </a>

          <div className={styles.sidebarNote}>
            <div className={styles.noteTitle}>Turno de hoy</div>
            <div className={styles.noteText}>
              8 citas agendadas, 2 controles urgentes y 1 vacunación pendiente.
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

        {vista === 'clinico' && (
          <>
            {/* STATS */}
            <section className={styles.statsGrid}>
              <article className={styles.statCard}>
                <div className={styles.statIcon}><CalendarDays size={20} /></div>
                <div className={styles.statLabel}>Citas de hoy</div>
                <div className={styles.statNumber}>8</div>
                <div className={styles.statNote}>Consultas y controles programados</div>
              </article>

              <article className={styles.statCard}>
                <div className={styles.statIcon}><PawPrint size={20} /></div>
                <div className={styles.statLabel}>Pacientes atendidos</div>
                <div className={styles.statNumber}>3</div>
                <div className={styles.statNote}>Consultas completadas durante el día</div>
              </article>

              <article className={styles.statCard}>
                <div className={styles.statIcon}><Syringe size={20} /></div>
                <div className={styles.statLabel}>Vacunas pendientes</div>
                <div className={styles.statNumber}>2</div>
                <div className={styles.statNote}>Aplicaciones programadas</div>
              </article>

              <article className={styles.statCard}>
                <div className={styles.statIcon}><AlertTriangle size={20} /></div>
                <div className={styles.statLabel}>Casos urgentes</div>
                <div className={styles.statNumber}>1</div>
                <div className={styles.statNote}>Requiere atención prioritaria</div>
              </article>
            </section>

            <section className={styles.panelGrid}>
              {/* AGENDA DIARIA (componente real, mismo que la vista dedicada) */}
              <AgendaDiariaVeterinario />

              {/* PACIENTES ACTIVOS */}
              <div className={styles.contentCard}>
                <div className={styles.cardHead}>
                  <div>
                    <h2 className={styles.cardTitle}>Pacientes en atención</h2>
                    <p className={styles.cardSubtitle}>Mascotas activas para consulta clínica.</p>
                  </div>
                  <button className={styles.btnSoft}>Ver todos</button>
                </div>

                <div className={styles.patientList}>
                  <div className={styles.patientCard}>
                    <div className={styles.patientInfo}>
                      <div className={styles.petIcon}><PawPrint size={20} /></div>
                      <div>
                        <div className={styles.patientTitle}>Luna</div>
                        <div className={styles.patientDetail}>Vacunación · Consultorio 1</div>
                      </div>
                    </div>
                    <span className={`${styles.statusBadge} ${styles.statusReady}`}>En consulta</span>
                  </div>

                  <div className={styles.patientCard}>
                    <div className={styles.patientInfo}>
                      <div className={styles.petIcon}><PawPrint size={20} /></div>
                      <div>
                        <div className={styles.patientTitle}>Rocky</div>
                        <div className={styles.patientDetail}>Control dental · Sala de espera</div>
                      </div>
                    </div>
                    <span className={`${styles.statusBadge} ${styles.statusNext}`}>En espera</span>
                  </div>

                  <div className={styles.patientCard}>
                    <div className={styles.patientInfo}>
                      <div className={styles.petIcon}><PawPrint size={20} /></div>
                      <div>
                        <div className={styles.patientTitle}>Toby</div>
                        <div className={styles.patientDetail}>Dolor abdominal · Prioridad alta</div>
                      </div>
                    </div>
                    <span className={`${styles.statusBadge} ${styles.statusUrgent}`}>Urgente</span>
                  </div>
                </div>
              </div>

              {/* FORMULARIO NOTA CLINICA */}
              <div className={styles.contentCard}>
                <div className={styles.cardHead}>
                  <div>
                    <h2 className={styles.cardTitle}>Nota clínica rápida</h2>
                    <p className={styles.cardSubtitle}>Maquetación para registrar observaciones de consulta.</p>
                  </div>
                </div>

                <div className={styles.formArea}>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className={styles.formLabel}>Paciente</label>
                      <select className={styles.formSelect}>
                        <option>Luna</option>
                        <option>Rocky</option>
                        <option>Toby</option>
                        <option>Max</option>
                      </select>
                    </div>

                    <div className="col-md-6">
                      <label className={styles.formLabel}>Tipo de consulta</label>
                      <select className={styles.formSelect}>
                        <option>Consulta general</option>
                        <option>Vacunación</option>
                        <option>Control dental</option>
                        <option>Urgencia</option>
                      </select>
                    </div>

                    <div className="col-md-6">
                      <label className={styles.formLabel}>Peso</label>
                      <input type="text" className={styles.formControl} placeholder="Ej: 12 kg" />
                    </div>

                    <div className="col-md-6">
                      <label className={styles.formLabel}>Temperatura</label>
                      <input type="text" className={styles.formControl} placeholder="Ej: 38.5 °C" />
                    </div>

                    <div className="col-12">
                      <label className={styles.formLabel}>Observaciones</label>
                      <textarea className={styles.formControl} rows="4" placeholder="Anotar síntomas, diagnóstico preliminar o recomendaciones..."></textarea>
                    </div>

                    <div className="col-12 d-flex justify-content-end gap-2">
                      <button className={styles.btnSoft}>Cancelar</button>
                      <button className={styles.btnMain}>Guardar nota</button>
                    </div>
                  </div>
                </div>
              </div>

              {/* HISTORIAL */}
              <div className={`${styles.contentCard} ${styles.tableArea}`}>
                <div className={styles.cardHead}>
                  <div>
                    <h2 className={styles.cardTitle}>Historial clínico reciente</h2>
                    <p className={styles.cardSubtitle}>Últimas atenciones realizadas por el veterinario.</p>
                  </div>
                  <button className={styles.btnSoft}>
                    <Download size={15} />
                    Descargar reporte
                  </button>
                </div>

                <div className={styles.tableWrap}>
                  <div className={styles.tableResponsive}>
                    <table className={styles.table}>
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
                          <td><span className={`${styles.statusBadge} ${styles.statusDone}`}>Finalizado</span></td>
                          <td><button className={styles.actionBtn}>Ver ficha</button></td>
                        </tr>

                        <tr>
                          <td>9:30 a.m.</td>
                          <td>Luna</td>
                          <td>Vacunación</td>
                          <td>Laura Pérez</td>
                          <td><span className={`${styles.statusBadge} ${styles.statusReady}`}>En consulta</span></td>
                          <td><button className={styles.actionBtn}>Abrir</button></td>
                        </tr>

                        <tr>
                          <td>11:00 a.m.</td>
                          <td>Rocky</td>
                          <td>Control dental</td>
                          <td>José Méndez</td>
                          <td><span className={`${styles.statusBadge} ${styles.statusNext}`}>En espera</span></td>
                          <td><button className={styles.actionBtn}>Abrir</button></td>
                        </tr>

                        <tr>
                          <td>1:30 p.m.</td>
                          <td>Toby</td>
                          <td>Urgencia</td>
                          <td>Ana Mora</td>
                          <td><span className={`${styles.statusBadge} ${styles.statusUrgent}`}>Urgente</span></td>
                          <td><button className={styles.actionBtn}>Atender</button></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
};

export default PanelVeterinario;