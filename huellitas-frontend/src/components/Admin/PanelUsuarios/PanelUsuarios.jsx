import React, { useCallback, useEffect, useState } from 'react';
import {
  Users, CheckCircle2, Stethoscope, ShieldCheck, Search, Eye, Pencil, Power,
  Plus, X, Save, Mail, Phone, Calendar
} from 'lucide-react';
import { API_BASE } from '../../../api/config';
import { ToastContainer } from '../../Toast/Toast';
import { useToast } from '../../Toast/useToast';
import { IconoDePerfil } from '../../Cliente/AvatarIconos';
import CustomSelect from '../../CustomSelect/CustomSelect';
import styles from '../../../pages/Admin/DashboardAdmin.module.css';

const ROLES = { 1: 'Administrador', 2: 'Veterinario', 3: 'Cliente', 4: 'Funcionario' };
const ROLE_BADGE = { 1: styles.roleAdmin, 2: styles.roleVet, 3: styles.roleClient, 4: styles.roleFuncionario };
const ESTADOS = { 1: 'Activo', 2: 'Invitado', 3: 'Suspendido' };
const ESTADO_BADGE = { 1: styles.statusActive, 2: styles.statusInactive, 3: styles.statusBlocked };

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

const FORM_VACIO = { nombre: '', apellidos: '', correo: '', telefono: '', password: '', idRol: 3 };

// Reemplaza por completo la maqueta que vivía dentro de DashboardAdmin.jsx (stats fijos, 3
// usuarios de ejemplo, modal de Bootstrap sin JS detrás) por datos reales contra
// GET/POST /api/usuario, PUT /api/usuario/{id}/rol y /estado.
const PanelUsuarios = () => {
  const { toasts, showToast, removeToast } = useToast();

  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [estadisticas, setEstadisticas] = useState({ total: 0, activos: 0, profesionales: 0, administradores: 0 });

  const [busqueda, setBusqueda] = useState('');
  const [filtroRol, setFiltroRol] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');

  const [modalAbierto, setModalAbierto] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [idEditando, setIdEditando] = useState(null);
  const [form, setForm] = useState(FORM_VACIO);
  const [erroresForm, setErroresForm] = useState({});
  const [guardando, setGuardando] = useState(false);

  const [detalle, setDetalle] = useState(null); // usuario para el modal "Ver"
  const [confirmacion, setConfirmacion] = useState(null); // { usuario, accion }
  const [procesandoId, setProcesandoId] = useState(null);

  const cargarUsuarios = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filtroRol) params.set('rol', filtroRol);
      if (filtroEstado) params.set('estado', filtroEstado);
      if (busqueda.trim()) params.set('busqueda', busqueda.trim());

      const res = await fetch(`${API_BASE}/usuario?${params.toString()}`, { headers: authHeaders() });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.mensaje || 'No se pudieron cargar los usuarios.');

      setUsuarios(data.usuarios || []);
    } catch (err) {
      setError(err.message || 'No se pudieron cargar los usuarios.');
    } finally {
      setCargando(false);
    }
  }, [filtroRol, filtroEstado, busqueda]);

  const cargarEstadisticas = async () => {
    try {
      const res = await fetch(`${API_BASE}/usuario/estadisticas`, { headers: authHeaders() });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.success) setEstadisticas(data.estadisticas);
    } catch (err) {
      console.error('Error al cargar estadísticas de usuarios:', err);
    }
  };

  useEffect(() => { cargarEstadisticas(); }, []);

  // Debounce corto de la búsqueda/filtros para no disparar un fetch por cada tecla.
  useEffect(() => {
    const timeout = setTimeout(cargarUsuarios, 300);
    return () => clearTimeout(timeout);
  }, [cargarUsuarios]);

  // ─── Crear / editar ───
  const abrirModalCrear = () => {
    setModoEdicion(false);
    setIdEditando(null);
    setForm(FORM_VACIO);
    setErroresForm({});
    setModalAbierto(true);
  };

  const abrirModalEditar = (usuario) => {
    setModoEdicion(true);
    setIdEditando(usuario.idUsuario);
    setForm({
      nombre: usuario.nombre,
      apellidos: usuario.apellidos,
      correo: usuario.correo,
      telefono: usuario.telefono || '',
      password: '',
      idRol: usuario.idRol
    });
    setErroresForm({});
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    if (guardando) return;
    setModalAbierto(false);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (erroresForm[name]) setErroresForm((prev) => ({ ...prev, [name]: '' }));
  };

  const validarForm = () => {
    const errores = {};
    if (!form.nombre.trim()) errores.nombre = 'El nombre es obligatorio.';
    if (!form.apellidos.trim()) errores.apellidos = 'Los apellidos son obligatorios.';
    if (!form.correo.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo)) {
      errores.correo = 'Ingresá un correo válido.';
    }
    if (!modoEdicion && (!form.password || form.password.length < 8)) {
      errores.password = 'La contraseña debe tener al menos 8 caracteres.';
    }
    setErroresForm(errores);
    if (Object.keys(errores).length > 0) {
      showToast('Revisá los errores del formulario.', 'warning');
      return false;
    }
    return true;
  };

  const guardarUsuario = async (e) => {
    e.preventDefault();
    if (!validarForm()) return;

    setGuardando(true);
    try {
      if (modoEdicion) {
        const res = await fetch(`${API_BASE}/usuario/${idEditando}`, {
          method: 'PUT',
          headers: authHeaders(true),
          body: JSON.stringify({
            nombre: form.nombre.trim(),
            apellidos: form.apellidos.trim(),
            correo: form.correo.trim(),
            telefono: form.telefono?.trim() || null
          })
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.mensaje || 'No se pudo actualizar el usuario.');

        // El rol se actualiza aparte porque es un endpoint distinto (con su propio guardrail
        // de "no dejar la plataforma sin ningún admin").
        const usuarioActual = usuarios.find((u) => u.idUsuario === idEditando);
        if (usuarioActual && Number(usuarioActual.idRol) !== Number(form.idRol)) {
          const resRol = await fetch(`${API_BASE}/usuario/${idEditando}/rol`, {
            method: 'PUT',
            headers: authHeaders(true),
            body: JSON.stringify({ idRol: Number(form.idRol) })
          });
          const dataRol = await resRol.json().catch(() => ({}));
          if (!resRol.ok) throw new Error(dataRol?.mensaje || 'No se pudo actualizar el rol.');
        }

        showToast('Usuario actualizado correctamente.', 'success');
      } else {
        const res = await fetch(`${API_BASE}/usuario`, {
          method: 'POST',
          headers: authHeaders(true),
          body: JSON.stringify({
            nombre: form.nombre.trim(),
            apellidos: form.apellidos.trim(),
            correo: form.correo.trim(),
            telefono: form.telefono?.trim() || null,
            password: form.password,
            idRol: Number(form.idRol)
          })
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.mensaje || 'No se pudo crear el usuario.');

        showToast('Usuario creado correctamente.', 'success');
      }

      setModalAbierto(false);
      await Promise.all([cargarUsuarios(), cargarEstadisticas()]);
    } catch (err) {
      showToast(err.message || 'Ocurrió un error al guardar el usuario.', 'error');
    } finally {
      setGuardando(false);
    }
  };

  // ─── Activar / suspender (el "Eliminar" real de esta tabla) ───
  const pedirConfirmacionEstado = (usuario) => {
    const accion = usuario.idEstadoCuenta === 3 ? 'activar' : 'suspender';
    setConfirmacion({ usuario, accion });
  };

  const confirmarCambioEstado = async () => {
    if (!confirmacion) return;
    const { usuario, accion } = confirmacion;
    const nuevoEstado = accion === 'activar' ? 1 : 3;
    setConfirmacion(null);

    setProcesandoId(usuario.idUsuario);
    try {
      const res = await fetch(`${API_BASE}/usuario/${usuario.idUsuario}/estado`, {
        method: 'PUT',
        headers: authHeaders(true),
        body: JSON.stringify({ idEstadoCuenta: nuevoEstado })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.mensaje || 'No se pudo actualizar el estado de la cuenta.');

      showToast(data?.mensaje || 'Estado actualizado correctamente.', 'success');
      await Promise.all([cargarUsuarios(), cargarEstadisticas()]);
    } catch (err) {
      showToast(err.message || 'Error al actualizar el estado de la cuenta.', 'error');
    } finally {
      setProcesandoId(null);
    }
  };

  return (
    <div style={{ width: '100%' }}>
      <section className={styles.statGrid}>
        <article className={styles.statCard}>
          <div className={styles.statTop}>
            <div className={styles.statIcon}><Users size={20} /></div>
          </div>
          <div className={styles.statLabel}>Total de usuarios</div>
          <div className={styles.statNumber}>{estadisticas.total}</div>
          <div className={styles.statNote}>Usuarios registrados en la plataforma</div>
        </article>

        <article className={styles.statCard}>
          <div className={styles.statTop}>
            <div className={styles.statIcon}><CheckCircle2 size={20} /></div>
          </div>
          <div className={styles.statLabel}>Usuarios activos</div>
          <div className={styles.statNumber}>{estadisticas.activos}</div>
          <div className={styles.statNote}>Cuentas habilitadas actualmente</div>
        </article>

        <article className={styles.statCard}>
          <div className={styles.statTop}>
            <div className={styles.statIcon}><Stethoscope size={20} /></div>
          </div>
          <div className={styles.statLabel}>Profesionales</div>
          <div className={styles.statNumber}>{estadisticas.profesionales}</div>
          <div className={styles.statNote}>Veterinarios y funcionarios registrados</div>
        </article>

        <article className={styles.statCard}>
          <div className={styles.statTop}>
            <div className={styles.statIcon}><ShieldCheck size={20} /></div>
          </div>
          <div className={styles.statLabel}>Administradores</div>
          <div className={styles.statNumber}>{estadisticas.administradores}</div>
          <div className={styles.statNote}>Usuarios con permisos globales</div>
        </article>
      </section>

      <section className={styles.contentCard}>
        <div className={styles.cardTop}>
          <div>
            <h2 className={styles.cardTitle}>Gestión de usuarios</h2>
            <p className={styles.cardSubtitle}>Consultá, filtrá, editá y controlá el estado de cualquier cuenta.</p>
          </div>

          <button className={styles.btnMain} onClick={abrirModalCrear}>
            <Plus size={16} /> Nuevo usuario
          </button>
        </div>

        <div className={styles.toolbar}>
          <div className={styles.searchField}>
            <Search size={16} />
            <input
              type="text"
              placeholder="Buscar por nombre, correo..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>

          <CustomSelect
            style={{ maxWidth: '190px' }}
            value={filtroRol}
            onChange={setFiltroRol}
            opciones={[
              { value: '', label: 'Todos los roles' },
              { value: '1', label: 'Administrador' },
              { value: '2', label: 'Veterinario' },
              { value: '3', label: 'Cliente' },
              { value: '4', label: 'Funcionario' }
            ]}
          />

          <CustomSelect
            style={{ maxWidth: '190px' }}
            value={filtroEstado}
            onChange={setFiltroEstado}
            opciones={[
              { value: '', label: 'Todos los estados' },
              { value: '1', label: 'Activo' },
              { value: '2', label: 'Invitado' },
              { value: '3', label: 'Suspendido' }
            ]}
          />
        </div>

        <div className={styles.tableWrap}>
          {cargando ? (
            <p style={{ padding: '1.5rem', color: '#718096' }}>Cargando usuarios…</p>
          ) : error ? (
            <p style={{ padding: '1.5rem', color: '#dc3545' }}>{error}</p>
          ) : usuarios.length === 0 ? (
            <p style={{ padding: '1.5rem', color: '#718096' }}>No se encontraron usuarios con esos filtros.</p>
          ) : (
            <div className={styles.tableResponsive}>
              <table className={`table ${styles.table} align-middle`}>
                <thead>
                  <tr>
                    <th>Usuario</th>
                    <th>Correo</th>
                    <th>Rol</th>
                    <th>Estado</th>
                    <th>Registro</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map((u) => (
                    <tr key={u.idUsuario}>
                      <td>
                        <div className={styles.userInfo}>
                          <div className={styles.userAvatar}>
                            {u.avatarIcono ? <IconoDePerfil icono={u.avatarIcono} size={16} /> : `${u.nombre?.[0] || ''}${u.apellidos?.[0] || ''}`.toUpperCase()}
                          </div>
                          <div className={styles.userName}>{u.nombre} {u.apellidos}</div>
                        </div>
                      </td>
                      <td>{u.correo}</td>
                      <td><span className={`${styles.roleBadge} ${ROLE_BADGE[u.idRol] || ''}`}>{ROLES[u.idRol] || u.nombreRol}</span></td>
                      <td><span className={`${styles.statusBadge} ${ESTADO_BADGE[u.idEstadoCuenta] || ''}`}>● {ESTADOS[u.idEstadoCuenta] || 'Desconocido'}</span></td>
                      <td>{formatFecha(u.fechaRegistro)}</td>
                      <td>
                        <div className={styles.actionGroup}>
                          <button className={styles.actionBtn} title="Ver detalle" onClick={() => setDetalle(u)}>
                            <Eye size={16} />
                          </button>
                          <button className={styles.actionBtn} title="Editar" onClick={() => abrirModalEditar(u)}>
                            <Pencil size={16} />
                          </button>
                          <button
                            className={`${styles.actionBtn} ${u.idEstadoCuenta !== 3 ? styles.danger : ''}`}
                            title={u.idEstadoCuenta === 3 ? 'Activar cuenta' : 'Suspender cuenta'}
                            onClick={() => pedirConfirmacionEstado(u)}
                            disabled={procesandoId === u.idUsuario}
                          >
                            <Power size={16} />
                          </button>
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
          <div>Mostrando {usuarios.length} de {estadisticas.total} usuarios registrados</div>
        </div>
      </section>

      {/* ─── MODAL CREAR/EDITAR ─── */}
      {modalAbierto && (
        <div className={styles.modalOverlay} onClick={cerrarModal}>
          <div className={styles.modalDialog} onClick={(e) => e.stopPropagation()}>
            <form className={styles.modalContent} onSubmit={guardarUsuario}>
              <div className={styles.modalHeader}>
                <div>
                  <h5 className={styles.modalTitle}>{modoEdicion ? 'Editar usuario' : 'Registrar nuevo usuario'}</h5>
                </div>
                <button type="button" onClick={cerrarModal} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }} disabled={guardando}>
                  <X size={20} />
                </button>
              </div>

              <div className={styles.modalBody}>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className={styles.formLabel}>Nombre</label>
                    <input className={styles.formControl} name="nombre" value={form.nombre} onChange={handleFormChange} />
                    {erroresForm.nombre && <div style={{ color: '#dc3545', fontSize: '.78rem', marginTop: '.3rem' }}>{erroresForm.nombre}</div>}
                  </div>

                  <div className="col-md-6">
                    <label className={styles.formLabel}>Apellidos</label>
                    <input className={styles.formControl} name="apellidos" value={form.apellidos} onChange={handleFormChange} />
                    {erroresForm.apellidos && <div style={{ color: '#dc3545', fontSize: '.78rem', marginTop: '.3rem' }}>{erroresForm.apellidos}</div>}
                  </div>

                  <div className="col-12">
                    <label className={styles.formLabel}>Correo electrónico</label>
                    <input type="email" className={styles.formControl} name="correo" value={form.correo} onChange={handleFormChange} />
                    {erroresForm.correo && <div style={{ color: '#dc3545', fontSize: '.78rem', marginTop: '.3rem' }}>{erroresForm.correo}</div>}
                  </div>

                  <div className="col-md-6">
                    <label className={styles.formLabel}>Teléfono</label>
                    <input className={styles.formControl} name="telefono" value={form.telefono} onChange={handleFormChange} placeholder="Opcional" />
                  </div>

                  <div className="col-md-6">
                    <label className={styles.formLabel}>Rol</label>
                    <CustomSelect
                      value={form.idRol}
                      onChange={(valor) => handleFormChange({ target: { name: 'idRol', value: valor } })}
                      opciones={[
                        { value: 3, label: 'Cliente' },
                        { value: 2, label: 'Veterinario' },
                        { value: 4, label: 'Funcionario' },
                        { value: 1, label: 'Administrador' }
                      ]}
                    />
                  </div>

                  {!modoEdicion && (
                    <div className="col-12">
                      <label className={styles.formLabel}>Contraseña</label>
                      <input type="password" className={styles.formControl} name="password" value={form.password} onChange={handleFormChange} />
                      {erroresForm.password ? (
                        <div style={{ color: '#dc3545', fontSize: '.78rem', marginTop: '.3rem' }}>{erroresForm.password}</div>
                      ) : (
                        <div style={{ color: '#718096', fontSize: '.78rem', marginTop: '.3rem' }}>Mínimo 8 caracteres.</div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button type="button" className={styles.btnSoft} onClick={cerrarModal} disabled={guardando}>Cancelar</button>
                <button type="submit" className={styles.btnMain} disabled={guardando}>
                  <Save size={16} /> {guardando ? 'Guardando…' : 'Guardar usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL VER DETALLE ─── */}
      {detalle && (
        <div className={styles.modalOverlay} onClick={() => setDetalle(null)}>
          <div className={styles.modalDialog} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalContent}>
              <div className={styles.modalHeader}>
                <h5 className={styles.modalTitle}>{detalle.nombre} {detalle.apellidos}</h5>
                <button type="button" onClick={() => setDetalle(null)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>
              <div className={styles.modalBody}>
                <div className="row g-3">
                  <div className="col-12"><strong><Mail size={14} /> Correo:</strong> {detalle.correo}</div>
                  <div className="col-12"><strong><Phone size={14} /> Teléfono:</strong> {detalle.telefono || 'No registrado'}</div>
                  <div className="col-12"><strong><ShieldCheck size={14} /> Rol:</strong> <span className={`${styles.roleBadge} ${ROLE_BADGE[detalle.idRol] || ''}`}>{ROLES[detalle.idRol] || detalle.nombreRol}</span></div>
                  <div className="col-12"><strong>Estado:</strong> <span className={`${styles.statusBadge} ${ESTADO_BADGE[detalle.idEstadoCuenta] || ''}`}>● {ESTADOS[detalle.idEstadoCuenta]}</span></div>
                  <div className="col-12"><strong><Calendar size={14} /> Miembro desde:</strong> {formatFecha(detalle.fechaRegistro)}</div>
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className={styles.btnSoft} onClick={() => setDetalle(null)}>Cerrar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── CONFIRMAR ACTIVAR/SUSPENDER ─── */}
      {confirmacion && (
        <div className={styles.modalOverlay} onClick={() => setConfirmacion(null)}>
          <div className={styles.modalDialog} style={{ maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalContent}>
              <div className={styles.modalHeader}>
                <h5 className={styles.modalTitle}>{confirmacion.accion === 'activar' ? 'Activar cuenta' : 'Suspender cuenta'}</h5>
              </div>
              <div className={styles.modalBody}>
                <p style={{ margin: 0 }}>
                  ¿Seguro que querés {confirmacion.accion === 'activar' ? 'activar' : 'suspender'} la cuenta de{' '}
                  <strong>{confirmacion.usuario.nombre} {confirmacion.usuario.apellidos}</strong>?
                  {confirmacion.accion === 'suspender' && ' No va a poder iniciar sesión mientras esté suspendida.'}
                </p>
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className={styles.btnSoft} onClick={() => setConfirmacion(null)}>Cancelar</button>
                <button type="button" className={styles.btnMain} onClick={confirmarCambioEstado}>
                  {confirmacion.accion === 'activar' ? 'Sí, activar' : 'Sí, suspender'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

export default PanelUsuarios;
