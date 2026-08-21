import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import DogNav from '../../components/DogNav/DogNav';
import { ToastContainer } from '../../components/Toast/Toast';
import { API_BASE } from '../../api/config';
import { ICONOS_PERFIL, IconoDePerfil } from '../../components/Cliente/AvatarIconos';
import styles from './Perfil.module.css';
import {
  User, Contact, Mail, Phone, Lock, Calendar, Edit2, AlertTriangle, KeyRound,
  Eye, EyeOff, X, Check, Sparkles
} from 'lucide-react';

const ROLES = { 1: 'Administrador', 2: 'Veterinario', 3: 'Cliente' };
const ESTADOS_CUENTA = {
  1: { label: 'Activa', clase: 'estadoActiva' },
  2: { label: 'Invitada', clase: 'estadoInvitada' },
  3: { label: 'Suspendida', clase: 'estadoSuspendida' }
};

const obtenerIniciales = (nombre = '', apellidos = '') => {
  const a = (nombre || '').trim()[0] || '';
  const b = (apellidos || '').trim()[0] || '';
  return (a + b).toUpperCase() || 'US';
};

const obtenerToken = () =>
  localStorage.getItem('token_huellitas') || localStorage.getItem('jwt') || localStorage.getItem('token');

const Perfil = () => {
  const { id: idParam } = useParams();
  const [perfil, setPerfil] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(false);
  const [editando, setEditando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [erroresForm, setErroresForm] = useState({});
  const [proveedoresVinculados, setProveedoresVinculados] = useState({ google: false, facebook: false });
  const [formData, setFormData] = useState({ nombre: '', apellidos: '', correo: '', telefono: '' });
  const [toasts, setToasts] = useState([]);

  // Ícono de perfil (mismo set y mismo endpoint que Configuración del portal cliente).
  const [avatarIcono, setAvatarIcono] = useState(null);
  const [guardandoIcono, setGuardandoIcono] = useState(null);

  // Cuentas vinculadas — switch (vincular/desvincular), no un botón de una sola vía.
  const [procesando, setProcesando] = useState({ google: false, facebook: false });
  const [confirmacion, setConfirmacion] = useState(null); // { clave, etiqueta } | null
  // 'cargando' | 'listo' | 'bloqueado' — igual que en Configuración: cubre el caso de que un
  // bloqueador de anuncios o extensión de privacidad impida cargar el SDK de Facebook.
  const [fbEstado, setFbEstado] = useState('cargando');

  // Contraseña — modal, no un botón decorativo.
  const [tieneContrasena, setTieneContrasena] = useState(true);
  const [modalPasswordAbierto, setModalPasswordAbierto] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ actual: '' });
  const [mostrarPassword, setMostrarPassword] = useState({ actual: false });
  const [erroresPassword, setErroresPassword] = useState({});
  const [guardandoPassword, setGuardandoPassword] = useState(false);

  const addToast = (message, type = 'info', duration = 4000) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type, duration }]);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const cargarProveedoresVinculados = async () => {
    try {
      const token = obtenerToken();
      if (!token) return;

      const res = await fetch(`${API_BASE}/usuario/proveedores-vinculados`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) return;

      const data = await res.json();
      if (data?.success) {
        setProveedoresVinculados({
          google: !!data.google,
          facebook: !!data.facebook
        });
      }
    } catch (error) {
      console.error('Error al cargar proveedores vinculados:', error);
    }
  };

  useEffect(() => {
    let activo = true;

    const cargarPerfil = async () => {
      setCargando(true);
      setError(false);

      try {
        const token = obtenerToken();

        if (!token) {
          if (activo) setError(true);
          return;
        }

        const res = await fetch(`${API_BASE}/usuario/perfil`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData?.mensaje || 'No se pudo obtener el perfil');
        }

        const data = await res.json();
        if (!activo) return;

        setPerfil(data);
        setAvatarIcono(data?.avatarIcono || null);
        setTieneContrasena(!!data?.tieneContrasena);
        setFormData({
          nombre: data?.nombre || '',
          apellidos: data?.apellidos || '',
          correo: data?.correo || '',
          telefono: data?.telefono || ''
        });
      } catch (err) {
        console.error('Error al cargar el perfil:', err);
        if (activo) setError(true);
      } finally {
        if (activo) setCargando(false);
      }
    };

    cargarPerfil();
    cargarProveedoresVinculados();
    return () => { activo = false; };
  }, [idParam]);

  // SDK de Facebook — se detecta si nunca llega a cargar (bloqueador de anuncios / extensión de
  // privacidad), en vez de dejar que el botón falle en silencio.
  useEffect(() => {
    let cancelado = false;
    let intentos = 0;

    const revisarListo = () => {
      if (cancelado) return;
      if (window.FB) {
        setFbEstado('listo');
        return;
      }
      intentos += 1;
      if (intentos > 20) { // ~6s de espera antes de darlo por bloqueado
        setFbEstado('bloqueado');
        return;
      }
      setTimeout(revisarListo, 300);
    };

    if (window.FB) {
      setFbEstado('listo');
      return undefined;
    }

    window.fbAsyncInit = function () {
      window.FB.init({ appId: '4263441943966367', cookie: true, xfbml: true, version: 'v21.0' });
    };

    if (!document.getElementById('facebook-jssdk')) {
      const js = document.createElement('script');
      js.id = 'facebook-jssdk';
      js.src = 'https://connect.facebook.net/es_LA/sdk.js';
      js.async = true;
      js.defer = true;
      js.onerror = () => { if (!cancelado) setFbEstado('bloqueado'); };
      document.body.appendChild(js);
    }

    revisarListo();
    return () => { cancelado = true; };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (erroresForm[name]) {
      setErroresForm((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validarFormulario = () => {
    const errores = {};
    const regexLetras = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
    const regexCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const regexTelefono = /^[0-9]{8}$/;

    if (!formData.nombre.trim()) {
      errores.nombre = 'El nombre es obligatorio.';
    } else if (!regexLetras.test(formData.nombre)) {
      errores.nombre = 'El nombre solo puede contener letras.';
    }

    if (!formData.apellidos.trim()) {
      errores.apellidos = 'Los apellidos son obligatorios.';
    } else if (!regexLetras.test(formData.apellidos)) {
      errores.apellidos = 'Los apellidos solo pueden contener letras.';
    }

    if (!formData.correo.trim()) {
      errores.correo = 'El correo es obligatorio.';
    } else if (!regexCorreo.test(formData.correo)) {
      errores.correo = 'Ingresa un formato de correo válido.';
    }

    if (formData.telefono && !regexTelefono.test(formData.telefono.trim())) {
      errores.telefono = 'El teléfono debe tener exactamente 8 dígitos.';
    }

    setErroresForm(errores);
    if (Object.keys(errores).length > 0) {
      addToast('Revisa los errores en los campos del formulario.', 'warning');
      return false;
    }
    return true;
  };

  const handleGuardar = async (e) => {
    e.preventDefault();
    if (!validarFormulario()) return;

    setGuardando(true);
    try {
      const token = obtenerToken();
      const res = await fetch(`${API_BASE}/usuario/perfil`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (!res.ok) throw new Error('Error al actualizar');

      setPerfil((prev) => ({ ...prev, ...formData }));
      setEditando(false);
      addToast('Información actualizada correctamente.', 'success');
    } catch (err) {
      console.error('No se pudo guardar', err);
      addToast('Ocurrió un problema al guardar los cambios.', 'error');
    } finally {
      setGuardando(false);
    }
  };

  // ─── Ícono de perfil ───
  const elegirIcono = async (clave) => {
    if (clave === avatarIcono || guardandoIcono) return;
    const token = obtenerToken();
    if (!token) {
      addToast('Debes iniciar sesión para cambiar tu ícono de perfil.', 'warning');
      return;
    }

    setGuardandoIcono(clave);
    try {
      const res = await fetch(`${API_BASE}/usuario/avatar`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ icono: clave })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.mensaje || 'No se pudo actualizar tu ícono de perfil.');

      setAvatarIcono(clave);
      addToast(data?.mensaje || 'Ícono de perfil actualizado.', 'success');
    } catch (error) {
      addToast(error.message || 'Error al actualizar el ícono de perfil.', 'error');
    } finally {
      setGuardandoIcono(null);
    }
  };

  // ─── Cuentas vinculadas: switch único que vincula o desvincula ───
  const pedirConfirmacionDesvincular = (clave, etiqueta) => {
    const token = obtenerToken();
    if (!token) {
      addToast(`Debes iniciar sesión antes de desvincular ${etiqueta}.`, 'warning');
      return;
    }
    setConfirmacion({ clave, etiqueta });
  };

  const confirmarDesvinculacion = async () => {
    if (!confirmacion) return;
    const { clave, etiqueta } = confirmacion;
    const token = obtenerToken();
    setConfirmacion(null);

    setProcesando((prev) => ({ ...prev, [clave]: true }));
    try {
      const res = await fetch(`${API_BASE}/usuario/proveedores-vinculados/${clave}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.mensaje || `No se pudo desvincular ${etiqueta}.`);

      addToast(data?.mensaje || `Cuenta de ${etiqueta} desvinculada.`, 'success');
      await cargarProveedoresVinculados();
    } catch (error) {
      addToast(error.message || `Error al desvincular ${etiqueta}.`, 'error');
    } finally {
      setProcesando((prev) => ({ ...prev, [clave]: false }));
    }
  };

  // Google: flujo implícito (useGoogleLogin) en vez de <GoogleLogin>, para poder disparar el
  // vínculo desde un switch propio — el botón/iframe de <GoogleLogin> no se puede simular por
  // seguridad. El access token se valida contra /oauth2/v3/userinfo en el backend.
  const vincularGoogleConToken = async (accessToken) => {
    const token = obtenerToken();
    if (!token) {
      addToast('Debes iniciar sesión antes de vincular Google.', 'warning');
      return;
    }

    setProcesando((prev) => ({ ...prev, google: true }));
    try {
      const res = await fetch(`${API_BASE}/usuario/vincular-google-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ accessToken })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.mensaje || 'No se pudo vincular la cuenta de Google.');

      addToast(data?.mensaje || 'Cuenta de Google vinculada correctamente.', 'success');
      await cargarProveedoresVinculados();
    } catch (error) {
      addToast(error.message || 'Error al vincular la cuenta de Google.', 'error');
    } finally {
      setProcesando((prev) => ({ ...prev, google: false }));
    }
  };

  const iniciarSesionGoogle = useGoogleLogin({
    flow: 'implicit',
    onSuccess: (respuesta) => vincularGoogleConToken(respuesta.access_token),
    onError: () => addToast('No fue posible autenticar con Google.', 'error')
  });

  const handleSwitchGoogle = () => {
    if (procesando.google) return;
    if (proveedoresVinculados.google) {
      pedirConfirmacionDesvincular('google', 'Google');
    } else {
      iniciarSesionGoogle();
    }
  };

  const enviarVinculacionFacebook = async (accessToken, token) => {
    setProcesando((prev) => ({ ...prev, facebook: true }));
    try {
      const res = await fetch(`${API_BASE}/usuario/vincular-facebook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ token: accessToken })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        addToast(data.mensaje || 'Cuenta de Facebook vinculada correctamente.', 'success');
        await cargarProveedoresVinculados();
      } else {
        addToast(data.mensaje || 'No fue posible vincular Facebook.', 'error');
      }
    } catch (error) {
      console.error('Error al vincular Facebook:', error);
      addToast('Ocurrió un error al vincular Facebook.', 'error');
    } finally {
      setProcesando((prev) => ({ ...prev, facebook: false }));
    }
  };

  const handleSwitchFacebook = () => {
    if (procesando.facebook) return;

    if (proveedoresVinculados.facebook) {
      pedirConfirmacionDesvincular('facebook', 'Facebook');
      return;
    }

    const token = obtenerToken();
    if (!token) {
      addToast('Debes iniciar sesión antes de vincular Facebook.', 'warning');
      return;
    }
    if (fbEstado === 'bloqueado' || !window.FB) {
      addToast('No se pudo cargar el inicio de sesión de Facebook. Es probable que un bloqueador de anuncios o una extensión de privacidad del navegador lo esté bloqueando.', 'error');
      return;
    }
    if (fbEstado === 'cargando') {
      addToast('Facebook todavía se está cargando. Esperá unos segundos e intentalo de nuevo.', 'warning');
      return;
    }

    window.FB.login((respuesta) => {
      if (!respuesta.authResponse) {
        addToast('No se completó la autorización de Facebook.', 'warning');
        return;
      }
      enviarVinculacionFacebook(respuesta.authResponse.accessToken, token);
    }, { scope: 'public_profile,email' });
  };

  // ─── Cambiar contraseña ───
  const handleChangePassword = (e) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
    if (erroresPassword[name]) setErroresPassword((prev) => ({ ...prev, [name]: '' }));
  };

  const toggleMostrar = (campo) => setMostrarPassword((prev) => ({ ...prev, [campo]: !prev[campo] }));

  const cerrarModalPassword = () => {
    setModalPasswordAbierto(false);
    setPasswordForm({ actual: '' });
    setErroresPassword({});
    setMostrarPassword({ actual: false });
  };

  const validarPassword = () => {
    const errores = {};
    if (tieneContrasena && !passwordForm.actual) {
      errores.actual = 'Ingresá tu contraseña actual.';
    }
    setErroresPassword(errores);
    if (Object.keys(errores).length > 0) {
      addToast('Revisá los errores del formulario de contraseña.', 'warning');
      return false;
    }
    return true;
  };

  // Ya no cambia la contraseña acá: pide la verificación por correo. El cambio real se
  // completa en /restablecer-password, al hacer clic en el enlace que llega al correo.
  const guardarPassword = async (e) => {
    e.preventDefault();
    const token = obtenerToken();
    if (!token) {
      addToast('Debés iniciar sesión para cambiar tu contraseña.', 'warning');
      return;
    }
    if (!validarPassword()) return;

    setGuardandoPassword(true);
    try {
      const res = await fetch(`${API_BASE}/usuario/password/solicitar-verificacion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          passwordActual: tieneContrasena ? passwordForm.actual : null
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.mensaje || 'No se pudo enviar la verificación.');

      addToast(data?.mensaje || 'Te enviamos un enlace de verificación a tu correo.', 'success');
      cerrarModalPassword();
    } catch (error) {
      addToast(error.message || 'Error al solicitar la verificación.', 'error');
    } finally {
      setGuardandoPassword(false);
    }
  };

  const estado = perfil ? (ESTADOS_CUENTA[perfil.idEstadoCuenta] || ESTADOS_CUENTA[1]) : null;

  return (
    <>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      <DogNav />
      <main className={styles.layout}>
        <div className={styles.container}>
          <section className={styles.cover}>
            <div className={styles.coverBanner} />
            <div className={styles.identity}>
              {cargando ? (
                <div className={`${styles.avatar} ${styles.skeleton}`} />
              ) : (
                <div className={styles.avatar}>
                  {avatarIcono ? (
                    <IconoDePerfil icono={avatarIcono} size={44} />
                  ) : perfil ? (
                    obtenerIniciales(perfil.nombre, perfil.apellidos)
                  ) : (
                    <User size={40} />
                  )}
                </div>
              )}

              <div className={styles.identityText}>
                {cargando ? (
                  <>
                    <div className={`${styles.skeleton} ${styles.skelName}`} />
                    <div className={`${styles.skeleton} ${styles.skelSub}`} />
                  </>
                ) : error ? (
                  <h1 className={styles.name}>Perfil no disponible</h1>
                ) : (
                  <>
                    <h1 className={styles.name}>{perfil.nombre} {perfil.apellidos}</h1>
                    <div className={styles.tags}>
                      <span className={styles.roleTag}>{ROLES[perfil.idRol] || 'Usuario'}</span>
                      <span className={`${styles.estadoTag} ${styles[estado.clase]}`}>● {estado.label}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </section>

          {error && !cargando && (
            <div className={styles.errorBox}>
              <AlertTriangle className={styles.errorIcon} size={48} />
              <p>No pudimos cargar la información del perfil. Inténtalo más tarde.</p>
            </div>
          )}

          {!error && !cargando && (
            <section className={styles.infoCard}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}><Sparkles size={16} /> Ícono de perfil</h2>
              </div>

              <div className={styles.avatarGrid}>
                {ICONOS_PERFIL.map(({ clave, etiqueta, Icon }) => {
                  const activo = clave === avatarIcono;
                  return (
                    <button
                      key={clave}
                      type="button"
                      title={etiqueta}
                      className={`${styles.avatarOpt} ${activo ? styles.avatarOptActivo : ''}`}
                      onClick={() => elegirIcono(clave)}
                      disabled={guardandoIcono !== null}
                    >
                      <Icon size={24} />
                      {activo && <span className={styles.avatarOptCheck}><Check size={11} /></span>}
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {!error && (
            <section className={styles.infoCard}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Información personal</h2>
                {!cargando && !editando && (
                  <button className={styles.editBtn} onClick={() => setEditando(true)}>
                    <Edit2 size={14} /> Editar
                  </button>
                )}
              </div>

              {editando ? (
                <form onSubmit={handleGuardar} className={styles.editForm}>
                  <div className={styles.infoGrid}>
                    <div className={styles.formGroup}>
                      <label>Nombre</label>
                      <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} required className={erroresForm.nombre ? styles.inputError : ''} />
                      {erroresForm.nombre && <span className={styles.errorText}>{erroresForm.nombre}</span>}
                    </div>
                    <div className={styles.formGroup}>
                      <label>Apellidos</label>
                      <input type="text" name="apellidos" value={formData.apellidos} onChange={handleChange} required className={erroresForm.apellidos ? styles.inputError : ''} />
                      {erroresForm.apellidos && <span className={styles.errorText}>{erroresForm.apellidos}</span>}
                    </div>
                    <div className={styles.formGroup}>
                      <label>Correo electrónico</label>
                      <input type="email" name="correo" value={formData.correo} onChange={handleChange} required className={erroresForm.correo ? styles.inputError : ''} />
                      {erroresForm.correo && <span className={styles.errorText}>{erroresForm.correo}</span>}
                    </div>
                    <div className={styles.formGroup}>
                      <label>Teléfono</label>
                      <input type="tel" name="telefono" value={formData.telefono} onChange={handleChange} className={erroresForm.telefono ? styles.inputError : ''} />
                      {erroresForm.telefono && <span className={styles.errorText}>{erroresForm.telefono}</span>}
                    </div>
                  </div>

                  <div className={styles.formActions}>
                    <button type="button" className={styles.cancelBtn} onClick={() => {
                      setEditando(false);
                      setErroresForm({});
                      setFormData({
                        nombre: perfil?.nombre || '',
                        apellidos: perfil?.apellidos || '',
                        correo: perfil?.correo || '',
                        telefono: perfil?.telefono || ''
                      });
                    }} disabled={guardando}>Cancelar</button>
                    <button type="submit" className={styles.saveBtn} disabled={guardando}>{guardando ? 'Guardando...' : 'Guardar Cambios'}</button>
                  </div>
                </form>
              ) : (
                <div className={styles.infoGrid}>
                  <Campo etiqueta="Nombre" valor={perfil?.nombre} cargando={cargando} icono={<User size={20} />} />
                  <Campo etiqueta="Apellidos" valor={perfil?.apellidos} cargando={cargando} icono={<Contact size={20} />} />
                  <Campo etiqueta="Correo electrónico" valor={perfil?.correo} cargando={cargando} icono={<Mail size={20} />} />
                  <Campo etiqueta="Teléfono" valor={perfil?.telefono || 'No registrado'} cargando={cargando} icono={<Phone size={20} />} />
                  <Campo etiqueta="Método de acceso" valor={perfil?.proveedor || 'Contraseña'} cargando={cargando} icono={<Lock size={20} />} />
                  <Campo etiqueta="Miembro desde" valor={perfil ? new Date(perfil.fechaRegistro).toLocaleDateString('es-CR', { year: 'numeric', month: 'long', day: 'numeric' }) : ''} cargando={cargando} icono={<Calendar size={20} />} />
                </div>
              )}

              {!cargando && !editando && (
                <div className={styles.securitySection}>
                  <h2 className={styles.sectionTitle} style={{ marginTop: '2rem' }}>Cuentas vinculadas</h2>
                  <div className={styles.linkedAccounts}>
                    <div className={styles.linkedAccount}>
                      <div className={styles.linkedAccountInfo}>
                        <div className={styles.socialIcon}>G</div>
                        <div>
                          <strong>Google</strong>
                          <p>{proveedoresVinculados.google ? 'Cuenta vinculada' : 'No vinculada'}</p>
                        </div>
                      </div>

                      <button
                        type="button"
                        role="switch"
                        aria-checked={proveedoresVinculados.google}
                        aria-label={proveedoresVinculados.google ? 'Desvincular cuenta de Google' : 'Vincular cuenta de Google'}
                        title={proveedoresVinculados.google ? 'Vinculada — clic para desvincular' : 'Vincular cuenta de Google'}
                        className={`${styles.switch} ${proveedoresVinculados.google ? styles.switchActivo : ''}`}
                        onClick={handleSwitchGoogle}
                        disabled={procesando.google}
                      >
                        <span className={styles.switchThumb}>{proveedoresVinculados.google && <Check size={12} />}</span>
                      </button>
                    </div>

                    <div className={styles.linkedAccount}>
                      <div className={styles.linkedAccountInfo}>
                        <div className={styles.socialIcon}>f</div>
                        <div>
                          <strong>Facebook</strong>
                          <p>{proveedoresVinculados.facebook ? 'Cuenta vinculada' : 'No vinculada'}</p>
                          {!proveedoresVinculados.facebook && fbEstado === 'bloqueado' && (
                            <div className={styles.fbAviso}>
                              <AlertTriangle size={13} />
                              <span>No se pudo cargar. Puede estar bloqueado por un bloqueador de anuncios.</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        role="switch"
                        aria-checked={proveedoresVinculados.facebook}
                        aria-label={proveedoresVinculados.facebook ? 'Desvincular cuenta de Facebook' : 'Vincular cuenta de Facebook'}
                        title={proveedoresVinculados.facebook ? 'Vinculada — clic para desvincular' : 'Vincular cuenta de Facebook'}
                        className={`${styles.switch} ${proveedoresVinculados.facebook ? styles.switchActivo : ''}`}
                        onClick={handleSwitchFacebook}
                        disabled={procesando.facebook || (!proveedoresVinculados.facebook && fbEstado === 'bloqueado')}
                      >
                        <span className={styles.switchThumb}>{proveedoresVinculados.facebook && <Check size={12} />}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {!cargando && !editando && (
                <div className={styles.securitySection}>
                  <h2 className={styles.sectionTitle} style={{ marginTop: '2rem' }}>Seguridad</h2>
                  <div className={styles.securityAction}>
                    <div className={styles.securityText}>
                      <strong>Contraseña</strong>
                      <p>{tieneContrasena
                        ? 'Actualiza tu contraseña periódicamente para mantener tu cuenta segura.'
                        : 'Tu cuenta se creó con Google o Facebook y todavía no tiene una contraseña propia.'}</p>
                    </div>
                    <button type="button" className={styles.passwordBtn} onClick={() => setModalPasswordAbierto(true)}>
                      <KeyRound size={16} /> {tieneContrasena ? 'Cambiar Contraseña' : 'Establecer Contraseña'}
                    </button>
                  </div>
                </div>
              )}
            </section>
          )}
        </div>
      </main>

      {confirmacion && (
        <div
          className={styles.overlay}
          onClick={() => !procesando[confirmacion.clave] && setConfirmacion(null)}
        >
          <div className={`${styles.modal} ${styles.modalConfirm}`} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <AlertTriangle size={20} color="#a3720a" />
              <h3>Desvincular {confirmacion.etiqueta}</h3>
            </div>
            <p className={styles.modalSub}>
              ¿Seguro que querés desvincular tu cuenta de {confirmacion.etiqueta}? Vas a dejar de poder usarla para iniciar sesión.
            </p>
            <div className={styles.formActions}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={() => setConfirmacion(null)}
                disabled={procesando[confirmacion.clave]}
              >
                Cancelar
              </button>
              <button
                type="button"
                className={styles.dangerBtn}
                onClick={confirmarDesvinculacion}
                disabled={procesando[confirmacion.clave]}
              >
                {procesando[confirmacion.clave] ? 'Desvinculando…' : 'Sí, desvincular'}
              </button>
            </div>
          </div>
        </div>
      )}

      {modalPasswordAbierto && (
        <div className={styles.overlay} onClick={() => !guardandoPassword && cerrarModalPassword()}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <KeyRound size={20} color="#1B4332" />
              <h3>{tieneContrasena ? 'Cambiar contraseña' : 'Establecer contraseña'}</h3>
              <button
                type="button"
                onClick={cerrarModalPassword}
                style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#4a5568' }}
                aria-label="Cerrar"
                disabled={guardandoPassword}
              >
                <X size={18} />
              </button>
            </div>
            <p className={styles.modalSub}>
              {tieneContrasena
                ? 'Por seguridad, te vamos a enviar un enlace de verificación a tu correo para definir la nueva contraseña.'
                : 'Te vamos a enviar un enlace de verificación a tu correo para establecer tu contraseña.'}
            </p>

            {!tieneContrasena && (
              <div className={styles.avisoSinPassword}>
                <AlertTriangle size={18} />
                <span>Tu cuenta se creó con Google o Facebook. Al establecer una contraseña también vas a poder iniciar sesión con tu correo.</span>
              </div>
            )}

            <form onSubmit={guardarPassword} className={styles.editForm}>
              {tieneContrasena && (
                <div className={styles.formGroup}>
                  <label>Contraseña actual</label>
                  <div className={styles.passwordField}>
                    <input
                      type={mostrarPassword.actual ? 'text' : 'password'}
                      name="actual"
                      value={passwordForm.actual}
                      onChange={handleChangePassword}
                      autoFocus
                    />
                    <button type="button" className={styles.eyeToggle} onClick={() => toggleMostrar('actual')} tabIndex={-1}>
                      {mostrarPassword.actual ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {erroresPassword.actual && <span className={styles.errorText}>{erroresPassword.actual}</span>}
                </div>
              )}

              <div className={styles.formActions}>
                <button type="button" className={styles.cancelBtn} onClick={cerrarModalPassword} disabled={guardandoPassword}>
                  Cancelar
                </button>
                <button type="submit" className={styles.saveBtn} disabled={guardandoPassword}>
                  {guardandoPassword ? 'Enviando…' : 'Enviar verificación'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

const Campo = ({ etiqueta, valor, cargando, icono }) => (
  <div className={styles.campo}>
    <span className={styles.campoIcon} style={{ color: 'var(--mint)', display: 'flex', alignItems: 'center' }}>
      {icono}
    </span>
    <div className={styles.campoBody}>
      <span className={styles.campoLabel}>{etiqueta}</span>
      {cargando ? <span className={`${styles.skeleton} ${styles.skelValue}`} /> : <span className={styles.campoValue}>{valor}</span>}
    </div>
  </div>
);

export default Perfil;
