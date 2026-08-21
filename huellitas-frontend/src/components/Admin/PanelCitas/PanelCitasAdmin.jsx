import React, { useCallback, useEffect, useState } from 'react';
import { Calendar, Eye, X, Ban, Stethoscope, Building2, PawPrint } from 'lucide-react';
import { API_BASE } from '../../../api/config';
import { ToastContainer } from '../../Toast/Toast';
import { useToast } from '../../Toast/useToast';
import CustomSelect from '../../CustomSelect/CustomSelect';
import styles from '../../../pages/Admin/DashboardAdmin.module.css';

const ESTADOS = { 1: 'Pendiente', 2: 'Confirmada', 3: 'Cancelada', 4: 'Completada' };
const ESTADO_BADGE = {
  1: styles.statusInactive,  // pendiente — amarillento/neutro
  2: styles.statusActive,    // confirmada
  3: styles.statusBlocked,   // cancelada
  4: styles.roleVet          // completada — verde distinto, reutiliza el tono de roleVet
};

const obtenerToken = () =>
  localStorage.getItem('token_huellitas') ||
  localStorage.getItem('token') ||
  localStorage.getItem('huellitas_token') ||
  localStorage.getItem('jwt') || '';

const authHeaders = (conJson = false) => ({
  Authorization: `Bearer ${obtenerToken()}`,
  ...(conJson ? { 'Content-Type': 'application/json' } : {})
});

const formatFecha = (fechaISO) => {
  if (!fechaISO) return '-';
  return new Date(fechaISO).toLocaleDateString('es-CR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const formatHora = (hora) => (hora ? hora.slice(0, 5) : '-');

// Antes, "Citas" en el sidebar del panel Admin era un enlace muerto. Esta es la vista de
// supervisión real: todas las citas de la plataforma vía GET /api/admin/citas, con la misma
// acción de cancelar que ya usa el propio veterinario (PUT /api/cita/{id}/cancelar, que ya
// acepta al Admin como autorizado). No incluye "confirmar"/"completar": esas son acciones
// clínicas del veterinario a cargo, no del admin.
const PanelCitasAdmin = () => {
  const { toasts, showToast, removeToast } = useToast();

  const [citas, setCitas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroDesde, setFiltroDesde] = useState('');
  const [filtroHasta, setFiltroHasta] = useState('');

  const [detalle, setDetalle] = useState(null);
  const [confirmacion, setConfirmacion] = useState(null); // cita a cancelar
  const [procesandoId, setProcesandoId] = useState(null);

  const cargarCitas = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filtroEstado) params.set('estado', filtroEstado);
      if (filtroDesde) params.set('desde', filtroDesde);
      if (filtroHasta) params.set('hasta', filtroHasta);

      const res = await fetch(`${API_BASE}/admin/citas?${params.toString()}`, { headers: authHeaders() });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.mensaje || 'No se pudieron cargar las citas.');

      setCitas(data.citas || []);
    } catch (err) {
      setError(err.message || 'No se pudieron cargar las citas.');
    } finally {
      setCargando(false);
    }
  }, [filtroEstado, filtroDesde, filtroHasta]);

  useEffect(() => { cargarCitas(); }, [cargarCitas]);

  const pedirConfirmacionCancelar = (cita) => setConfirmacion(cita);

  const confirmarCancelar = async () => {
    if (!confirmacion) return;
    const cita = confirmacion;
    setConfirmacion(null);

    setProcesandoId(cita.idCita);
    try {
      const res = await fetch(`${API_BASE}/cita/${cita.idCita}/cancelar`, {
        method: 'PUT',
        headers: authHeaders(true),
        body: JSON.stringify({ motivo: 'Cancelada por un administrador.' })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.mensaje || 'No se pudo cancelar la cita.');

      showToast(data?.mensaje || 'Cita cancelada correctamente.', 'success');
      await cargarCitas();
    } catch (err) {
      showToast(err.message || 'Error al cancelar la cita.', 'error');
    } finally {
      setProcesandoId(null);
    }
  };

  return (
    <div style={{ width: '100%' }}>
      <section className={styles.contentCard}>
        <div className={styles.cardTop}>
          <div>
            <h2 className={styles.cardTitle}>Citas de la plataforma</h2>
            <p className={styles.cardSubtitle}>Supervisión de todas las citas agendadas, en cualquier veterinaria.</p>
          </div>
        </div>

        <div className={styles.toolbar}>
          <CustomSelect
            style={{ maxWidth: '190px' }}
            value={filtroEstado}
            onChange={setFiltroEstado}
            opciones={[
              { value: '', label: 'Todos los estados' },
              { value: '1', label: 'Pendiente' },
              { value: '2', label: 'Confirmada' },
              { value: '3', label: 'Cancelada' },
              { value: '4', label: 'Completada' }
            ]}
          />

          <input
            type="date"
            className={styles.filterField}
            style={{ maxWidth: '170px' }}
            value={filtroDesde}
            onChange={(e) => setFiltroDesde(e.target.value)}
            title="Desde"
          />
          <input
            type="date"
            className={styles.filterField}
            style={{ maxWidth: '170px' }}
            value={filtroHasta}
            onChange={(e) => setFiltroHasta(e.target.value)}
            title="Hasta"
          />
        </div>

        <div className={styles.tableWrap}>
          {cargando ? (
            <p style={{ padding: '1.5rem', color: '#718096' }}>Cargando citas…</p>
          ) : error ? (
            <p style={{ padding: '1.5rem', color: '#dc3545' }}>{error}</p>
          ) : citas.length === 0 ? (
            <p style={{ padding: '1.5rem', color: '#718096' }}>No se encontraron citas con esos filtros.</p>
          ) : (
            <div className={styles.tableResponsive}>
              <table className={`table ${styles.table} align-middle`}>
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Mascota / Dueño</th>
                    <th>Veterinario</th>
                    <th>Veterinaria</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {citas.map((c) => (
                    <tr key={c.idCita}>
                      <td>{formatFecha(c.fecha)}<br /><span style={{ color: '#718096', fontSize: '.8rem' }}>{formatHora(c.horaInicio)} - {formatHora(c.horaFin)}</span></td>
                      <td>
                        <div className={styles.userInfo}>
                          <div className={styles.userAvatar}><PawPrint size={16} /></div>
                          <div>
                            <div className={styles.userName}>{c.nombreMascota}</div>
                            <div className={styles.userId}>{c.nombreDueno}</div>
                          </div>
                        </div>
                      </td>
                      <td>{c.nombreVeterinario}</td>
                      <td>{c.nombreComercio}</td>
                      <td><span className={`${styles.statusBadge} ${ESTADO_BADGE[c.idEstadoCita] || ''}`}>● {ESTADOS[c.idEstadoCita] || 'Desconocido'}</span></td>
                      <td>
                        <div className={styles.actionGroup}>
                          <button className={styles.actionBtn} title="Ver detalle" onClick={() => setDetalle(c)}>
                            <Eye size={16} />
                          </button>
                          {c.idEstadoCita !== 3 && c.idEstadoCita !== 4 && (
                            <button
                              className={`${styles.actionBtn} ${styles.danger}`}
                              title="Cancelar cita"
                              onClick={() => pedirConfirmacionCancelar(c)}
                              disabled={procesandoId === c.idCita}
                            >
                              <Ban size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className={styles.paginationBar}>
          <div>Mostrando {citas.length} cita{citas.length === 1 ? '' : 's'}</div>
        </div>
      </section>

      {detalle && (
        <div className={styles.modalOverlay} onClick={() => setDetalle(null)}>
          <div className={styles.modalDialog} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalContent}>
              <div className={styles.modalHeader}>
                <h5 className={styles.modalTitle}>Cita #{detalle.idCita}</h5>
                <button type="button" onClick={() => setDetalle(null)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>
              <div className={styles.modalBody}>
                <div className="row g-3">
                  <div className="col-12"><strong><Calendar size={14} /> Fecha:</strong> {formatFecha(detalle.fecha)}, {formatHora(detalle.horaInicio)} - {formatHora(detalle.horaFin)}</div>
                  <div className="col-12"><strong>Estado:</strong> <span className={`${styles.statusBadge} ${ESTADO_BADGE[detalle.idEstadoCita] || ''}`}>● {ESTADOS[detalle.idEstadoCita]}</span></div>
                  <div className="col-12"><strong>Mascota:</strong> {detalle.nombreMascota} (dueño: {detalle.nombreDueno})</div>
                  <div className="col-12"><strong><Stethoscope size={14} /> Veterinario:</strong> {detalle.nombreVeterinario}</div>
                  <div className="col-12"><strong><Building2 size={14} /> Veterinaria:</strong> {detalle.nombreComercio}</div>
                  <div className="col-12"><strong>Servicio:</strong> {detalle.nombreServicio}</div>
                  <div className="col-12"><strong>Notas:</strong> {detalle.notas || 'Sin notas registradas.'}</div>
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className={styles.btnSoft} onClick={() => setDetalle(null)}>Cerrar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {confirmacion && (
        <div className={styles.modalOverlay} onClick={() => setConfirmacion(null)}>
          <div className={styles.modalDialog} style={{ maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalContent}>
              <div className={styles.modalHeader}>
                <h5 className={styles.modalTitle}>Cancelar cita</h5>
              </div>
              <div className={styles.modalBody}>
                <p style={{ margin: 0 }}>
                  ¿Seguro que querés cancelar la cita de <strong>{confirmacion.nombreMascota}</strong> el {formatFecha(confirmacion.fecha)}?
                </p>
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className={styles.btnSoft} onClick={() => setConfirmacion(null)}>Volver</button>
                <button type="button" className={styles.btnMain} onClick={confirmarCancelar}>Sí, cancelar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

export default PanelCitasAdmin;
