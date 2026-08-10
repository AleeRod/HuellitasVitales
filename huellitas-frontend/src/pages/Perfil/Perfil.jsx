import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import DogNav from '../../components/DogNav/DogNav';
// 👇 Asegúrese de que esta ruta coincida con donde guardó su componente Toast
import { ToastContainer } from '../../components/Toast/Toast'; 
import { API_BASE } from '../../api/config';
import styles from './Perfil.module.css';
import { User, Contact, Mail, Phone, Lock, Calendar, Edit2, AlertTriangle, KeyRound } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';

const ROLES = { 1: 'Administrador', 2: 'Veterinario', 3: 'Cliente' };
const ESTADOS_CUENTA = {
    1: { label: 'Activa', clase: 'estadoActiva' },
    2: { label: 'Invitada', clase: 'estadoInvitada' },
    3: { label: 'Suspendida', clase: 'estadoSuspendida' }
};

const obtenerIniciales = (nombre = '', apellidos = '') => {
    const a = nombre.trim()[0] || '';
    const b = apellidos.trim()[0] || '';
    return (a + b).toUpperCase() || 'US';
};

const Perfil = () => {
    const { id: idParam } = useParams();
    const idUsuario = idParam || localStorage.getItem('idUsuario') || 1;

    const [perfil, setPerfil] = useState(null);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(false);
    
    const [editando, setEditando] = useState(false);
    const [guardando, setGuardando] = useState(false);
    const [formData, setFormData] = useState({
        nombre: '', apellidos: '', correo: '', telefono: ''
    });
    
    const [erroresForm, setErroresForm] = useState({});
    const [proveedoresVinculados, setProveedoresVinculados] = useState({google: false,facebook: false});

    // --- ESTADO Y FUNCIONES PARA LOS TOASTS ---
    const [toasts, setToasts] = useState([]);

    const addToast = (message, type = 'info', duration = 4000) => {
        const id = Date.now();
        setToasts((prev) => [...prev, { id, message, type, duration }]);
    };

    const removeToast = (id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    const cargarProveedoresVinculados = async () => {
    try {
        const token =
            localStorage.getItem('jwt') ||
            localStorage.getItem('token_huellitas');

        if (!token) return;

        const res = await fetch(
            `${API_BASE}/usuario/proveedores-vinculados`,
            {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }
        );

        if (!res.ok) {
            throw new Error('No se pudieron obtener las vinculaciones.');
        }

        const data = await res.json();

        if (data.success) {
            setProveedoresVinculados({
                google: data.google,
                facebook: data.facebook
            });
        }
    } catch (error) {
        console.error(
            'Error al cargar proveedores vinculados:',
            error
        );
    }
};
    // ------------------------------------------

    useEffect(() => {
        let activo = true;
        const cargarPerfil = async () => {
            setCargando(true);
            setError(false);
            try {
                const res = await fetch(`${API_BASE}/usuario/${idUsuario}`);
                if (!res.ok) throw new Error('No se pudo obtener el perfil');

                const data = await res.json();
                if (activo) {
                    setPerfil(data);
                    setFormData({
                        nombre: data.nombre || '',
                        apellidos: data.apellidos || '',
                        correo: data.correo || '',
                        telefono: data.telefono || ''
                    });
                }
            } catch {
                if (activo) setError(true);
            } finally {
                if (activo) setCargando(false);
            }
        };
        cargarPerfil();
        return () => { activo = false; };
    }, [idUsuario]);

useEffect(() => {
    cargarProveedoresVinculados();

    if (window.FB) {
        return;
    }

    window.fbAsyncInit = function () {
        window.FB.init({
            appId: '4263441943966367',
            cookie: true,
            xfbml: true,
            version: 'v13.0'
        });

        console.log("Facebook SDK cargado correctamente");
    };

    if (!document.getElementById('facebook-jssdk')) {
        const js = document.createElement('script');

        js.id = 'facebook-jssdk';
        js.src = 'https://connect.facebook.net/es_LA/sdk.js';
        js.async = true;
        js.defer = true;

        document.body.appendChild(js);
    }
}, []);
    

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (erroresForm[e.target.name]) {
            setErroresForm({ ...erroresForm, [e.target.name]: '' });
        }
    };

    

    const validarFormulario = () => {
        const errores = {};
        const regexLetras = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
        const regexCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const regexTelefono = /^[0-9]{8}$/;

        if (!formData.nombre.trim()) {
            errores.nombre = "El nombre es obligatorio.";
        } else if (!regexLetras.test(formData.nombre)) {
            errores.nombre = "El nombre solo puede contener letras.";
        }

        if (!formData.apellidos.trim()) {
            errores.apellidos = "Los apellidos son obligatorios.";
        } else if (!regexLetras.test(formData.apellidos)) {
            errores.apellidos = "Los apellidos solo pueden contener letras.";
        }

        if (!formData.correo.trim()) {
            errores.correo = "El correo es obligatorio.";
        } else if (!regexCorreo.test(formData.correo)) {
            errores.correo = "Ingresa un formato de correo válido.";
        }

        if (formData.telefono && !regexTelefono.test(formData.telefono.trim())) {
            errores.telefono = "El teléfono debe tener exactamente 8 dígitos.";
        }

        setErroresForm(errores);
        
        // 👇 Si hay errores, disparamos el Toast de Warning
        if (Object.keys(errores).length > 0) {
            addToast("Revisa los errores en los campos del formulario.", "warning");
            return false;
        }
        return true;
    };

    const handleGuardar = async (e) => {
        e.preventDefault();
        
        if (!validarFormulario()) return;

        setGuardando(true);
        try {
            const token = localStorage.getItem('jwt') || localStorage.getItem('token_huellitas'); 
            const res = await fetch(`${API_BASE}/usuario/perfil`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (!res.ok) throw new Error('Error al actualizar');
            
            setPerfil((prev) => ({ ...prev, ...formData }));
            setEditando(false);
            
            // 👇 Toast de Success al guardar bien
            addToast("Información actualizada correctamente.", "success");
            
        } catch (err) {
            console.error("No se pudo guardar", err);
            // 👇 Toast de Error si el backend falla
            addToast("Ocurrió un problema al guardar los cambios.", "error");
        } finally {
            setGuardando(false);
        }
    };

        const handleVincularGoogle = async (response) => {
        try {
            const tokenHuellitas = localStorage.getItem('token_huellitas');

            if (!tokenHuellitas) {
                addToast(
                    "Debes iniciar sesión antes de vincular Google.",
                    "warning"
                );
                return;
            }

            if (!response?.credential) {
                addToast(
                    "No se pudo obtener la credencial de Google.",
                    "error"
                );
                return;
            }

            const res = await fetch(`${API_BASE}/login/vincular-google`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${tokenHuellitas}`
                },
                body: JSON.stringify({
                    token: response.credential
                })
            });

            const data = await res.json();

            if (res.ok && data.success) {
                addToast(
                    data.mensaje || "Cuenta de Google vinculada correctamente.",
                    "success"
                );

                // Recargar el perfil para mostrar el nuevo proveedor
                if (res.ok && data.success) {
                    addToast(
                        data.mensaje || "Cuenta de Google vinculada correctamente.",
                        "success"
                    );

                    await cargarProveedoresVinculados();
                }
                if (perfilRes.ok) {
                    const perfilActualizado = await perfilRes.json();
                    setPerfil(perfilActualizado);
                }
            } else {
                addToast(
                    data.mensaje || "No fue posible vincular la cuenta de Google.",
                    "error"
                );
            }
        } catch (error) {
            console.error("Error al vincular Google:", error);

            addToast(
                "Ocurrió un error al intentar vincular Google.",
                "error"
            );
        }
    };

const handleVincularFacebook = () => {
    console.log("Botón Facebook presionado");

    const tokenHuellitas = localStorage.getItem('token_huellitas');

    if (!tokenHuellitas) {
        addToast(
            "Debes iniciar sesión antes de vincular Facebook.",
            "warning"
        );
        return;
    }

    if (!window.FB) {
        console.error("Facebook SDK no está disponible.");

        addToast(
            "Facebook todavía se está cargando. Espera unos segundos e inténtalo nuevamente.",
            "warning"
        );

        return;
    }

    console.log("Facebook SDK disponible, abriendo login...");

    window.FB.login(
        async (response) => {

            console.log("Respuesta de Facebook:", response);

            if (!response.authResponse) {
                addToast(
                    "No se completó la autorización de Facebook.",
                    "warning"
                );
                return;
            }

            const accessToken =
                response.authResponse.accessToken;

            try {
                const res = await fetch(
                    `${API_BASE}/usuario/vincular-facebook`,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${tokenHuellitas}`
                        },
                        body: JSON.stringify({
                            token: accessToken
                        })
                    }
                );

                const data = await res.json();

                console.log("Respuesta API Facebook:", data);

                if (res.ok && data.success) {

                    addToast(
                        data.mensaje ||
                        "Cuenta de Facebook vinculada correctamente.",
                        "success"
                    );

                    await cargarProveedoresVinculados();

                } else {

                    addToast(
                        data.mensaje ||
                        "No fue posible vincular Facebook.",
                        "error"
                    );
                }

            } catch (error) {

                console.error(
                    "Error al vincular Facebook:",
                    error
                );

                addToast(
                    "Ocurrió un error al vincular Facebook.",
                    "error"
                );
            }
        },
        {
            scope: 'public_profile,email'
        }
    );
};

    const estado = perfil ? (ESTADOS_CUENTA[perfil.idEstadoCuenta] || ESTADOS_CUENTA[1]) : null;

    return (
        <>
            {/* 👇 El contenedor de Toasts se renderiza aquí arriba */}
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
                                    {perfil ? obtenerIniciales(perfil.nombre, perfil.apellidos) : <User size={40} />}
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
                                        <h1 className={styles.name}>
                                            {perfil.nombre} {perfil.apellidos}
                                        </h1>
                                        <div className={styles.tags}>
                                            <span className={styles.roleTag}>
                                                {ROLES[perfil.idRol] || 'Usuario'}
                                            </span>
                                            <span className={`${styles.estadoTag} ${styles[estado.clase]}`}>
                                                ● {estado.label}
                                            </span>
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
                                            <input 
                                                type="text" name="nombre" value={formData.nombre} 
                                                onChange={handleChange} required 
                                                className={erroresForm.nombre ? styles.inputError : ''}
                                            />
                                            {erroresForm.nombre && <span className={styles.errorText}>{erroresForm.nombre}</span>}
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label>Apellidos</label>
                                            <input 
                                                type="text" name="apellidos" value={formData.apellidos} 
                                                onChange={handleChange} required 
                                                className={erroresForm.apellidos ? styles.inputError : ''}
                                            />
                                            {erroresForm.apellidos && <span className={styles.errorText}>{erroresForm.apellidos}</span>}
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label>Correo electrónico</label>
                                            <input 
                                                type="email" name="correo" value={formData.correo} 
                                                onChange={handleChange} required 
                                                className={erroresForm.correo ? styles.inputError : ''}
                                            />
                                            {erroresForm.correo && <span className={styles.errorText}>{erroresForm.correo}</span>}
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label>Teléfono</label>
                                            <input 
                                                type="tel" name="telefono" value={formData.telefono} 
                                                onChange={handleChange} 
                                                className={erroresForm.telefono ? styles.inputError : ''}
                                            />
                                            {erroresForm.telefono && <span className={styles.errorText}>{erroresForm.telefono}</span>}
                                        </div>
                                    </div>
                                    
                                    <div className={styles.formActions}>
                                        <button 
                                            type="button" className={styles.cancelBtn} 
                                            onClick={() => {
                                                setEditando(false);
                                                setErroresForm({});
                                                setFormData({
                                                    nombre: perfil.nombre,
                                                    apellidos: perfil.apellidos,
                                                    correo: perfil.correo,
                                                    telefono: perfil.telefono || ''
                                                });
                                            }}
                                            disabled={guardando}
                                        >
                                            Cancelar
                                        </button>
                                        <button type="submit" className={styles.saveBtn} disabled={guardando}>
                                            {guardando ? 'Guardando...' : 'Guardar Cambios'}
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <div className={styles.infoGrid}>
                                    <Campo etiqueta="Nombre" valor={perfil?.nombre} cargando={cargando} icono={<User size={20} />} />
                                    <Campo etiqueta="Apellidos" valor={perfil?.apellidos} cargando={cargando} icono={<Contact size={20} />} />
                                    <Campo etiqueta="Correo electrónico" valor={perfil?.correo} cargando={cargando} icono={<Mail size={20} />} />
                                    <Campo etiqueta="Teléfono" valor={perfil?.telefono || 'No registrado'} cargando={cargando} icono={<Phone size={20} />} />
                                    <Campo etiqueta="Método de acceso" valor={perfil?.proveedor} cargando={cargando} icono={<Lock size={20} />} />
                                    <Campo etiqueta="Miembro desde" valor={perfil ? new Date(perfil.fechaRegistro).toLocaleDateString('es-CR', { year: 'numeric', month: 'long', day: 'numeric' }) : ''} cargando={cargando} icono={<Calendar size={20} />} />
                                </div>
                            )}

                            {!cargando && !editando && (
                                <div className={styles.securitySection}>
                                    <h2 className={styles.sectionTitle} style={{ marginTop: '2rem' }}>Seguridad</h2>
                                    <div className={styles.securityAction}>
                                        <div className={styles.securityText}>
                                            <strong>Contraseña</strong>
                                            <p>Actualiza tu contraseña periódicamente para mantener tu cuenta segura.</p>
                                        </div>
                                        <button className={styles.passwordBtn}>
                                            <KeyRound size={16} /> Cambiar Contraseña
                                        </button>
                                    </div>
                                </div>
                            )}

                        <div className={styles.securitySection}>
                        <h2 className={styles.sectionTitle} style={{ marginTop: '2rem' }}>
                            Cuentas vinculadas
                        </h2>

                        <div className={styles.linkedAccounts}>

                            {/* GOOGLE */}
                            <div className={styles.linkedAccount}>
                                <div className={styles.linkedAccountInfo}>
                                    <div className={styles.socialIcon}>
                                        G
                                    </div>

                                    <div>
                                        <strong>Google</strong>
                                        <p>
                                            {proveedoresVinculados.google
                                                ? 'Cuenta vinculada'
                                                : 'No vinculada'}
                                        </p>
                                    </div>
                                </div>

                                {proveedoresVinculados.google ? (
                                    <span className={styles.linkedCheck}>
                                        ✓ Vinculado
                                    </span>
                                ) : (
                                    <GoogleLogin
                                        onSuccess={handleVincularGoogle}
                                        onError={() => {
                                            addToast(
                                                "No fue posible autenticar con Google.",
                                                "error"
                                            );
                                        }}
                                        useOneTap={false}
                                        type="standard"
                                        theme="outline"
                                        size="medium"
                                        shape="rectangular"
                                        text="continue_with"
                                    />
                                )}
                            </div>

                            {/* FACEBOOK */}
                            <div className={styles.linkedAccount}>
                                <div className={styles.linkedAccountInfo}>
                                    <div className={styles.socialIcon}>
                                        f
                                    </div>

                                    <div>
                                        <strong>Facebook</strong>
                                        <p>
                                            {proveedoresVinculados.facebook
                                                ? 'Cuenta vinculada'
                                                : 'No vinculada'}
                                        </p>
                                    </div>
                                </div>

                                {proveedoresVinculados.facebook ? (
                                    <span className={styles.linkedCheck}>
                                        ✓ Vinculado
                                    </span>
                                ) : (
                                    <button
                                        type="button"
                                        className={styles.linkAccountBtn}
                                        onClick={handleVincularFacebook}
                                    >
                                        Vincular
                                    </button>
                                )}
                            </div>

                        </div>
                    </div>
                        </section>
                    )}
                </div>
            </main>
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
            {cargando ? (
                <span className={`${styles.skeleton} ${styles.skelValue}`} />
            ) : (
                <span className={styles.campoValue}>{valor}</span>
            )}
        </div>
    </div>
);

export default Perfil;