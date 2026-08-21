import React, { useCallback, useEffect, useState } from 'react';
import { PawPrint, Search, Eye, X, Mail, Calendar, Dog, Cat, Plus, Save, CheckCircle2, Trash2 } from 'lucide-react';
import { API_BASE } from '../../../api/config';
import { ToastContainer } from '../../Toast/Toast';
import { useToast } from '../../Toast/useToast';
import { useConfirm } from '../../ConfirmModal/useConfirm';
import CustomSelect from '../../CustomSelect/CustomSelect';
import styles from '../../../pages/Admin/DashboardAdmin.module.css';

const obtenerToken = () =>
  localStorage.getItem('token_huellitas') ||
  localStorage.getItem('token') ||
  localStorage.getItem('huellitas_token') ||
  localStorage.getItem('jwt') || '';

const authHeaders = (conJson = false) => ({
  Authorization: `Bearer ${obtenerToken()}`,
  ...(conJson ? { 'Content-Type': 'application/json' } : {})
});

const FORM_MASCOTA_VACIO = { nombre: '', idEspecie: 1, raza: '', fechaNacimiento: '', activo: true };

const formatFecha = (fechaISO) => {
  if (!fechaISO) return 'No registrada';
  return new Date(fechaISO).toLocaleDateString('es-CR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const iconoEspecie = (especie) => {
  const valor = (especie || '').toLowerCase();
  if (valor.includes('gato')) return Cat;
  if (valor.includes('perro')) return Dog;
  return PawPrint;
};

// Antes, "Mascotas" en el sidebar del panel Admin era un enlace muerto
// (onClick={(e) => e.preventDefault()}). Esta es la primera vista real: todas las mascotas de
// la plataforma + su dueño, vía GET /api/admin/mascotas.
const PanelMascotasAdmin = () => {
  const { toasts, showToast, removeToast } = useToast();
  const { pedirConfirmacion, ConfirmacionModal } = useConfirm();

  const [mascotas, setMascotas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [detalle, setDetalle] = useState(null);

  // ─── Modal "Agregar mascota" (a nombre de cualquier usuario) ───
  const [modalAbierto, setModalAbierto] = useState(false);
  const [busquedaDueno, setBusquedaDueno] = useState('');
  const [duenosEncontrados, setDuenosEncontrados] = useState([]);
  const [buscandoDuenos, setBuscandoDuenos] = useState(false);
  const [duenoSeleccionado, setDuenoSeleccionado] = useState(null);
  const [formMascota, setFormMascota] = useState(FORM_MASCOTA_VACIO);
  const [errorMascota, setErrorMascota] = useState('');
  const [guardandoMascota, setGuardandoMascota] = useState(false);

  const cargarMascotas = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (busqueda.trim()) params.set('busqueda', busqueda.trim());

      const res = await fetch(`${API_BASE}/admin/mascotas?${params.toString()}`, { headers: authHeaders() });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.mensaje || 'No se pudieron cargar las mascotas.');

      setMascotas(data.mascotas || []);
    } catch (err) {
      setError(err.message || 'No se pudieron cargar las mascotas.');
    } finally {
      setCargando(false);
    }
  }, [busqueda]);

  useEffect(() => {
    const timeout = setTimeout(cargarMascotas, 300);
    return () => clearTimeout(timeout);
  }, [cargarMascotas]);

  // ─── Buscar dueño (cualquier usuario de la plataforma) al agregar una mascota ───
  useEffect(() => {
    if (duenoSeleccionado || !busquedaDueno.trim()) {
      setDuenosEncontrados([]);
      return undefined;
    }

    const timeout = setTimeout(async () => {
      setBuscandoDuenos(true);
      try {
        const params = new URLSearchParams({ busqueda: busquedaDueno.trim() });
        const res = await fetch(`${API_BASE}/usuario?${params.toString()}`, { headers: authHeaders() });
        const data = await res.json().catch(() => ({}));
        setDuenosEncontrados(res.ok ? (data.usuarios || []) : []);
      } catch (err) {
        console.error('Error al buscar usuarios:', err);
        setDuenosEncontrados([]);
      } finally {
        setBuscandoDuenos(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [busquedaDueno, duenoSeleccionado]);

  const abrirModalMascota = () => {
    setBusquedaDueno('');
    setDuenosEncontrados([]);
    setDuenoSeleccionado(null);
    setFormMascota(FORM_MASCOTA_VACIO);
    setErrorMascota('');
    setModalAbierto(true);
  };

  const cerrarModalMascota = () => {
    if (guardandoMascota) return;
    setModalAbierto(false);
  };

  const guardarMascota = async (e) => {
    e.preventDefault();

    if (!duenoSeleccionado) {
      setErrorMascota('Elegí a qué usuario le pertenece la mascota.');
      return;
    }
    if (!formMascota.nombre.trim()) {
      setErrorMascota('El nombre de la mascota es obligatorio.');
      return;
    }

    setGuardandoMascota(true);
    setErrorMascota('');
    try {
      const res = await fetch(`${API_BASE}/admin/mascotas`, {
        method: 'POST',
        headers: authHeaders(true),
        body: JSON.stringify({
          idUsuario: duenoSeleccionado.idUsuario,
          nombre: formMascota.nombre.trim(),
          idEspecie: Number(formMascota.idEspecie),
          raza: formMascota.raza?.trim() || null,
          fechaNacimiento: formMascota.fechaNacimiento || null,
          activo: formMascota.activo
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.mensaje || 'No se pudo registrar la mascota.');

      showToast(data?.mensaje || 'Mascota registrada correctamente.', 'success');
      setModalAbierto(false);
      cargarMascotas();
    } catch (err) {
      setErrorMascota(err.message || 'Ocurrió un error al registrar la mascota.');
    } finally {
      setGuardandoMascota(false);
    }
  };

  const eliminarMascota = (mascota) => {
    pedirConfirmacion({
      titulo: 'Eliminar mascota',
      mensaje: `¿Eliminar a ${mascota.nombre} (dueño: ${mascota.nombreDueno})? Ya no va a aparecer como mascota activa.`,
      textoConfirmar: 'Sí, eliminar',
      onConfirmar: async () => {
        try {
          const res = await fetch(`${API_BASE}/admin/mascotas/${mascota.idMascota}`, {
            method: 'DELETE',
            headers: authHeaders()
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error(data?.mensaje || 'No se pudo eliminar la mascota.');

          showToast(data?.mensaje || 'Mascota eliminada correctamente.', 'success');
          if (detalle?.idMascota === mascota.idMascota) setDetalle(null);
          cargarMascotas();
        } catch (err) {
          showToast(err.message || 'No se pudo eliminar la mascota.', 'error');
        }
      }
    });
  };

  return (
    <div style={{ width: '100%' }}>
      <section className={styles.contentCard}>
        <div className={styles.cardTop}>
          <div>
            <h2 className={styles.cardTitle}>Mascotas de la plataforma</h2>
            <p className={styles.cardSubtitle}>Todas las mascotas registradas, con su dueño.</p>
          </div>

          <button className={styles.btnMain} onClick={abrirModalMascota}>
            <Plus size={16} /> Agregar mascota
          </button>
        </div>

        <div className={styles.toolbar}>
          <div className={styles.searchField}>
            <Search size={16} />
            <input
              type="text"
              placeholder="Buscar por nombre de mascota o dueño..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
        </div>

        <div className={styles.tableWrap}>
          {cargando ? (
            <p style={{ padding: '1.5rem', color: '#718096' }}>Cargando mascotas…</p>
          ) : error ? (
            <p style={{ padding: '1.5rem', color: '#dc3545' }}>{error}</p>
          ) : mascotas.length === 0 ? (
            <p style={{ padding: '1.5rem', color: '#718096' }}>No se encontraron mascotas con esa búsqueda.</p>
          ) : (
            <div className={styles.tableResponsive}>
              <table className={`table ${styles.table} align-middle`}>
                <thead>
                  <tr>
                    <th>Mascota</th>
                    <th>Especie</th>
                    <th>Raza</th>
                    <th>Dueño</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {mascotas.map((m) => {
                    const Icono = iconoEspecie(m.especie);
                    return (
                      <tr key={m.idMascota}>
                        <td>
                          <div className={styles.userInfo}>
                            <div className={styles.userAvatar}><Icono size={16} /></div>
                            <div className={styles.userName}>{m.nombre}</div>
                          </div>
                        </td>
                        <td>{m.especie}</td>
                        <td>{m.raza || 'Sin registrar'}</td>
                        <td>{m.nombreDueno}</td>
                        <td>
                          <span className={`${styles.statusBadge} ${m.activo ? styles.statusActive : styles.statusInactive}`}>
                            ● {m.activo ? 'Activa' : 'Inactiva'}
                          </span>
                        </td>
                        <td>
                          <div className={styles.actionGroup}>
                            <button className={styles.actionBtn} title="Ver detalle" onClick={() => setDetalle(m)}>
                              <Eye size={16} />
                            </button>
                            {m.activo && (
                              <button
                                className={`${styles.actionBtn} ${styles.danger}`}
                                title="Eliminar mascota"
                                onClick={() => eliminarMascota(m)}
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
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
          <div>Mostrando {mascotas.length} mascota{mascotas.length === 1 ? '' : 's'}</div>
        </div>
      </section>

      {detalle && (
        <div className={styles.modalOverlay} onClick={() => setDetalle(null)}>
          <div className={styles.modalDialog} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalContent}>
              <div className={styles.modalHeader}>
                <h5 className={styles.modalTitle}>{detalle.nombre}</h5>
                <button type="button" onClick={() => setDetalle(null)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>
              <div className={styles.modalBody}>
                <div className="row g-3">
                  <div className="col-12"><strong>Especie:</strong> {detalle.especie}</div>
                  <div className="col-12"><strong>Raza:</strong> {detalle.raza || 'Sin registrar'}</div>
                  <div className="col-12"><strong><Calendar size={14} /> Fecha de nacimiento:</strong> {formatFecha(detalle.fechaNacimiento)}</div>
                  <div className="col-12"><strong>Estado:</strong> <span className={`${styles.statusBadge} ${detalle.activo ? styles.statusActive : styles.statusInactive}`}>● {detalle.activo ? 'Activa' : 'Inactiva'}</span></div>
                  <div className="col-12"><strong>Dueño:</strong> {detalle.nombreDueno}</div>
                  <div className="col-12"><strong><Mail size={14} /> Correo del dueño:</strong> {detalle.correoDueno}</div>
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className={styles.btnSoft} onClick={() => setDetalle(null)}>Cerrar</button>
                {detalle.activo && (
                  <button type="button" className={styles.btnDanger} onClick={() => eliminarMascota(detalle)}>
                    <Trash2 size={16} /> Eliminar mascota
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {modalAbierto && (
        <div className={styles.modalOverlay} onClick={cerrarModalMascota}>
          <div className={styles.modalDialog} onClick={(e) => e.stopPropagation()}>
            <form className={styles.modalContent} onSubmit={guardarMascota}>
              <div className={styles.modalHeader}>
                <h5 className={styles.modalTitle}>Agregar mascota</h5>
                <button
                  type="button"
                  onClick={cerrarModalMascota}
                  style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}
                  disabled={guardandoMascota}
                >
                  <X size={20} />
                </button>
              </div>

              <div className={styles.modalBody}>
                <p style={{ marginTop: 0, color: '#718096', fontSize: '.88rem' }}>
                  Elegí a qué usuario le pertenece la mascota. Podés buscarlo por nombre o correo.
                </p>

                {!duenoSeleccionado ? (
                  <>
                    <div className={styles.searchField} style={{ maxWidth: 'none', marginBottom: '.75rem' }}>
                      <Search size={16} />
                      <input
                        type="text"
                        placeholder="Buscar usuario por nombre o correo..."
                        value={busquedaDueno}
                        onChange={(e) => setBusquedaDueno(e.target.value)}
                      />
                    </div>

                    {buscandoDuenos && <p style={{ color: '#718096', fontSize: '.85rem' }}>Buscando…</p>}

                    {!buscandoDuenos && busquedaDueno.trim() && duenosEncontrados.length === 0 && (
                      <p style={{ color: '#718096', fontSize: '.85rem' }}>No encontramos usuarios con esa búsqueda.</p>
                    )}

                    {duenosEncontrados.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem', maxHeight: 220, overflowY: 'auto' }}>
                        {duenosEncontrados.map((u) => (
                          <button
                            type="button"
                            key={u.idUsuario}
                            onClick={() => setDuenoSeleccionado(u)}
                            style={{
                              display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                              gap: 2, padding: '.6rem .8rem', borderRadius: 12,
                              border: '1.5px solid #dde3d8', background: '#fff', cursor: 'pointer', textAlign: 'left'
                            }}
                          >
                            <strong style={{ color: '#1B4332', fontSize: '.9rem' }}>{u.nombre} {u.apellidos}</strong>
                            <span style={{ color: '#718096', fontSize: '.8rem' }}>{u.correo}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '.6rem',
                      padding: '.7rem .9rem', borderRadius: 12, background: 'rgba(82,183,136,.1)',
                      border: '1px solid rgba(82,183,136,.3)', marginBottom: '1rem'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
                        <CheckCircle2 size={18} color="#2e7d32" />
                        <div>
                          <div style={{ fontWeight: 700, color: '#1B4332', fontSize: '.88rem' }}>
                            {duenoSeleccionado.nombre} {duenoSeleccionado.apellidos}
                          </div>
                          <div style={{ color: '#718096', fontSize: '.78rem' }}>{duenoSeleccionado.correo}</div>
                        </div>
                      </div>
                      <button
                        type="button"
                        className={styles.btnSoft}
                        style={{ padding: '.4rem .8rem' }}
                        onClick={() => { setDuenoSeleccionado(null); setBusquedaDueno(''); }}
                      >
                        Cambiar
                      </button>
                    </div>

                    <div className="row g-3">
                      <div className="col-12">
                        <label className={styles.formLabel}>Nombre de la mascota</label>
                        <input
                          className={styles.formControl}
                          value={formMascota.nombre}
                          onChange={(e) => setFormMascota({ ...formMascota, nombre: e.target.value })}
                          placeholder="Ej. Luna"
                        />
                      </div>
                      <div className="col-md-6">
                        <label className={styles.formLabel}>Especie</label>
                        <CustomSelect
                          value={formMascota.idEspecie}
                          onChange={(valor) => setFormMascota({ ...formMascota, idEspecie: Number(valor) })}
                          style={{ width: '100%' }}
                          opciones={[
                            { value: 1, label: 'Perro' },
                            { value: 2, label: 'Gato' },
                            { value: 3, label: 'Otra' }
                          ]}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className={styles.formLabel}>Raza (opcional)</label>
                        <input
                          className={styles.formControl}
                          value={formMascota.raza}
                          onChange={(e) => setFormMascota({ ...formMascota, raza: e.target.value })}
                        />
                      </div>
                      <div className="col-12">
                        <label className={styles.formLabel}>Fecha de nacimiento (opcional)</label>
                        <input
                          type="date"
                          className={styles.formControl}
                          value={formMascota.fechaNacimiento}
                          onChange={(e) => setFormMascota({ ...formMascota, fechaNacimiento: e.target.value })}
                        />
                      </div>
                    </div>
                  </>
                )}

                {errorMascota && <div style={{ color: '#dc3545', fontSize: '.82rem', marginTop: '.8rem' }}>{errorMascota}</div>}
              </div>

              <div className={styles.modalFooter}>
                <button type="button" className={styles.btnSoft} onClick={cerrarModalMascota} disabled={guardandoMascota}>
                  Cancelar
                </button>
                <button type="submit" className={styles.btnMain} disabled={!duenoSeleccionado || guardandoMascota}>
                  <Save size={16} /> {guardandoMascota ? 'Guardando…' : 'Guardar mascota'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {ConfirmacionModal}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

export default PanelMascotasAdmin;
