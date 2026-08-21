import React, { useEffect, useState } from 'react';
import { ShieldCheck, Stethoscope, PawPrint, Briefcase, Search, AlertTriangle } from 'lucide-react';
import { API_BASE } from '../../../api/config';
import { ToastContainer } from '../../Toast/Toast';
import { useToast } from '../../Toast/useToast';
import CustomSelect from '../../CustomSelect/CustomSelect';
import styles from '../../../pages/Admin/DashboardAdmin.module.css';

const ROLES = { 1: 'Administrador', 2: 'Veterinario', 3: 'Cliente', 4: 'Funcionario' };
const ROLE_BADGE = { 1: styles.roleAdmin, 2: styles.roleVet, 3: styles.roleClient, 4: styles.roleFuncionario };

const DEFINICION_ROLES = [
  { id: 1, nombre: 'Administrador', Icon: ShieldCheck, descripcion: 'Control total: usuarios, comercios, servicios, roles.' },
  { id: 2, nombre: 'Veterinario', Icon: Stethoscope, descripcion: 'Gestiona su agenda, pacientes y expedientes clínicos.' },
  { id: 3, nombre: 'Cliente', Icon: PawPrint, descripcion: 'Agenda citas, gestiona sus mascotas y su expediente.' },
  { id: 4, nombre: 'Funcionario', Icon: Briefcase, descripcion: 'Administra el comercio donde trabaja (servicios, productos, empleados).' }
];

const obtenerToken = () =>
  localStorage.getItem('token_huellitas') ||
  localStorage.getItem('token') ||
  localStorage.getItem('huellitas_token') ||
  localStorage.getItem('jwt') || '';

const authHeaders = (conJson = false) => ({
  Authorization: `Bearer ${obtenerToken()}`,
  ...(conJson ? { 'Content-Type': 'application/json' } : {})
});

// El proyecto no tiene ninguna tabla de permisos granulares — solo 4 roles fijos, chequeados a
// mano en cada acción del backend (ver Reglas-Generales.md). Esta sección es real pero acotada
// a lo que el sistema realmente modela: ver los 4 roles con su cantidad de usuarios, y poder
// reasignar el rol de un usuario existente. No hay ninguna matriz de permisos configurable acá
// porque no existe nada así por debajo.
const PanelRolesPermisos = () => {
  const { toasts, showToast, removeToast } = useToast();

  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [filtroRol, setFiltroRol] = useState(null); // null = todos los roles
  const [cambio, setCambio] = useState(null); // { usuario, nuevoRol }
  const [procesandoId, setProcesandoId] = useState(null);

  const cargarUsuarios = async () => {
    setCargando(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/usuario`, { headers: authHeaders() });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.mensaje || 'No se pudieron cargar los usuarios.');
      setUsuarios(data.usuarios || []);
    } catch (err) {
      setError(err.message || 'No se pudieron cargar los usuarios.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargarUsuarios(); }, []);

  const conteoPorRol = (idRol) => usuarios.filter((u) => u.idRol === idRol).length;

  const termino = busqueda.trim().toLowerCase();
  const usuariosFiltrados = usuarios
    .filter((u) => !filtroRol || u.idRol === filtroRol)
    .filter((u) => !termino ||
      `${u.nombre} ${u.apellidos}`.toLowerCase().includes(termino) ||
      u.correo.toLowerCase().includes(termino));

  const alternarFiltroRol = (idRol) => setFiltroRol((actual) => (actual === idRol ? null : idRol));

  const pedirCambioRol = (usuario, nuevoRolStr) => {
    const nuevoRol = Number(nuevoRolStr);
    if (nuevoRol === usuario.idRol) return;
    setCambio({ usuario, nuevoRol });
  };

  const confirmarCambioRol = async () => {
    if (!cambio) return;
    const { usuario, nuevoRol } = cambio;
    setCambio(null);

    setProcesandoId(usuario.idUsuario);
    try {
      const res = await fetch(`${API_BASE}/usuario/${usuario.idUsuario}/rol`, {
        method: 'PUT',
        headers: authHeaders(true),
        body: JSON.stringify({ idRol: nuevoRol })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.mensaje || 'No se pudo cambiar el rol.');

      showToast(data?.mensaje || 'Rol actualizado correctamente.', 'success');
      await cargarUsuarios();
    } catch (err) {
      showToast(err.message || 'Error al cambiar el rol.', 'error');
    } finally {
      setProcesandoId(null);
    }
  };

  return (
    <div style={{ width: '100%' }}>
      <section className={styles.statGrid}>
        {DEFINICION_ROLES.map(({ id, nombre, Icon, descripcion }) => {
          const activo = filtroRol === id;
          return (
            <article
              className={styles.statCard}
              key={id}
              role="button"
              tabIndex={0}
              onClick={() => alternarFiltroRol(id)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); alternarFiltroRol(id); } }}
              title={activo ? `Quitar filtro de ${nombre}` : `Ver solo ${nombre}`}
              style={{
                cursor: 'pointer',
                borderColor: activo ? '#52B788' : undefined,
                boxShadow: activo ? '0 0 0 3px rgba(82,183,136,.22)' : undefined
              }}
            >
              <div className={styles.statTop}>
                <div className={styles.statIcon}><Icon size={20} /></div>
              </div>
              <div className={styles.statLabel}>{nombre}</div>
              <div className={styles.statNumber}>{cargando ? '…' : conteoPorRol(id)}</div>
              <div className={styles.statNote}>{descripcion}</div>
            </article>
          );
        })}
      </section>

      <section className={styles.contentCard}>
        <div className={styles.cardTop}>
          <div>
            <h2 className={styles.cardTitle}>Reasignar roles</h2>
            <p className={styles.cardSubtitle}>
              El sistema maneja 4 roles fijos, sin permisos configurables por separado. Cambiá el
              rol de cualquier usuario desde acá, o hacé clic en una tarjeta de arriba para filtrar por rol.
            </p>
          </div>
        </div>

        <div className={styles.toolbar}>
          <div className={styles.searchField}>
            <Search size={16} />
            <input
              type="text"
              placeholder="Buscar por nombre o correo..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>

          {filtroRol && (
            <span
              className={`${styles.roleBadge} ${ROLE_BADGE[filtroRol] || ''}`}
              style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
              onClick={() => setFiltroRol(null)}
              title="Quitar filtro"
            >
              Filtrando: {ROLES[filtroRol]} ✕
            </span>
          )}
        </div>

        <div className={styles.tableWrap}>
          {cargando ? (
            <p style={{ padding: '1.5rem', color: '#718096' }}>Cargando usuarios…</p>
          ) : error ? (
            <p style={{ padding: '1.5rem', color: '#dc3545' }}>{error}</p>
          ) : usuariosFiltrados.length === 0 ? (
            <p style={{ padding: '1.5rem', color: '#718096' }}>No se encontraron usuarios con esos filtros.</p>
          ) : (
            <div className={styles.tableResponsive}>
              <table className={`table ${styles.table} align-middle`}>
                <thead>
                  <tr>
                    <th>Usuario</th>
                    <th>Correo</th>
                    <th>Rol actual</th>
                    <th>Cambiar a</th>
                  </tr>
                </thead>
                <tbody>
                  {usuariosFiltrados.map((u) => (
                    <tr key={u.idUsuario}>
                      <td>
                        <div className={styles.userInfo}>
                          <div className={styles.userAvatar}>{`${u.nombre?.[0] || ''}${u.apellidos?.[0] || ''}`.toUpperCase()}</div>
                          <div className={styles.userName}>{u.nombre} {u.apellidos}</div>
                        </div>
                      </td>
                      <td>{u.correo}</td>
                      <td><span className={`${styles.roleBadge} ${ROLE_BADGE[u.idRol] || ''}`}>{ROLES[u.idRol] || u.nombreRol}</span></td>
                      <td>
                        <CustomSelect
                          style={{ maxWidth: 190 }}
                          value={u.idRol}
                          disabled={procesandoId === u.idUsuario}
                          onChange={(valor) => pedirCambioRol(u, valor)}
                          opciones={[
                            { value: 1, label: 'Administrador' },
                            { value: 2, label: 'Veterinario' },
                            { value: 3, label: 'Cliente' },
                            { value: 4, label: 'Funcionario' }
                          ]}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {cambio && (
        <div className={styles.modalOverlay} onClick={() => setCambio(null)}>
          <div className={styles.modalDialog} style={{ maxWidth: 440 }} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalContent}>
              <div className={styles.modalHeader}>
                <h5 className={styles.modalTitle}>Cambiar rol</h5>
              </div>
              <div className={styles.modalBody}>
                <p style={{ display: 'flex', alignItems: 'flex-start', gap: '.5rem', margin: 0 }}>
                  <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: 2 }} />
                  <span>
                    ¿Seguro que querés cambiar el rol de <strong>{cambio.usuario.nombre} {cambio.usuario.apellidos}</strong> de{' '}
                    <strong>{ROLES[cambio.usuario.idRol]}</strong> a <strong>{ROLES[cambio.nuevoRol]}</strong>?
                  </span>
                </p>
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className={styles.btnSoft} onClick={() => setCambio(null)}>Cancelar</button>
                <button type="button" className={styles.btnMain} onClick={confirmarCambioRol}>Sí, cambiar rol</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

export default PanelRolesPermisos;
