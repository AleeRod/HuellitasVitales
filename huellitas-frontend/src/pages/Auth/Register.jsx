import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import styles from './Register.module.css';

function Register() {
    
    // ─── LECTURA DE MENSAJES DE REDIRECCIÓN ───
    const location = useLocation();
    const alertMessage = location.state?.infoMessage;

    // ─── ESTADOS DEL FORMULARIO ───
    const [formData, setFormData] = useState({
        nombre: '',
        apellido: '',
        correo: '',
        telefono: '',
        pass1: '',
        pass2: '',
        terms: false
    });

    const [showPass1, setShowPass1] = useState(false);
    const [showPass2, setShowPass2] = useState(false);
    
    const [error, setError] = useState(null);
    const [shake, setShake] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    // ─── LÓGICA DE FORTALEZA DE CONTRASEÑA ───
    const checkPasswordStrength = (val) => {
        let score = 0;
        if (val.length >= 8) score++;
        if (/[A-Z]/.test(val)) score++;
        if (/[0-9]/.test(val)) score++;
        if (/[^A-Za-z0-9]/.test(val)) score++;
        return score;
    };

    const passScore = checkPasswordStrength(formData.pass1);
    const strengthColors = ['#e53e3e', '#dd6b20', '#d69e2e', '#52B788'];
    const strengthLabels = ['Muy débil', 'Débil', 'Buena', 'Fuerte'];

    // ─── MANEJADORES DE EVENTOS ───
    const handleChange = (e) => {
        const { id, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [id]: type === 'checkbox' ? checked : value
        }));
        if (error) setError(null);
    };

    const triggerError = (msg) => {
        setError(msg);
        setShake(true);
        setTimeout(() => setShake(false), 300);
    };

    const doRegister = async (e) => {
        e.preventDefault();
        setError(null);

        const { nombre, apellido, correo, telefono, pass1, pass2, terms } = formData;

        if (!nombre.trim() || !apellido.trim() || !correo.trim() || !pass1 || !pass2) {
            triggerError("Por favor, completa todos los campos obligatorios.");
            return;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(correo.trim())) {
            triggerError("El formato del correo es incorrecto.");
            return;
        }

        const telefonoLimpio = telefono.replace(/[\s-]/g, ''); 
        if (!/^[0-9]{8}$/.test(telefonoLimpio)) {
            triggerError("El teléfono debe contener exactamente 8 números.");
            return;
        }

        if (pass1 !== pass2) {
            triggerError("Las contraseñas no coinciden.");
            return;
        }
        if (!terms) {
            triggerError("Debes aceptar los Términos y Condiciones.");
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE}/Login/registrar`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    Nombre: nombre.trim(),
                    Apellidos: apellido.trim(),
                    Correo: correo.trim(),
                    Telefono: telefonoLimpio,
                    Password: pass1
                })
            });

            const result = await response.json();

            if (response.ok) {
                setIsSuccess(true);
            } else {
                triggerError(result.mensaje || "Error al procesar el registro.");
            }
        } catch (error) {
            triggerError("Error de conexión con el servidor (puerto 5010).");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles['register-container']}>
            {/* ═══ PANEL IZQUIERDO ═══ */}
            <div className={styles['panel-hero']}>
                <div className={styles['hero-badge']}>
                    <svg width="10" height="10" viewBox="0 0 10 10">
                        <circle cx="5" cy="5" r="5" fill="#52B788" />
                    </svg>
                    Nuevo registro
                </div>

                <div className={`${styles['mascot-wrap']} mb-4`}>
                    <svg viewBox="0 0 260 290" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <polygon points="68,95 50,48 100,78" fill="#555" />
                        <polygon points="192,95 210,48 160,78" fill="#555" />
                        <polygon points="72,92 58,58 98,80" fill="#e88fa0" />
                        <polygon points="188,92 202,58 162,80" fill="#e88fa0" />
                        <ellipse cx="130" cy="148" rx="88" ry="80" fill="#777" />
                        <ellipse cx="130" cy="158" rx="58" ry="56" fill="#ccc" />
                        <ellipse cx="92" cy="175" rx="18" ry="11" fill="#e88fa0" opacity=".45" />
                        <ellipse cx="168" cy="175" rx="18" ry="11" fill="#e88fa0" opacity=".45" />
                        <ellipse cx="108" cy="145" rx="18" ry="20" fill="#fff" />
                        <ellipse cx="152" cy="145" rx="18" ry="20" fill="#fff" />
                        <ellipse cx="110" cy="147" rx="12" ry="14" fill="#3d7a3d" />
                        <ellipse cx="154" cy="147" rx="12" ry="14" fill="#3d7a3d" />
                        <ellipse cx="110" cy="147" rx="6" ry="10" fill="#111" />
                        <ellipse cx="154" cy="147" rx="6" ry="10" fill="#111" />
                        <circle cx="114" cy="141" r="4" fill="#fff" />
                        <circle cx="158" cy="141" r="4" fill="#fff" />
                        <polygon points="130,170 124,177 136,177" fill="#e88fa0" />
                        <path d="M 124 177 Q 130 184 136 177" stroke="#999" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                        <path d="M 116 180 Q 120 186 124 177" stroke="#999" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                        <path d="M 144 177 Q 140 186 136 177" stroke="#999" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                        <line x1="60" y1="172" x2="110" y2="177" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
                        <line x1="58" y1="180" x2="108" y2="180" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
                        <line x1="150" y1="177" x2="200" y2="172" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
                        <line x1="152" y1="180" x2="202" y2="180" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
                        <ellipse cx="130" cy="248" rx="70" ry="52" fill="#777" />
                        <ellipse cx="92" cy="278" rx="26" ry="16" fill="#666" />
                        <ellipse cx="168" cy="278" rx="26" ry="16" fill="#666" />
                        <ellipse cx="78" cy="287" rx="8" ry="5" fill="#555" />
                        <ellipse cx="92" cy="291" rx="8" ry="5" fill="#555" />
                        <ellipse cx="106" cy="287" rx="8" ry="5" fill="#555" />
                        <ellipse cx="154" cy="287" rx="8" ry="5" fill="#555" />
                        <ellipse cx="168" cy="291" rx="8" ry="5" fill="#555" />
                        <ellipse cx="182" cy="287" rx="8" ry="5" fill="#555" />
                        <path d="M 55 248 Q 20 200 40 158 Q 50 135 65 148" stroke="#666" strokeWidth="16" strokeLinecap="round" fill="none" />
                        <path d="M 108 228 Q 130 218 152 228" stroke="rgba(255,255,255,.5)" strokeWidth="3" fill="none" strokeLinecap="round" />
                        <circle cx="130" cy="217" r="8" stroke="rgba(255,255,255,.5)" strokeWidth="3" fill="none" />
                    </svg>
                </div>

                <h1 className={styles['hero-title']}>Únete a la familia<br /><span>Huellitas Vitales</span> hoy</h1>
                <p className={styles['hero-sub']}>Gestiona pacientes, citas y<br />expedientes desde un solo lugar.</p>

                <ul className={styles['benefits']}>
                    <li>
                        <span className={styles['benefit-icon']}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.27 2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 6 6l.92-.92a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.72 16z" />
                            </svg>
                        </span>
                        <div>
                            <div style={{ fontWeight: 600, fontSize: '.83rem' }}>Fichas clínicas digitales</div>
                            <div style={{ color: 'rgba(255,255,255,.5)', fontSize: '.75rem' }}>Historial completo de cada paciente</div>
                        </div>
                    </li>
                    <li>
                        <span className={styles['benefit-icon']}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                            </svg>
                        </span>
                        <div>
                            <div style={{ fontWeight: 600, fontSize: '.83rem' }}>Agenda inteligente</div>
                            <div style={{ color: 'rgba(255,255,255,.5)', fontSize: '.75rem' }}>Recordatorios automáticos de citas</div>
                        </div>
                    </li>
                    <li>
                        <span className={styles['benefit-icon']}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                            </svg>
                        </span>
                        <div>
                            <div style={{ fontWeight: 600, fontSize: '.83rem' }}>Reportes y estadísticas</div>
                            <div style={{ color: 'rgba(255,255,255,.5)', fontSize: '.75rem' }}>Seguimiento de salud en tiempo real</div>
                        </div>
                    </li>
                </ul>

                <div className={styles['dots-grid']}>
                    <span></span><span></span><span></span><span></span><span></span><span></span>
                    <span></span><span></span><span></span><span></span><span></span><span></span>
                    <span></span><span></span><span></span><span></span><span></span><span></span>
                    <span></span><span></span><span></span><span></span><span></span><span></span>
                </div>
            </div>

            {/* ═══ PANEL FORMULARIO ═══ */}
            <div className={styles['panel-form']}>
                <div className={`${styles['form-card']} ${shake ? styles['shake'] : ''}`}>

                    <div className={styles['paw-logo']}>
                        <div className={styles['paw-icon']}>
                            <img src="/Imagenes/logo.png" alt="Logo" width="100" height="65" />
                        </div>
                        <span className={styles['brand-name']}>Huellitas Vitales</span>
                    </div>

                    {!isSuccess ? (
                        <>
                            {alertMessage && (
                                <div style={{
                                    backgroundColor: 'rgba(82, 183, 136, 0.15)',
                                    color: '#1B4332',
                                    padding: '0.9rem 1.2rem',
                                    borderRadius: '12px',
                                    marginBottom: '1.5rem',
                                    borderLeft: '4px solid #52B788',
                                    fontSize: '0.95rem',
                                    fontWeight: '600',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.8rem',
                                    boxShadow: '0 4px 15px rgba(0,0,0,0.03)'
                                }}>
                                    <span style={{ fontSize: '1.2rem' }}>🐾</span>
                                    {alertMessage}
                                </div>
                            )}

                            <h2 className={styles['form-heading']}>Crear cuenta</h2>
                            <p className={styles['form-sub']}>Ingresa tus datos para comenzar</p>

                            <form onSubmit={doRegister} noValidate>
                                <div className={styles['row-2']}>
                                    <div className={styles['field-group']}>
                                        <label htmlFor="nombre">Nombre</label>
                                        <div className={styles['input-wrap']}>
                                            <input type="text" id="nombre" placeholder="Nombre" value={formData.nombre} onChange={handleChange} />
                                            <span className={styles['input-icon']}>
                                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                                                </svg>
                                            </span>
                                        </div>
                                    </div>
                                    <div className={styles['field-group']}>
                                        <label htmlFor="apellido">Apellido</label>
                                        <div className={styles['input-wrap']}>
                                            <input type="text" id="apellido" placeholder="Apellido" value={formData.apellido} onChange={handleChange} />
                                            <span className={styles['input-icon']}>
                                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                                                </svg>
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className={styles['field-group']}>
                                    <label htmlFor="correo">Correo electrónico</label>
                                    <div className={styles['input-wrap']}>
                                        <input type="email" id="correo" placeholder="Correo electrónico" value={formData.correo} onChange={handleChange} />
                                        <span className={styles['input-icon']}>
                                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <rect x="2" y="4" width="20" height="16" rx="2" /><path d="m2 7 10 7 10-7" />
                                            </svg>
                                        </span>
                                    </div>
                                </div>

                                <div className={styles['field-group']}>
                                    <label htmlFor="telefono">Teléfono</label>
                                    <div className={styles['input-wrap']}>
                                        <input type="tel" id="telefono" placeholder="Teléfono" value={formData.telefono} onChange={handleChange} />
                                        <span className={styles['input-icon']}>
                                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.27 2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 6 6l.92-.92a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.72 16z" />
                                            </svg>
                                        </span>
                                    </div>
                                </div>

                                <div className={styles['section-sep']}>Contraseña</div>

                                <div className={styles['field-group']}>
                                    <label htmlFor="pass1">Contraseña</label>
                                    <div className={styles['input-wrap']}>
                                        <input type={showPass1 ? "text" : "password"} id="pass1" placeholder="Mínimo 8 caracteres" value={formData.pass1} onChange={handleChange} />
                                        <span className={styles['input-icon']}>
                                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                            </svg>
                                        </span>
                                        <button type="button" className={styles['toggle-pass']} onClick={() => setShowPass1(!showPass1)}>
                                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                {showPass1 ? (
                                                    <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></>
                                                ) : (
                                                    <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>
                                                )}
                                            </svg>
                                        </button>
                                    </div>
                                    <div className={styles['strength-bar']}>
                                        {[1, 2, 3, 4].map((item, index) => (
                                            <span key={item} style={{ background: index < passScore ? strengthColors[passScore - 1] : '#dde3d8' }}></span>
                                        ))}
                                    </div>
                                    <div className={styles['strength-label']} style={{ color: formData.pass1.length && passScore ? strengthColors[passScore - 1] : 'var(--text-lt)' }}>
                                        {formData.pass1.length ? (strengthLabels[passScore - 1] || 'Ingresa una contraseña') : 'Ingresa una contraseña'}
                                    </div>
                                </div>

                                <div className={styles['field-group']}>
                                    <label htmlFor="pass2">Confirmar contraseña</label>
                                    <div className={styles['input-wrap']}>
                                        <input type={showPass2 ? "text" : "password"} id="pass2" placeholder="Repite tu contraseña" value={formData.pass2} onChange={handleChange} />
                                        <span className={styles['input-icon']}>
                                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                            </svg>
                                        </span>
                                        <button type="button" className={styles['toggle-pass']} onClick={() => setShowPass2(!showPass2)}>
                                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                {showPass2 ? (
                                                    <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></>
                                                ) : (
                                                    <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>
                                                )}
                                            </svg>
                                        </button>
                                    </div>
                                </div>

                                <label className={styles['terms-check']}>
                                    <input type="checkbox" id="terms" checked={formData.terms} onChange={handleChange} />
                                    <span>Acepto los <Link to="#">Términos de uso</Link> y la <Link to="#">Política de privacidad</Link> de Huellitas Vitales.</span>
                                </label>

                                {error && (
                                    <div className={styles['error-box']}>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                                        <span>{error}</span>
                                    </div>
                                )}

                                <button type="submit" className={styles['btn-register']} disabled={isLoading} style={{ opacity: isLoading ? 0.7 : 1 }}>
                                    {isLoading ? 'Conectando...' : (
                                        <>
                                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" /></svg>
                                            Crear cuenta
                                        </>
                                    )}
                                </button>
                            </form>

                            <p className={styles['login-txt']}>
                                ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
                            </p>
                        </>
                    ) : (
                        <div className={styles['success-screen']}>
                            <div className={styles['success-anim']}>
                                <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                            </div>
                            <h3 className={styles['success-title']}>¡Cuenta creada!</h3>
                            <p className={styles['success-sub']}>Bienvenido a Huellitas Vitales. Revisa tu correo para verificar tu cuenta y empezar a usarla.</p>
                            <Link to="/login" className={styles['btn-go-login']}>Ir al inicio de sesión</Link>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}

export default Register;