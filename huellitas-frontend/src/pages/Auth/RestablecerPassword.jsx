import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import styles from './Login.module.css';
import AuthHeroPanel from './AuthHeroPanel';
import { API_BASE } from '../../api/config.js';

// Segundo paso de "olvidé mi contraseña": se llega acá desde el enlace del correo de
// verificación (POST /api/password/recuperar ya no devuelve el token en la respuesta, lo manda
// solo por correo). El token + correo vienen en la URL; hacer clic en el enlace del correo es
// justamente lo que "verifica que es él" antes de dejarlo definir una contraseña nueva.
function RestablecerPassword() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token') || '';
    const correo = searchParams.get('correo') || '';

    const [nuevaPassword, setNuevaPassword] = useState('');
    const [confirmarPassword, setConfirmarPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [cargando, setCargando] = useState(false);
    const [notification, setNotification] = useState({ message: '', type: '' });
    const [exito, setExito] = useState(false);

    const navigate = useNavigate();

    const triggerNotification = (message, type = 'error') => {
        setNotification({ message, type });
        setTimeout(() => setNotification({ message: '', type: '' }), 5000);
    };

    const enlaceInvalido = !token || !correo;

    const restablecerPassword = async (e) => {
        e.preventDefault();
        if (!nuevaPassword || nuevaPassword.length < 8) {
            triggerNotification('La nueva contraseña debe tener al menos 8 caracteres.');
            return;
        }
        if (nuevaPassword !== confirmarPassword) {
            triggerNotification('Las contraseñas no coinciden.');
            return;
        }

        setCargando(true);
        try {
            const res = await fetch(`${API_BASE}/password/restablecer`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, correo, nuevaPassword })
            });
            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                triggerNotification(data.mensaje || 'No se pudo restablecer la contraseña.');
                return;
            }

            setExito(true);
            setTimeout(() => navigate('/login'), 2200);
        } catch (error) {
            triggerNotification('Problemas conectando con el servidor.');
        } finally {
            setCargando(false);
        }
    };

    const handleRipple = (e) => {
        const button = e.currentTarget;
        const ripple = document.createElement('span');
        const rect = button.getBoundingClientRect();
        ripple.style.cssText = `
            position:absolute; border-radius:50%; background:rgba(255,255,255,.3);
            width:8px; height:8px; left:${e.clientX - rect.left - 4}px;
            top:${e.clientY - rect.top - 4}px;
            animation:rippleAnim .6s linear forwards;
            pointer-events:none;
        `;
        button.appendChild(ripple);
        setTimeout(() => ripple.remove(), 650);
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh', width: '100vw', margin: 0, padding: 0 }}>

            <AuthHeroPanel
                titulo={<>Un último paso<br />para tu <span>tranquilidad</span></>}
                subtitulo={<>Ya verificamos tu identidad —<br />ahora definí tu nueva contraseña.</>}
            />

            <div className={styles['panel-form']}>
                <div className={styles['form-card']}>

                    {notification.message && (
                        <div className={`${styles.notification} ${notification.type === 'error' ? styles.notifError : styles.notifSuccess}`}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                            <span>{notification.message}</span>
                        </div>
                    )}

                    <div className={styles['paw-logo']}>
                        <div className={styles['paw-icon']}>
                            <img src="/Imagenes/logo-huellitas.png" alt="Logo" style={{ width: '140px', height: 'auto', objectFit: 'contain', filter: 'drop-shadow(0 8px 14px rgba(0,0,0,0.22))' }} />
                        </div>
                        <span className={styles['brand-name']}>Huellitas Vitales</span>
                    </div>

                    {enlaceInvalido ? (
                        <>
                            <h2 className={styles['form-heading']}>Enlace inválido</h2>
                            <p className={styles['form-sub']}>
                                Este enlace de verificación está incompleto o ya vencido. Volvé a solicitar
                                la recuperación desde el login.
                            </p>
                            <p className={styles['register-txt']}>
                                <Link to="/login">← Volver a iniciar sesión</Link>
                            </p>
                        </>
                    ) : exito ? (
                        <>
                            <h2 className={styles['form-heading']}>¡Contraseña actualizada!</h2>
                            <p className={styles['form-sub']}>Ya podés iniciar sesión con tu nueva contraseña. Te llevamos al login…</p>
                        </>
                    ) : (
                        <>
                            <h2 className={styles['form-heading']}>Nueva contraseña</h2>
                            <p className={styles['form-sub']}>Verificamos tu correo — ya podés definir una contraseña nueva.</p>

                            <form onSubmit={restablecerPassword} noValidate>
                                <div className={styles['field-group']}>
                                    <label htmlFor="nueva-password">Nueva contraseña</label>
                                    <div className={styles['input-wrap']}>
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            id="nueva-password"
                                            placeholder="Mínimo 8 caracteres"
                                            autoComplete="new-password"
                                            required
                                            value={nuevaPassword}
                                            onChange={(e) => setNuevaPassword(e.target.value)}
                                        />
                                        <span className={styles['input-icon']}>
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <rect x="3" y="11" width="18" height="11" rx="2" />
                                                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                            </svg>
                                        </span>
                                        <button
                                            type="button"
                                            className={styles['toggle-pass']}
                                            onClick={() => setShowPassword(!showPassword)}
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                {showPassword ? (
                                                    <>
                                                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                                                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                                                        <line x1="1" y1="1" x2="23" y2="23" />
                                                    </>
                                                ) : (
                                                    <>
                                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                        <circle cx="12" cy="12" r="3" />
                                                    </>
                                                )}
                                            </svg>
                                        </button>
                                    </div>
                                </div>

                                <div className={styles['field-group']}>
                                    <label htmlFor="confirmar-password">Confirmar contraseña</label>
                                    <div className={styles['input-wrap']}>
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            id="confirmar-password"
                                            placeholder="Repetí la contraseña"
                                            autoComplete="new-password"
                                            required
                                            value={confirmarPassword}
                                            onChange={(e) => setConfirmarPassword(e.target.value)}
                                        />
                                        <span className={styles['input-icon']}>
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <rect x="3" y="11" width="18" height="11" rx="2" />
                                                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                            </svg>
                                        </span>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className={styles['btn-login']}
                                    disabled={cargando}
                                    style={{ opacity: cargando ? 0.7 : 1 }}
                                    onClick={handleRipple}
                                >
                                    <span>{cargando ? 'Guardando...' : 'Guardar nueva contraseña'}</span>
                                </button>
                            </form>

                            <p className={styles['register-txt']}>
                                <Link to="/login">← Volver a iniciar sesión</Link>
                            </p>
                        </>
                    )}

                </div>
            </div>
        </div>
    );
}

export default RestablecerPassword;
