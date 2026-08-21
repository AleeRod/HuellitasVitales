import React, { useEffect, useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import {
  Save, User, Contact, Mail, Phone, KeyRound, Eye, EyeOff,
  ShieldCheck, Check, AlertTriangle, Sparkles, X
} from 'lucide-react';

import { ICONOS_PERFIL, IconoDePerfil } from '../Cliente/AvatarIconos';
import { API_BASE } from '../../api/config';
import { ToastContainer } from '../Toast/Toast';
import { useToast } from '../Toast/useToast';
import styles from './ConfiguracionCuenta.module.css';

// Ícono de perfil, datos de la cuenta, cuentas vinculadas (Google/Facebook) y cambio de
// contraseña — todos los endpoints detrás de esto son por-usuario-autenticado, sin nada
// específico del rol Cliente, así que este componente es genérico y lo usan tanto
// `pages/Cliente/Configuracion.jsx` (dentro de ClienteLayout) como el panel de Administración
// (dentro de DashboardAdmin), cada uno como un wrapper delgado.
const REGEX_LETRAS = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
const REGEX_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const obtenerToken = () =>
  localStorage.getItem('token_huellitas') || localStorage.getItem('jwt') || localStorage.getItem('token');

const ConfiguracionCuenta = () => {
  const { toasts, showToast, removeToast } = useToast();

  // Datos de la cuenta
  const [form, setForm] = useState({ nombre: '', apellidos: '', correo: '', telefono: '' });
  const [erroresForm, setErroresForm] = useState({});
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  // Ícono de perfil
  const [avatarIcono, setAvatarIcono] = useState(null);
  const [guardandoIcono, setGuardandoIcono] = useState(null); // clave del ícono en vuelo

  // Cuentas vinculadas
  const [proveedores, setProveedores] = useState({ google: false, facebook: false });
  const [cargandoProveedores, setCargandoProveedores] = useState(true);
  // 'cargando' | 'listo' | 'bloqueado' — 'bloqueado' cubre el caso más común de que Facebook
  // "no funcione": un bloqueador de anuncios o una extensión de privacidad impide que
  // connect.facebook.net llegue a cargar, y sin esto el botón fallaba en silencio.
  const [fbEstado, setFbEstado] = useState('cargando');
  // Switch en vuelo — deshabilita el control y evita doble clic mientras se vincula/desvincula.
  const [procesando, setProcesando] = useState({ google: false, facebook: false });
  const [confirmacion, setConfirmacion] = useState(null); // { clave, etiqueta } | null

  // Contraseña
  const [tieneContrasena, setTieneContrasena] = useState(true);
  const [modalPasswordAbierto, setModalPasswordAbierto] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ actual: '', nueva: '', confirmar: '' });
  const [mostrarPassword, setMostrarPassword] = useState({ actual: false, nueva: false, confirmar: false });
  const [erroresPassword, setErroresPassword] = useState({});
  const [guardandoPassword, setGuardandoPassword] = useState(false);

  const cargarPerfil = async () => {
    const token = obtenerToken();
    if (!token) return;

    try {
      setCargando(true);
      const res = await fetch(`${API_BASE}/usuario/perfil`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.mensaje || 'No se pudo cargar tu perfil.');
      setForm({
        nombre: data.nombre || '',
        apellidos: data.apellidos || '',
        correo: data.correo || '',
        telefono: data.telefono || ''
      });
      setAvatarIcono(data.avatarIcono || null);
      setTieneContrasena(!!data.tieneContrasena);
    } catch (error) {
      showToast(error.message || 'Error al cargar tu perfil.', 'error');
    } finally {
      setCargando(false);
    }
  };

  const cargarProveedores = async () => {
    const token = obtenerToken();
    if (!token) return;

    try {
      setCargandoProveedores(true);
      const res = await fetch(`${API_BASE}/usuario/proveedores-vinculados`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.success) {
        setProveedores({ google: !!data.google, facebook: !!data.facebook });
      }
    } catch (error) {
      console.error('Error al cargar cuentas vinculadas:', error);
    } finally {
      setCargandoProveedores(false);
    }
  };

  useEffect(() => {
    cargarPerfil();
    cargarProveedores();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // SDK de Facebook — se carga una sola vez por sesión de navegador, y se detecta si nunca
  // llega a cargar (bloqueador de anuncios / extensión de privacidad), en vez de fallar en
  // silencio.
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

  // ─── Datos de la cuenta ───
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (erroresForm[name]) setErroresForm((prev) => ({ ...prev, [name]: '' }));
  };

  const validarFormulario = () => {
    const errores = {};
    if (!form.nombre.trim()) errores.nombre = 'El nombre es obligatorio.';
    else if (!REGEX_LETRAS.test(form.nombre)) errores.nombre = 'El nombre solo puede contener letras.';

    if (!form.apellidos.trim()) errores.apellidos = 'Los apellidos son obligatorios.';
    else if (!REGEX_LETRAS.test(form.apellidos)) errores.apellidos = 'Los apellidos solo pueden contener letras.';

    if (!form.correo.trim()) errores.correo = 'El correo es obligatorio.';
    else if (!REGEX_CORREO.test(form.correo)) errores.correo = 'Ingresá un formato de correo válido.';

    setErroresForm(errores);
    if (Object.keys(errores).length > 0) {
      showToast('Revisá los errores en los campos del formulario.', 'warning');
      return false;
    }
    return true;
  };

  const guardar = async (e) => {
    e.preventDefault();
    const token = obtenerToken();
    if (!token) {
      showToast('Debés iniciar sesión para editar tu perfil.', 'warning');
      return;
    }
    if (!validarFormulario()) return;

    setGuardando(true);
    try {
      const res = await fetch(`${API_BASE}/usuario/perfil`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          nombre: form.nombre.trim(),
          apellidos: form.apellidos.trim(),
          correo: form.correo.trim(),
          telefono: form.telefono?.trim() || null
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.mensaje || 'No se pudo guardar los cambios.');

      showToast(data?.mensaje || 'Perfil actualizado correctamente.', 'success');
    } catch (error) {
      showToast(error.message || 'Error al guardar los cambios.', 'error');
    } finally {
      setGuardando(false);
    }
  };

  // ─── Ícono de perfil ───
  const elegirIcono = async (clave) => {
    if (clave === avatarIcono || guardandoIcono) return;
    const token = obtenerToken();
    if (!token) {
      showToast('Debés iniciar sesión para cambiar tu ícono de perfil.', 'warning');
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
      showToast(data?.mensaje || 'Ícono de perfil actualizado.', 'success');
    } catch (error) {
      showToast(error.message || 'Error al actualizar el ícono de perfil.', 'error');
    } finally {
      setGuardandoIcono(null);
    }
  };

  // ─── Cuentas vinculadas: switch único que vincula o desvincula, según el estado actual ───
  const pedirConfirmacionDesvincular = (clave, etiqueta) => {
    const token = obtenerToken();
    if (!token) {
      showToast(`Debés iniciar sesión antes de desvincular ${etiqueta}.`, 'warning');
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

      showToast(data?.mensaje || `Cuenta de ${etiqueta} desvinculada.`, 'success');
      await cargarProveedores();
    } catch (error) {
      showToast(error.message || `Error al desvincular ${etiqueta}.`, 'error');
    } finally {
      setProcesando((prev) => ({ ...prev, [clave]: false }));
    }
  };

  // Google: flujo implícito (useGoogleLogin) en vez de <GoogleLogin>, porque ese componente
  // renderiza el botón de Google dentro de un iframe que no se puede disparar desde un switch
  // propio (por seguridad, Google no deja simular clic ahí). El access token resultante se
  // valida contra /oauth2/v3/userinfo del lado del backend — ver
  // UsuarioService.VincularGoogleConAccessTokenAsync.
  const vincularGoogleConToken = async (accessToken) => {
    const token = obtenerToken();
    if (!token) {
      showToast('Debés iniciar sesión antes de vincular Google.', 'warning');
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

      showToast(data?.mensaje || 'Cuenta de Google vinculada correctamente.', 'success');
      await cargarProveedores();
    } catch (error) {
      showToast(error.message || 'Error al vincular la cuenta de Google.', 'error');
    } finally {
      setProcesando((prev) => ({ ...prev, google: false }));
    }
  };

  const iniciarSesionGoogle = useGoogleLogin({
    flow: 'implicit',
    onSuccess: (respuesta) => vincularGoogleConToken(respuesta.access_token),
    onError: () => showToast('No fue posible autenticar con Google.', 'error')
  });

  const handleSwitchGoogle = () => {
    if (procesando.google) return;
    if (proveedores.google) {
      pedirConfirmacionDesvincular('google', 'Google');
    } else {
      iniciarSesionGoogle();
    }
  };

  // El SDK de Facebook recibe el callback de FB.login como un valor que él mismo inspecciona
  // internamente — pasarle directamente una función async (en vez de una función normal que
  // dispare la lógica async por su cuenta) puede confundir esa inspección en algunos
  // navegadores/versiones. Se separa en dos: FB.login recibe una función normal, y esta es la
  // que dispara la llamada al backend.
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
        showToast(data.mensaje || 'Cuenta de Facebook vinculada correctamente.', 'success');
        await cargarProveedores();
      } else {
        showToast(data.mensaje || 'No fue posible vincular Facebook.', 'error');
      }
    } catch (error) {
      console.error('Error al vincular Facebook:', error);
      showToast('Ocurrió un error al vincular Facebook.', 'error');
    } finally {
      setProcesando((prev) => ({ ...prev, facebook: false }));
    }
  };

  const handleSwitchFacebook = () => {
    if (procesando.facebook) return;

    if (proveedores.facebook) {
      pedirConfirmacionDesvincular('facebook', 'Facebook');
      return;
    }

    const token = obtenerToken();
    if (!token) {
      showToast('Debés iniciar sesión antes de vincular Facebook.', 'warning');
      return;
    }
    if (fbEstado === 'bloqueado' || !window.FB) {
      showToast('No se pudo cargar el inicio de sesión de Facebook. Es probable que un bloqueador de anuncios o una extensión de privacidad del navegador lo esté bloqueando — desactivalo para este sitio e intentá de nuevo.', 'error');
      return;
    }
    if (fbEstado === 'cargando') {
      showToast('Facebook todavía se está cargando. Esperá unos segundos e intentalo de nuevo.', 'warning');
      return;
    }
    // Facebook bloquea FB.login() en páginas http que no sean http://localhost — si ves
    // "FB.login can no longer be called from http pages" en la consola, revisá que la barra de
    // direcciones diga exactamente eso (no 127.0.0.1 ni una IP) y probá en una ventana de
    // incógnito, ya que algunas extensiones también rompen este flujo.
    window.FB.login((respuesta) => {
      if (!respuesta.authResponse) {
        showToast('No se completó la autorización de Facebook.', 'warning');
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
    setPasswordForm({ actual: '', nueva: '', confirmar: '' });
    setErroresPassword({});
    setMostrarPassword({ actual: false, nueva: false, confirmar: false });
  };

  const validarPassword = () => {
    const errores = {};
    if (tieneContrasena && !passwordForm.actual) {
      errores.actual = 'Ingresá tu contraseña actual.';
    }
    if (!passwordForm.nueva || passwordForm.nueva.length < 8) {
      errores.nueva = 'La nueva contraseña debe tener al menos 8 caracteres.';
    }
    if (passwordForm.confirmar !== passwordForm.nueva) {
      errores.confirmar = 'Las contraseñas no coinciden.';
    }
    setErroresPassword(errores);
    if (Object.keys(errores).length > 0) {
      showToast('Revisá los errores del formulario de contraseña.', 'warning');
      return false;
    }
    return true;
  };

  const guardarPassword = async (e) => {
    e.preventDefault();
    const token = obtenerToken();
    if (!token) {
      showToast('Debés iniciar sesión para cambiar tu contraseña.', 'warning');
      return;
    }
    if (!validarPassword()) return;

    setGuardandoPassword(true);
    try {
      const res = await fetch(`${API_BASE}/usuario/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          passwordActual: tieneContrasena ? passwordForm.actual : null,
          passwordNueva: passwordForm.nueva
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.mensaje || 'No se pudo cambiar la contraseña.');

      showToast(data?.mensaje || 'Contraseña actualizada correctamente.', 'success');
      setTieneContrasena(true);
      cerrarModalPassword();
    } catch (error) {
      showToast(error.message || 'Error al cambiar la contraseña.', 'error');
    } finally {
      setGuardandoPassword(false);
    }
  };

  return (
    <>
      <div className={styles.panel}>

        {/* ─── ÍCONO DE PERFIL ─── */}
        <section className={styles.seccion}>
          <div className={styles.seccionHead}>
            <div className={styles.seccionIcono}><Sparkles size={20} /></div>
            <div>
              <h2 className={styles.seccionTitulo}>Ícono de perfil</h2>
            </div>
          </div>
          <p className={styles.seccionSub}>Elegí uno de los íconos disponibles para personalizar tu cuenta.</p>

          <div className={styles.avatarActual}>
            <div className={styles.avatarActualIcono}>
              <IconoDePerfil icono={avatarIcono} size={30} />
            </div>
            <div className={styles.avatarActualTexto}>
              <strong>Tu ícono actual</strong>
              <span>{avatarIcono ? ICONOS_PERFIL.find((i) => i.clave === avatarIcono)?.etiqueta : 'Sin elegir todavía'}</span>
            </div>
          </div>

          <div className={styles.avatarGrid}>
            {ICONOS_PERFIL.map(({ clave, etiqueta, Icon }) => {
              const activo = clave === avatarIcono;
              return (
                <button
                  key={clave}
                  type="button"
                  title={etiqueta}
                  className={`${styles.avatarBtn} ${activo ? styles.avatarBtnActivo : ''}`}
                  onClick={() => elegirIcono(clave)}
                  disabled={guardandoIcono !== null}
                >
                  <Icon size={26} />
                  {activo && <span className={styles.avatarBtnCheck}><Check size={12} /></span>}
                </button>
              );
            })}
          </div>
        </section>

        {/* ─── DATOS DE LA CUENTA ─── */}
        <section className={styles.seccion}>
          <div className={styles.seccionHead}>
            <div className={styles.seccionIcono}><User size={20} /></div>
            <div>
              <h2 className={styles.seccionTitulo}>Datos de la cuenta</h2>
            </div>
          </div>
          <p className={styles.seccionSub}>Actualizá tu información personal de contacto.</p>

          {cargando ? (
            <p className={styles.seccionSub}>Cargando tu perfil…</p>
          ) : (
            <form onSubmit={guardar}>
              <div className={styles.formGrid}>
                <label className={styles.campo}>
                  Nombre
                  <div className={styles.inputConIcono}>
                    <User size={16} />
                    <input name="nombre" value={form.nombre} onChange={handleChange} />
                  </div>
                  {erroresForm.nombre && <span className={styles.mensajeError}>{erroresForm.nombre}</span>}
                </label>

                <label className={styles.campo}>
                  Apellidos
                  <div className={styles.inputConIcono}>
                    <Contact size={16} />
                    <input name="apellidos" value={form.apellidos} onChange={handleChange} />
                  </div>
                  {erroresForm.apellidos && <span className={styles.mensajeError}>{erroresForm.apellidos}</span>}
                </label>

                <label className={styles.campo}>
                  Correo
                  <div className={styles.inputConIcono}>
                    <Mail size={16} />
                    <input type="email" name="correo" value={form.correo} onChange={handleChange} />
                  </div>
                  {erroresForm.correo && <span className={styles.mensajeError}>{erroresForm.correo}</span>}
                </label>

                <label className={styles.campo}>
                  Teléfono
                  <div className={styles.inputConIcono}>
                    <Phone size={16} />
                    <input name="telefono" value={form.telefono} onChange={handleChange} placeholder="Opcional" />
                  </div>
                </label>
              </div>

              <div className={styles.formAcciones}>
                <button type="submit" className={styles.btnPrimario} disabled={guardando}>
                  <Save size={16} />
                  {guardando ? 'Guardando…' : 'Guardar cambios'}
                </button>
              </div>
            </form>
          )}
        </section>

        {/* ─── CUENTAS VINCULADAS ─── */}
        <section className={styles.seccion}>
          <div className={styles.seccionHead}>
            <div className={styles.seccionIcono}><ShieldCheck size={20} /></div>
            <div>
              <h2 className={styles.seccionTitulo}>Cuentas vinculadas</h2>
            </div>
          </div>
          <p className={styles.seccionSub}>Vinculá tu cuenta con Google o Facebook para iniciar sesión más rápido.</p>

          {cargandoProveedores ? (
            <p className={styles.seccionSub}>Cargando cuentas vinculadas…</p>
          ) : (
            <>
              <div className={styles.cuentaFila}>
                <div className={styles.cuentaInfo}>
                  <div className={`${styles.cuentaIcono} ${styles.cuentaIconoGoogle}`}>G</div>
                  <div className={styles.cuentaTexto}>
                    <strong>Google</strong>
                    <span>{proveedores.google ? 'Tu cuenta está vinculada.' : 'Todavía no vinculaste tu cuenta de Google.'}</span>
                  </div>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={proveedores.google}
                  aria-label={proveedores.google ? 'Desvincular cuenta de Google' : 'Vincular cuenta de Google'}
                  title={proveedores.google ? 'Vinculada — clic para desvincular' : 'Vincular cuenta de Google'}
                  className={`${styles.switch} ${proveedores.google ? styles.switchActivo : ''}`}
                  onClick={handleSwitchGoogle}
                  disabled={procesando.google}
                >
                  <span className={styles.switchThumb}>{proveedores.google && <Check size={12} />}</span>
                </button>
              </div>

              <div className={styles.cuentaFila}>
                <div className={styles.cuentaInfo}>
                  <div className={`${styles.cuentaIcono} ${styles.cuentaIconoFacebook}`}>f</div>
                  <div className={styles.cuentaTexto}>
                    <strong>Facebook</strong>
                    <span>{proveedores.facebook ? 'Tu cuenta está vinculada.' : 'Todavía no vinculaste tu cuenta de Facebook.'}</span>
                    {!proveedores.facebook && fbEstado === 'bloqueado' && (
                      <div className={styles.fbAviso}>
                        <AlertTriangle size={14} />
                        <span>No se pudo cargar. Puede estar bloqueado por un bloqueador de anuncios o extensión de privacidad del navegador.</span>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={proveedores.facebook}
                  aria-label={proveedores.facebook ? 'Desvincular cuenta de Facebook' : 'Vincular cuenta de Facebook'}
                  title={proveedores.facebook ? 'Vinculada — clic para desvincular' : 'Vincular cuenta de Facebook'}
                  className={`${styles.switch} ${proveedores.facebook ? styles.switchActivo : ''}`}
                  onClick={handleSwitchFacebook}
                  disabled={procesando.facebook || (!proveedores.facebook && fbEstado === 'bloqueado')}
                >
                  <span className={styles.switchThumb}>{proveedores.facebook && <Check size={12} />}</span>
                </button>
              </div>
            </>
          )}
        </section>

        {/* ─── CONTRASEÑA ─── */}
        <section className={styles.seccion}>
          <div className={styles.seccionHead}>
            <div className={styles.seccionIcono}><KeyRound size={20} /></div>
            <div>
              <h2 className={styles.seccionTitulo}>Contraseña</h2>
            </div>
          </div>
          <p className={styles.seccionSub}>
            {tieneContrasena
              ? 'Usá una contraseña que no utilicés en otros sitios y actualizala periódicamente.'
              : 'Tu cuenta se creó con Google o Facebook y todavía no tiene una contraseña propia.'}
          </p>

          {!tieneContrasena && (
            <div className={styles.avisoSinPassword}>
              <AlertTriangle size={18} />
              <span>Establecé una contraseña para también poder iniciar sesión con tu correo, sin depender de Google o Facebook.</span>
            </div>
          )}

          <button type="button" className={styles.btnPrimario} onClick={() => setModalPasswordAbierto(true)}>
            <KeyRound size={16} />
            {tieneContrasena ? 'Cambiar contraseña' : 'Establecer contraseña'}
          </button>
        </section>
      </div>

      {confirmacion && (
        <div
          className={styles.overlay}
          onClick={() => !procesando[confirmacion.clave] && setConfirmacion(null)}
        >
          <div className={`${styles.modal} ${styles.modalConfirmacion}`} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <AlertTriangle size={20} color="#a3720a" />
              <h3>Desvincular {confirmacion.etiqueta}</h3>
            </div>
            <p className={styles.modalSub}>
              ¿Seguro que querés desvincular tu cuenta de {confirmacion.etiqueta}? Vas a dejar de poder usarla para iniciar sesión.
            </p>
            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.btnSecundario}
                onClick={() => setConfirmacion(null)}
                disabled={procesando[confirmacion.clave]}
              >
                Cancelar
              </button>
              <button
                type="button"
                className={styles.btnPeligro}
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
            <p className={styles.modalSub}>Usá una contraseña que no utilicés en otros sitios.</p>

            {!tieneContrasena && (
              <div className={styles.avisoSinPassword}>
                <AlertTriangle size={18} />
                <span>Tu cuenta se creó con Google o Facebook. Al establecer una contraseña también vas a poder iniciar sesión con tu correo.</span>
              </div>
            )}

            <form onSubmit={guardarPassword} className={styles.form}>
              {tieneContrasena && (
                <label className={styles.campo}>
                  Contraseña actual
                  <div className={styles.inputConIcono}>
                    <KeyRound size={16} />
                    <input
                      type={mostrarPassword.actual ? 'text' : 'password'}
                      name="actual"
                      value={passwordForm.actual}
                      onChange={handleChangePassword}
                      autoFocus
                    />
                    <button type="button" onClick={() => toggleMostrar('actual')} tabIndex={-1}>
                      {mostrarPassword.actual ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {erroresPassword.actual && <span className={styles.mensajeError}>{erroresPassword.actual}</span>}
                </label>
              )}

              <label className={styles.campo}>
                Nueva contraseña
                <div className={styles.inputConIcono}>
                  <KeyRound size={16} />
                  <input
                    type={mostrarPassword.nueva ? 'text' : 'password'}
                    name="nueva"
                    value={passwordForm.nueva}
                    onChange={handleChangePassword}
                  />
                  <button type="button" onClick={() => toggleMostrar('nueva')} tabIndex={-1}>
                    {mostrarPassword.nueva ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {erroresPassword.nueva ? (
                  <span className={styles.mensajeError}>{erroresPassword.nueva}</span>
                ) : (
                  <span className={styles.mensajeAyuda}>Mínimo 8 caracteres.</span>
                )}
              </label>

              <label className={styles.campo}>
                Confirmar nueva contraseña
                <div className={styles.inputConIcono}>
                  <KeyRound size={16} />
                  <input
                    type={mostrarPassword.confirmar ? 'text' : 'password'}
                    name="confirmar"
                    value={passwordForm.confirmar}
                    onChange={handleChangePassword}
                  />
                  <button type="button" onClick={() => toggleMostrar('confirmar')} tabIndex={-1}>
                    {mostrarPassword.confirmar ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {erroresPassword.confirmar && <span className={styles.mensajeError}>{erroresPassword.confirmar}</span>}
              </label>

              <div className={styles.modalFooter}>
                <button type="button" className={styles.btnSecundario} onClick={cerrarModalPassword} disabled={guardandoPassword}>
                  Cancelar
                </button>
                <button type="submit" className={styles.btnPrimario} disabled={guardandoPassword}>
                  <KeyRound size={16} />
                  {guardandoPassword ? 'Guardando…' : tieneContrasena ? 'Cambiar contraseña' : 'Establecer contraseña'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </>
  );
};

export default ConfiguracionCuenta;
