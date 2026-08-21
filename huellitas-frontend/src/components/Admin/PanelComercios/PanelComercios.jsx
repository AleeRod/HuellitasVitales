import React, { useCallback, useEffect, useState } from 'react';
import {
  ClipboardCheck, Store, Search, Eye, Pencil, Trash2, X, Save,
  Building2, User, IdCard, Mail, Phone, MapPin, Calendar
} from 'lucide-react';
import { API_BASE } from '../../../api/config';
import { ToastContainer } from '../../Toast/Toast';
import { useToast } from '../../Toast/useToast';
import { useConfirm } from '../../ConfirmModal/useConfirm';
import CustomSelect from '../../CustomSelect/CustomSelect';
import PanelSolicitudesPendientes from '../PanelSolicitudes/PanelSolicitudesPendientes';
import dashStyles from '../../../pages/Admin/DashboardAdmin.module.css';
import styles from './PanelComercios.module.css';

const authHeaders = (conJson = false) => {
  const token = localStorage.getItem('token_huellitas');
  return {
    ...(conJson ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

const formatFecha = (fechaISO) => {
  if (!fechaISO) return '-';
  return new Date(fechaISO).toLocaleDateString('es-CR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const ESTADO_BADGE = { 1: dashStyles.statusInactive, 2: dashStyles.statusActive, 3: dashStyles.statusBlocked };

const TIPOS_COMERCIO = [
  { value: 1, label: 'Clínica Veterinaria' },
  { value: 2, label: 'Almacén / Tienda de Mascotas' }
];

const FORM_VACIO = { nombreComercial: '', idTipoComercio: 1, direccion: '', telefono: '' };

// Antes esta sección se llamaba "Solicitudes" y solo mostraba las pendientes. Ahora es
// "Comercios": conserva esa vista (PanelSolicitudesPendientes, sin tocar) y agrega una segunda
// pestaña con TODOS los comercios afiliados (cualquier estado), con edición y baja — el CRUD
// que le faltaba al Admin sobre los comercios ya aprobados.
const PanelComercios = () => {
  const [tab, setTab] = useState('solicitudes'); // 'solicitudes' | 'todos'

  return (
    <div style={{ width: '100%' }}>
      <div className={styles.tabs}>
        <button
          type="button"
          className={`${styles.tab} ${tab === 'solicitudes' ? styles.tabActivo : ''}`}
          onClick={() => setTab('solicitudes')}
        >
          <ClipboardCheck size={16} /> Solicitudes pendientes
        </button>
        <button
          type="button"
          className={`${styles.tab} ${tab === 'todos' ? styles.tabActivo : ''}`}
          onClick={() => setTab('todos')}
        >
          <Store size={16} /> Todos los comercios
        </button>
      </div>

      {tab === 'solicitudes' && <PanelSolicitudesPendientes />}
      {tab === 'todos' && <TodosLosComercios />}
    </div>
  );
};

const TodosLosComercios = () => {
  const { toasts, showToast, removeToast } = useToast();
  const { pedirConfirmacion, ConfirmacionModal } = useConfirm();

  const [comercios, setComercios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');

  const [detalle, setDetalle] = useState(null);
  const [edicion, setEdicion] = useState(null); // comercio en edición
  const [form, setForm] = useState(FORM_VACIO);
  const [guardando, setGuardando] = useState(false);
  const [errorForm, setErrorForm] = useState('');

  const cargarComercios = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filtroEstado) params.set('estado', filtroEstado);
      if (busqueda.trim()) params.set('busqueda', busqueda.trim());

      const res = await fetch(`${API_BASE}/Comercio?${params.toString()}`, { headers: authHeaders() });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.mensaje || 'No se pudieron cargar los comercios.');

      setComercios(data.comercios || []);
    } catch (err) {
      setError(err.message || 'No se pudieron cargar los comercios.');
    } finally {
      setCargando(false);
    }
  }, [filtroEstado, busqueda]);

  useEffect(() => {
    const timeout = setTimeout(cargarComercios, 300);
    return () => clearTimeout(timeout);
  }, [cargarComercios]);

  const abrirEdicion = (comercio) => {
    setEdicion(comercio);
    setForm({
      nombreComercial: comercio.nombreComercial,
      idTipoComercio: comercio.idTipoComercio,
      direccion: comercio.direccion || '',
      telefono: comercio.telefono || ''
    });
    setErrorForm('');
  };

  const cerrarEdicion = () => {
    if (guardando) return;
    setEdicion(null);
  };

  const guardarEdicion = async (e) => {
    e.preventDefault();
    if (!form.nombreComercial.trim()) {
      setErrorForm('El nombre comercial es obligatorio.');
      return;
    }

    setGuardando(true);
    setErrorForm('');
    try {
      const res = await fetch(`${API_BASE}/Comercio/${edicion.idComercio}`, {
        method: 'PUT',
        headers: authHeaders(true),
        body: JSON.stringify({
          nombreComercial: form.nombreComercial.trim(),
          idTipoComercio: Number(form.idTipoComercio),
          direccion: form.direccion.trim() || null,
          telefono: form.telefono.trim() || null
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.mensaje || 'No se pudo actualizar el comercio.');

      showToast(data?.mensaje || 'Comercio actualizado correctamente.', 'success');
      setEdicion(null);
      cargarComercios();
    } catch (err) {
      setErrorForm(err.message || 'Ocurrió un error al guardar los cambios.');
    } finally {
      setGuardando(false);
    }
  };

  const eliminarComercio = (comercio) => {
    pedirConfirmacion({
      titulo: 'Eliminar comercio',
      mensaje: `¿Eliminar "${comercio.nombreComercial}"? Ya no va a aparecer en el marketplace ni en las búsquedas.`,
      textoConfirmar: 'Sí, eliminar',
      onConfirmar: async () => {
        try {
          const res = await fetch(`${API_BASE}/Comercio/${comercio.idComercio}`, {
            method: 'DELETE',
            headers: authHeaders()
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error(data?.mensaje || 'No se pudo eliminar el comercio.');

          showToast(data?.mensaje || 'Comercio eliminado correctamente.', 'success');
          if (detalle?.idComercio === comercio.idComercio) setDetalle(null);
          cargarComercios();
        } catch (err) {
          showToast(err.message || 'No se pudo eliminar el comercio.', 'error');
        }
      }
    });
  };

  return (
    <>
      <section className={dashStyles.contentCard}>
        <div className={dashStyles.cardTop}>
          <div>
            <h2 className={dashStyles.cardTitle}>Comercios afiliados</h2>
            <p className={dashStyles.cardSubtitle}>Todas las veterinarias y almacenes de la plataforma, en cualquier estado.</p>
          </div>
        </div>

        <div className={dashStyles.toolbar}>
          <div className={dashStyles.searchField}>
            <Search size={16} />
            <input
              type="text"
              placeholder="Buscar por comercio, persona legal o correo..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>

          <CustomSelect
            style={{ maxWidth: 190 }}
            value={filtroEstado}
            onChange={setFiltroEstado}
            opciones={[
              { value: '', label: 'Todos los estados' },
              { value: '1', label: 'Pendiente' },
              { value: '2', label: 'Aprobado' },
              { value: '3', label: 'Rechazado' }
            ]}
          />
        </div>

        <div className={dashStyles.tableWrap}>
          {cargando ? (
            <p style={{ padding: '1.5rem', color: '#718096' }}>Cargando comercios…</p>
          ) : error ? (
            <div style={{ padding: '1.5rem' }}>
              <p style={{ color: '#dc3545', marginBottom: '.7rem' }}>{error}</p>
              <button className={dashStyles.btnSoft} onClick={cargarComercios}>Reintentar</button>
            </div>
          ) : comercios.length === 0 ? (
            <p style={{ padding: '1.5rem', color: '#718096' }}>No se encontraron comercios con esos filtros.</p>
          ) : (
            <div className={dashStyles.tableResponsive}>
              <table className={`table ${dashStyles.table} align-middle`}>
                <thead>
                  <tr>
                    <th>Comercio</th>
                    <th>Tipo</th>
                    <th>Persona legal</th>
                    <th>Estado</th>
                    <th>Fecha solicitud</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {comercios.map((c) => (
                    <tr key={c.idComercio}>
                      <td>
                        <div className={dashStyles.userInfo}>
                          <div className={dashStyles.userAvatar}><Building2 size={16} /></div>
                          <div className={dashStyles.userName}>{c.nombreComercial}</div>
                        </div>
                      </td>
                      <td>{c.tipoComercio}</td>
                      <td>{c.nombrePersonaLegal}</td>
                      <td>
                        <span className={`${dashStyles.statusBadge} ${ESTADO_BADGE[c.idEstadoSolicitud] || ''}`}>
                          ● {c.estadoSolicitud}
                        </span>
                      </td>
                      <td>{formatFecha(c.fechaSolicitud)}</td>
                      <td>
                        <div className={dashStyles.actionGroup}>
                          <button className={dashStyles.actionBtn} title="Ver detalle" onClick={() => setDetalle(c)}>
                            <Eye size={16} />
                          </button>
                          <button className={dashStyles.actionBtn} title="Editar" onClick={() => abrirEdicion(c)}>
                            <Pencil size={16} />
                          </button>
                          {c.idEstadoSolicitud !== 3 && (
                            <button
                              className={`${dashStyles.actionBtn} ${dashStyles.danger}`}
                              title="Eliminar"
                              onClick={() => eliminarComercio(c)}
                            >
                              <Trash2 size={16} />
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

        <div className={dashStyles.paginationBar}>
          <div>Mostrando {comercios.length} comercio{comercios.length === 1 ? '' : 's'}</div>
        </div>
      </section>

      {/* ─── MODAL "VER DETALLE" ─── */}
      {detalle && (
        <div className={dashStyles.modalOverlay} onClick={() => setDetalle(null)}>
          <div className={dashStyles.modalDialog} onClick={(e) => e.stopPropagation()}>
            <div className={dashStyles.modalContent}>
              <div className={dashStyles.modalHeader}>
                <h5 className={dashStyles.modalTitle}>{detalle.nombreComercial}</h5>
                <button type="button" onClick={() => setDetalle(null)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>
              <div className={dashStyles.modalBody}>
                <div className={dashStyles.detalleSeccion}>
                  <h6 className={dashStyles.detalleSeccionTitulo}>Datos del comercio</h6>
                  <div className={dashStyles.detalleGrid}>
                    <div className={dashStyles.detalleItem}>
                      <div className={dashStyles.detalleIcono}><Building2 size={16} /></div>
                      <div className={dashStyles.detalleTexto}>
                        <span className={dashStyles.detalleLabel}>Tipo de comercio</span>
                        <span className={dashStyles.detalleValor}>{detalle.tipoComercio}</span>
                      </div>
                    </div>
                    <div className={dashStyles.detalleItem}>
                      <div className={dashStyles.detalleIcono}><MapPin size={16} /></div>
                      <div className={dashStyles.detalleTexto}>
                        <span className={dashStyles.detalleLabel}>Dirección</span>
                        <span className={dashStyles.detalleValor}>{detalle.direccion || 'No registrada'}</span>
                      </div>
                    </div>
                    <div className={dashStyles.detalleItem}>
                      <div className={dashStyles.detalleIcono}><Phone size={16} /></div>
                      <div className={dashStyles.detalleTexto}>
                        <span className={dashStyles.detalleLabel}>Teléfono del comercio</span>
                        <span className={dashStyles.detalleValor}>{detalle.telefono || 'No registrado'}</span>
                      </div>
                    </div>
                    <div className={dashStyles.detalleItem}>
                      <div className={dashStyles.detalleIcono}><Calendar size={16} /></div>
                      <div className={dashStyles.detalleTexto}>
                        <span className={dashStyles.detalleLabel}>Fecha de solicitud</span>
                        <span className={dashStyles.detalleValor}>{formatFecha(detalle.fechaSolicitud)}</span>
                      </div>
                    </div>
                    <div className={dashStyles.detalleItem}>
                      <div className={dashStyles.detalleIcono}><Calendar size={16} /></div>
                      <div className={dashStyles.detalleTexto}>
                        <span className={dashStyles.detalleLabel}>Estado</span>
                        <span className={`${dashStyles.statusBadge} ${ESTADO_BADGE[detalle.idEstadoSolicitud] || ''}`}>
                          ● {detalle.estadoSolicitud}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className={dashStyles.detalleSeccion}>
                  <h6 className={dashStyles.detalleSeccionTitulo}>Datos del solicitante</h6>
                  <div className={dashStyles.detalleGrid}>
                    <div className={dashStyles.detalleItem}>
                      <div className={dashStyles.detalleIcono}><User size={16} /></div>
                      <div className={dashStyles.detalleTexto}>
                        <span className={dashStyles.detalleLabel}>Persona ({detalle.tipoPersona})</span>
                        <span className={dashStyles.detalleValor}>{detalle.nombrePersonaLegal}</span>
                      </div>
                    </div>
                    <div className={dashStyles.detalleItem}>
                      <div className={dashStyles.detalleIcono}><IdCard size={16} /></div>
                      <div className={dashStyles.detalleTexto}>
                        <span className={dashStyles.detalleLabel}>Identificación</span>
                        <span className={dashStyles.detalleValor}>{detalle.identificacion || 'No registrada'}</span>
                      </div>
                    </div>
                    <div className={dashStyles.detalleItem}>
                      <div className={dashStyles.detalleIcono}><Mail size={16} /></div>
                      <div className={dashStyles.detalleTexto}>
                        <span className={dashStyles.detalleLabel}>Correo</span>
                        <span className={dashStyles.detalleValor}>{detalle.correoSolicitante || 'No registrado'}</span>
                      </div>
                    </div>
                    <div className={dashStyles.detalleItem}>
                      <div className={dashStyles.detalleIcono}><Phone size={16} /></div>
                      <div className={dashStyles.detalleTexto}>
                        <span className={dashStyles.detalleLabel}>Teléfono del solicitante</span>
                        <span className={dashStyles.detalleValor}>{detalle.telefonoSolicitante || 'No registrado'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className={dashStyles.modalFooter}>
                <button type="button" className={dashStyles.btnSoft} onClick={() => setDetalle(null)}>Cerrar</button>
                <button type="button" className={dashStyles.btnMain} onClick={() => { setDetalle(null); abrirEdicion(detalle); }}>
                  <Pencil size={16} /> Editar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL "EDITAR" ─── */}
      {edicion && (
        <div className={dashStyles.modalOverlay} onClick={cerrarEdicion}>
          <div className={dashStyles.modalDialog} onClick={(e) => e.stopPropagation()}>
            <form className={dashStyles.modalContent} onSubmit={guardarEdicion}>
              <div className={dashStyles.modalHeader}>
                <h5 className={dashStyles.modalTitle}>Editar comercio</h5>
                <button type="button" onClick={cerrarEdicion} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }} disabled={guardando}>
                  <X size={20} />
                </button>
              </div>
              <div className={dashStyles.modalBody}>
                <div className="row g-3">
                  <div className="col-12">
                    <label className={dashStyles.formLabel}>Nombre comercial</label>
                    <input
                      className={dashStyles.formControl}
                      value={form.nombreComercial}
                      onChange={(e) => setForm({ ...form, nombreComercial: e.target.value })}
                    />
                  </div>
                  <div className="col-12">
                    <label className={dashStyles.formLabel}>Tipo de comercio</label>
                    <CustomSelect
                      value={form.idTipoComercio}
                      onChange={(valor) => setForm({ ...form, idTipoComercio: Number(valor) })}
                      style={{ width: '100%' }}
                      opciones={TIPOS_COMERCIO}
                    />
                  </div>
                  <div className="col-12">
                    <label className={dashStyles.formLabel}>Dirección</label>
                    <input
                      className={dashStyles.formControl}
                      value={form.direccion}
                      onChange={(e) => setForm({ ...form, direccion: e.target.value })}
                      placeholder="Opcional"
                    />
                  </div>
                  <div className="col-12">
                    <label className={dashStyles.formLabel}>Teléfono</label>
                    <input
                      className={dashStyles.formControl}
                      value={form.telefono}
                      onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                      placeholder="Opcional"
                    />
                  </div>
                </div>

                {errorForm && <p style={{ color: '#dc3545', fontSize: '.85rem', marginTop: '.9rem', marginBottom: 0 }}>{errorForm}</p>}
              </div>
              <div className={dashStyles.modalFooter}>
                <button type="button" className={dashStyles.btnSoft} onClick={cerrarEdicion} disabled={guardando}>Cancelar</button>
                <button type="submit" className={dashStyles.btnMain} disabled={guardando}>
                  <Save size={16} /> {guardando ? 'Guardando…' : 'Guardar cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {ConfirmacionModal}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </>
  );
};

export default PanelComercios;
