import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import DogNav from '../../components/DogNav/DogNav';
import { ToastContainer } from '../../components/Toast/Toast'; 
import { API_BASE } from '../../api/config';
import styles from './Perfil.module.css';
import { User, Contact, Mail, Phone, Lock, Calendar, Edit2, AlertTriangle, KeyRound } from 'lucide-react';

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

    const [perfil, setPerfil] = useState(null);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(false);
    
    const [editando, setEditando] = useState(false);
    const [guardando, setGuardando] = useState(false);
    const [formData, setFormData] = useState({
        nombre: '', apellidos: '', correo: '', telefono: ''
    });
    
    const [erroresForm, setErroresForm] = useState({});

    // --- ESTADO Y FUNCIONES PARA LOS TOASTS ---
    const [toasts, setToasts] = useState([]);

    const addToast = (message, type = 'info', duration = 4000) => {
        const id = Date.now();
        setToasts((prev) => [...prev, { id, message, type, duration }]);
    };

    const removeToast = (id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };
    // ------------------------------------------

    useEffect(() => {
        let activo = true;
        const cargarPerfil = async () => {
            setCargando(true);
            setError(false);
            try {
                const token = localStorage.getItem('jwt') || localStorage.getItem('token_huellitas');
                
                // Si viene un idParam en la URL busca por ese ID; de lo contrario consulta el perfil del usuario logueado vía Token
                const url = idParam 
                    ? `${API_BASE}/usuario/${idParam}` 
                    : `${API_BASE}/usuario/perfil`;

                const headers = {
                    'Content-Type': 'application/json'
                };

                if (token) {
                    headers['Authorization'] = `Bearer ${token}`;
                }

                const res = await fetch(url, { headers });
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
            } catch (err) {
                console.error("Error al cargar el perfil:", err);
                if (activo) setError(true);
            } finally {
                if (activo) setCargando(false);
            }
        };

        cargarPerfil();
        return () => { activo = false; };
    }, [idParam]);

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
            addToast("Información actualizada correctamente.", "success");
            
        } catch (err) {
            console.error("No se pudo guardar", err);
            addToast("Ocurrió un problema al guardar los cambios.", "error");
        } finally {
            setGuardando(false);
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
                                    <Campo etiqueta="Método de acceso" valor={perfil?.proveedor || 'Contraseña'} cargando={cargando} icono={<Lock size={20} />} />
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