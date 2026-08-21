import { useEffect, useState, useCallback } from 'react';
import { Eye, X, Check, Ban, Building2, User, IdCard, Mail, Phone, MapPin, Calendar } from 'lucide-react';
import { API_BASE } from '../../../api/config.js';
import { ToastContainer } from '../../Toast/Toast';
import { useToast } from '../../Toast/useToast';
import styles from '../../../pages/Admin/DashboardAdmin.module.css';

function getAuthHeaders(conJson = false) {
  const token = localStorage.getItem('token_huellitas');
  return {
    ...(conJson ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

function formatFecha(fechaISO) {
  if (!fechaISO) return '-';
  const d = new Date(fechaISO);
  return d.toLocaleDateString('es-CR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// Antes esta vista era una tabla HTML plana con clases propias (sin relación con el sistema de
// diseño del resto del panel Admin) y usaba window.confirm/alert. La lógica de fondo
// (GET /api/Comercio/pendientes, PUT /api/Comercio/{id}/aprobar|rechazar) ya funcionaba —
// se mantiene igual, solo cambia la presentación y el feedback.
export default function PanelSolicitudesPendientes() {
  const { toasts, showToast, removeToast } = useToast();

  const [solicitudes, setSolicitudes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [procesandoId, setProcesandoId] = useState(null);
  const [detalle, setDetalle] = useState(null);
  const [confirmacion, setConfirmacion] = useState(null); // { solicitud, accion }

  const cargarSolicitudes = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/Comercio/pendientes`, { headers: getAuthHeaders() });

      if (res.status === 403) {
        throw new Error('No tienes permisos para ver esta información.');
      }
      if (!res.ok) throw new Error(`Error ${res.status} al cargar solicitudes`);

      const data = await res.json();
      setSolicitudes(data);
    } catch (err) {
      setError(err.message || 'No se pudieron cargar las solicitudes');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarSolicitudes();
  }, [cargarSolicitudes]);

  const pedirConfirmacion = (solicitud, accion) => setConfirmacion({ solicitud, accion });

  const confirmarResolucion = async () => {
    if (!confirmacion) return;
    const { solicitud, accion } = confirmacion;
    setConfirmacion(null);

    setProcesandoId(solicitud.idComercio);
    try {
      const res = await fetch(`${API_BASE}/Comercio/${solicitud.idComercio}/${accion}`, {
        method: 'PUT',
        headers: getAuthHeaders()
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.mensaje || `No se pudo ${accion} la solicitud (${res.status})`);
      }

      showToast(data?.mensaje || `Solicitud ${accion === 'aprobar' ? 'aprobada' : 'rechazada'} correctamente.`, 'success');
      setSolicitudes((prev) => prev.filter((s) => s.idComercio !== solicitud.idComercio));
      setDetalle(null);
    } catch (err) {
      showToast(err.message || `No se pudo ${accion} la solicitud`, 'error');
    } finally {
      setProcesandoId(null);
    }
  };

  return (
    <div style={{ width: '100%' }}>
      <section className={styles.contentCard}>
        <div className={styles.cardTop}>
          <div>
            <h2 className={styles.cardTitle}>Solicitudes de comercio pendientes</h2>
            <p className={styles.cardSubtitle}>Revisá y resolvé las solicitudes de afiliación de nuevas veterinarias y comercios.</p>
          </div>
        </div>

        <div className={styles.tableWrap}>
          {cargando ? (
            <p style={{ padding: '1.5rem', color: '#718096' }}>Cargando solicitudes…</p>
          ) : error ? (
            <div style={{ padding: '1.5rem' }}>
              <p style={{ color: '#dc3545', marginBottom: '.7rem' }}>{error}</p>
              <button className={styles.btnSoft} onClick={cargarSolicitudes}>Reintentar</button>
            </div>
          ) : solicitudes.length === 0 ? (
            <p style={{ padding: '1.5rem', color: '#718096' }}>No hay solicitudes pendientes.</p>
          ) : (
            <div className={styles.tableResponsive}>
              <table className={`table ${styles.table} align-middle`}>
                <thead>
                  <tr>
                    <th>Comercio</th>
                    <th>Tipo</th>
                    <th>Persona legal</th>
                    <th>Dirección</th>
                    <th>Teléfono</th>
                    <th>Fecha solicitud</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {solicitudes.map((s) => {
                    const enProceso = procesandoId === s.idComercio;
                    return (
                      <tr key={s.idComercio}>
                        <td>
                          <div className={styles.userInfo}>
                            <div className={styles.userAvatar}><Building2 size={16} /></div>
                            <div className={styles.userName}>{s.nombreComercial}</div>
                          </div>
                        </td>
                        <td>{s.tipoComercio}</td>
                        <td>{s.nombrePersonaLegal}</td>
                        <td>{s.direccion || '-'}</td>
                        <td>{s.telefono || '-'}</td>
                        <td>{formatFecha(s.fechaSolicitud)}</td>
                        <td>
                          <div className={styles.actionGroup}>
                            <button className={styles.actionBtn} title="Ver más" onClick={() => setDetalle(s)}>
                              <Eye size={16} />
                            </button>
                            <button
                              className={styles.actionBtn}
                              title="Aprobar"
                              disabled={enProceso}
                              onClick={() => pedirConfirmacion(s, 'aprobar')}
                            >
                              <Check size={16} />
                            </button>
                            <button
                              className={`${styles.actionBtn} ${styles.danger}`}
                              title="Rechazar"
                              disabled={enProceso}
                              onClick={() => pedirConfirmacion(s, 'rechazar')}
                            >
                              <Ban size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className={styles.paginationBar}>
          <div>Mostrando {solicitudes.length} solicitud{solicitudes.length === 1 ? '' : 'es'} pendiente{solicitudes.length === 1 ? '' : 's'}</div>
        </div>
      </section>

      {/* ─── MODAL "VER MÁS": detalle completo de la solicitud ─── */}
      {detalle && (
        <div className={styles.modalOverlay} onClick={() => setDetalle(null)}>
          <div className={styles.modalDialog} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalContent}>
              <div className={styles.modalHeader}>
                <h5 className={styles.modalTitle}>{detalle.nombreComercial}</h5>
                <button type="button" onClick={() => setDetalle(null)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>
              <div className={styles.modalBody}>
                <div className={styles.detalleSeccion}>
                  <h6 className={styles.detalleSeccionTitulo}>Datos del comercio</h6>
                  <div className={styles.detalleGrid}>
                    <div className={styles.detalleItem}>
                      <div className={styles.detalleIcono}><Building2 size={16} /></div>
                      <div className={styles.detalleTexto}>
                        <span className={styles.detalleLabel}>Tipo de comercio</span>
                        <span className={styles.detalleValor}>{detalle.tipoComercio}</span>
                      </div>
                    </div>
                    <div className={styles.detalleItem}>
                      <div className={styles.detalleIcono}><MapPin size={16} /></div>
                      <div className={styles.detalleTexto}>
                        <span className={styles.detalleLabel}>Dirección</span>
                        <span className={styles.detalleValor}>{detalle.direccion || 'No registrada'}</span>
                      </div>
                    </div>
                    <div className={styles.detalleItem}>
                      <div className={styles.detalleIcono}><Phone size={16} /></div>
                      <div className={styles.detalleTexto}>
                        <span className={styles.detalleLabel}>Teléfono del comercio</span>
                        <span className={styles.detalleValor}>{detalle.telefono || 'No registrado'}</span>
                      </div>
                    </div>
                    <div className={styles.detalleItem}>
                      <div className={styles.detalleIcono}><Calendar size={16} /></div>
                      <div className={styles.detalleTexto}>
                        <span className={styles.detalleLabel}>Fecha de solicitud</span>
                        <span className={styles.detalleValor}>{formatFecha(detalle.fechaSolicitud)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className={styles.detalleSeccion}>
                  <h6 className={styles.detalleSeccionTitulo}>Datos del solicitante</h6>
                  <div className={styles.detalleGrid}>
                    <div className={styles.detalleItem}>
                      <div className={styles.detalleIcono}><User size={16} /></div>
                      <div className={styles.detalleTexto}>
                        <span className={styles.detalleLabel}>Persona ({detalle.tipoPersona})</span>
                        <span className={styles.detalleValor}>{detalle.nombreSolicitante} {detalle.apellidosSolicitante}</span>
                      </div>
                    </div>
                    <div className={styles.detalleItem}>
                      <div className={styles.detalleIcono}><IdCard size={16} /></div>
                      <div className={styles.detalleTexto}>
                        <span className={styles.detalleLabel}>Identificación</span>
                        <span className={styles.detalleValor}>{detalle.identificacion || 'No registrada'}</span>
                      </div>
                    </div>
                    <div className={styles.detalleItem}>
                      <div className={styles.detalleIcono}><Mail size={16} /></div>
                      <div className={styles.detalleTexto}>
                        <span className={styles.detalleLabel}>Correo</span>
                        <span className={styles.detalleValor}>{detalle.correoSolicitante || 'No registrado'}</span>
                      </div>
                    </div>
                    <div className={styles.detalleItem}>
                      <div className={styles.detalleIcono}><Phone size={16} /></div>
                      <div className={styles.detalleTexto}>
                        <span className={styles.detalleLabel}>Teléfono del solicitante</span>
                        <span className={styles.detalleValor}>{detalle.telefonoSolicitante || 'No registrado'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className={styles.btnSoft} onClick={() => setDetalle(null)}>Cerrar</button>
                <button
                  type="button"
                  className={styles.btnDanger}
                  onClick={() => pedirConfirmacion(detalle, 'rechazar')}
                  disabled={procesandoId === detalle.idComercio}
                >
                  <Ban size={16} /> Rechazar
                </button>
                <button
                  type="button"
                  className={styles.btnMain}
                  onClick={() => pedirConfirmacion(detalle, 'aprobar')}
                  disabled={procesandoId === detalle.idComercio}
                >
                  <Check size={16} /> Aprobar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── CONFIRMAR APROBAR/RECHAZAR ─── */}
      {confirmacion && (
        <div className={styles.modalOverlay} onClick={() => setConfirmacion(null)}>
          <div className={styles.modalDialog} style={{ maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalContent}>
              <div className={styles.modalHeader}>
                <h5 className={styles.modalTitle}>{confirmacion.accion === 'aprobar' ? 'Aprobar solicitud' : 'Rechazar solicitud'}</h5>
              </div>
              <div className={styles.modalBody}>
                <p style={{ margin: 0 }}>
                  ¿Seguro que querés {confirmacion.accion === 'aprobar' ? 'aprobar' : 'rechazar'} la solicitud de{' '}
                  <strong>{confirmacion.solicitud.nombreComercial}</strong>?
                </p>
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className={styles.btnSoft} onClick={() => setConfirmacion(null)}>Cancelar</button>
                <button type="button" className={styles.btnMain} onClick={confirmarResolucion}>
                  Sí, {confirmacion.accion === 'aprobar' ? 'aprobar' : 'rechazar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
