import React, { useState, useEffect } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import styles from './Login.module.css';
import AuthHeroPanel from './AuthHeroPanel';
import { API_BASE } from '../../api/config.js';

function Login() {
    const [correo, setCorreo] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Estado para notificaciones
    const [notification, setNotification] = useState({ message: '', type: '' });

    // ─── Recuperar contraseña ───
    // 'login' | 'olvide-correo'. No es una pantalla aparte: reemplaza el contenido del mismo
    // form-card, así queda integrado al mismo panel visual del login. El segundo paso (definir
    // la contraseña nueva) ya no vive acá: llega por el enlace del correo, a /restablecer-password.
    const [vista, setVista] = useState('login');
    const [correoRecuperar, setCorreoRecuperar] = useState('');
    const [cargandoRecuperar, setCargandoRecuperar] = useState(false);
    
    const navigate = useNavigate();
    const location = useLocation();

    // Si llegaste acá desde el carrito, al entrar volvés ahí para terminar
    // la compra. Si entraste directo, seguís a la página principal.
    const destinoTrasIngresar = location.state?.volverA || '/';

    const triggerNotification = (message, type = 'error') => {
        setNotification({ message, type });
        setTimeout(() => setNotification({ message: '', type: '' }), 5000);
    };

    useEffect(() => {
        // 1. Facebook SDK
        if (!document.getElementById('facebook-jssdk')) {
            window.fbAsyncInit = () => {
                window.FB.init({
                    appId: '4263441943966367',
                    cookie: true,
                    xfbml: true,
                    version: 'v13.0'
                });
            };
            const js = document.createElement('script');
            js.id = 'facebook-jssdk';
            js.src = "https://connect.facebook.net/es_LA/sdk.js";
            document.body.appendChild(js);
        }
    }, []);

    const manejarLoginLocal = async (e) => {
        e.preventDefault();
        if (!correo || !password) {
            triggerNotification("Por favor, ingresa tu correo y contraseña.");
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch(`${API_BASE}/login/local`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ correo, password })
            });

            const data = await response.json();

                if (response.ok && data.success) {
                // Guarda el token y los datos del usuario
                localStorage.setItem('token_huellitas', data.token);
                localStorage.setItem('token', data.token);
                localStorage.setItem('usuario_huellitas', JSON.stringify(data.usuario));
                
                // Redirige a la Landing Page
                navigate(destinoTrasIngresar);
            } else {
                triggerNotification(data.mensaje || "Error al iniciar sesión.");
            }
        } catch (error) {
            triggerNotification("Problemas conectando con el servidor. Verifica que tu API en C# esté corriendo.");
        } finally {
            setIsLoading(false);
        }
    };

    // ─── Recuperar contraseña ───
    // POST /api/password/recuperar ahora manda un correo de verdad con el enlace de
    // restablecimiento (antes devolvía el token directo en la respuesta, una posta temporal
    // solo para probar desde Swagger). Por eso ya no hay nada que "continuar" acá: la persona
    // tiene que abrir su correo y hacer clic en el enlace para llegar a /restablecer-password.
    const volverALogin = () => {
        setVista('login');
        setCorreoRecuperar('');
        setNotification({ message: '', type: '' });
    };

    const solicitarRecuperacion = async (e) => {
        e.preventDefault();
        if (!correoRecuperar) {
            triggerNotification('Ingresá tu correo para continuar.');
            return;
        }

        setCargandoRecuperar(true);
        try {
            const res = await fetch(`${API_BASE}/password/recuperar`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ correo: correoRecuperar })
            });
            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                triggerNotification(data.mensaje || 'No se pudo procesar la solicitud.');
                return;
            }

            // Mensaje genérico a propósito: no revela si ese correo existe o no en el sistema.
            triggerNotification(data.mensaje || 'Si el correo está registrado, te enviamos un enlace de verificación.', 'success');
            setCorreoRecuperar('');
        } catch (error) {
            triggerNotification('Problemas conectando con el servidor.');
        } finally {
            setCargandoRecuperar(false);
        }
    };

    const handleGoogleResponse = async (response) => {
        try {
            const res = await fetch(`${API_BASE}/login/google`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: response.credential })
            });
            const data = await res.json();
                if (res.ok && data.success) {
                // Guarda el token y los datos del usuario
                localStorage.setItem('token_huellitas', data.token);
                localStorage.setItem('token', data.token);
                localStorage.setItem('usuario_huellitas', JSON.stringify(data.usuario));
                
                // Redirige a la Landing Page
                navigate(destinoTrasIngresar);
            } else {
                triggerNotification("Error al autenticar: " + (data.mensaje || "Desconocido"));
            }
        } catch (err) {
            triggerNotification("Problemas conectando con el servidor de Google.");
        }
    };

        const handleVincularGoogle = async (response) => {
        try {
            const tokenHuellitas = localStorage.getItem('token_huellitas');

            if (!tokenHuellitas) {
                triggerNotification(
                    "Debes iniciar sesión antes de vincular Google."
                );
                return;
            }

            const res = await fetch(
                `${API_BASE}/login/vincular-google`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${tokenHuellitas}`
                    },
                    body: JSON.stringify({
                        token: response.credential
                    })
                }
            );

            const data = await res.json();

            if (res.ok && data.success) {
                triggerNotification(data.mensaje, 'success');
            } else {
                triggerNotification(
                    data.mensaje || "No fue posible vincular Google."
                );
            }
        } catch (error) {
            console.error(error);

            triggerNotification(
                "No fue posible conectar con el servidor."
            );
        }
    };

    const loginWithFacebook = () => {
        if (!window.FB) {
            triggerNotification("Facebook aún se está cargando, espera un segundo.");
            return;
        }
        window.FB.login(function (response) {
            if (response.authResponse) {
                procesarLoginFacebook(response.authResponse.accessToken);
            }
        }, { scope: 'public_profile,email' });
    };

    const procesarLoginFacebook = async (accessToken) => {
        try {
            const res = await fetch(`${API_BASE}/login/facebook`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: accessToken })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                // Guarda el token y los datos del usuario
                localStorage.setItem('token_huellitas', data.token);                localStorage.setItem('token', data.token);                localStorage.setItem('usuario_huellitas', JSON.stringify(data.usuario));
                
                // Redirige a la Landing Page
                navigate(destinoTrasIngresar);
            } else {
                triggerNotification("Error al autenticar con Facebook: " + (data.mensaje || "Desconocido"));
            }
        } catch (err) {
            triggerNotification("Problemas conectando con el servidor de Facebook.");
        }
    };

    const redirigirPorRol = (rol) => {
        if (rol === 1) navigate('/admin');
        else if (rol === 2) navigate('/veterinario');
        else navigate('/cliente');
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
            
            {/* ═══ PANEL IZQUIERDO (HERO) ═══ */}
            <AuthHeroPanel />

            {/* ═══ PANEL FORMULARIO ═══ */}
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

                    {vista === 'login' && (
                    <>
                    <h2 className={styles['form-heading']}>Bienvenidos a la mejor clínica</h2>
                    <p className={styles['form-sub']}>Ingresa tus datos para continuar</p>

                    <form onSubmit={manejarLoginLocal} noValidate>
                        
                        <div className={styles['field-group']}>
                            <label htmlFor="email">Correo electrónico</label>
                            <div className={styles['input-wrap']}>
                                <input 
                                    type="email" 
                                    id="email" 
                                    placeholder="TuCorreo@mail.com" 
                                    autoComplete="email" 
                                    required 
                                    value={correo}
                                    onChange={(e) => setCorreo(e.target.value)}
                                />
                                <span className={styles['input-icon']}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="2" y="4" width="20" height="16" rx="2" />
                                        <path d="m2 7 10 7 10-7" />
                                    </svg>
                                </span>
                            </div>
                        </div>

                        <div className={styles['field-group']}>
                            <label htmlFor="password">Contraseña</label>
                            <div className={styles['input-wrap']}>
                                <input 
                                    type={showPassword ? "text" : "password"} 
                                    id="password" 
                                    placeholder="••••••••" 
                                    autoComplete="current-password" 
                                    required 
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
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
                                                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                                                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                                                <line x1="1" y1="1" x2="23" y2="23"/>
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

                        <div className={styles['form-extras']}>
                            <label className={styles['custom-check']}>
                                <input type="checkbox" id="remember" />
                                Recordarme
                            </label>
                            <button
                                type="button"
                                className={styles['forgot-link']}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                                onClick={() => { setVista('olvide-correo'); setNotification({ message: '', type: '' }); }}
                            >
                                ¿Olvidaste tu clave?
                            </button>
                        </div>

                        <button 
                            type="submit" 
                            className={styles['btn-login']} 
                            disabled={isLoading} 
                            style={{ opacity: isLoading ? 0.7 : 1 }}
                            onClick={handleRipple}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                                <polyline points="10 17 15 12 10 7" />
                                <line x1="15" y1="12" x2="3" y2="12" />
                            </svg>
                            <span>{isLoading ? 'Cargando...' : 'Iniciar sesión'}</span>
                        </button>
                    </form>

                    <div className={styles['divider']}>o continúa con</div>

                    <div className={styles['social-row']}>
                        <GoogleLogin
                            onSuccess={credentialResponse => {
                                handleGoogleResponse(credentialResponse);
                            }}
                            onError={() => {
                                triggerNotification("Error de autenticación con Google");
                            }}
                            useOneTap={false}
                            type="standard"
                            theme="outline" 
                            size="large"        
                            shape="rectangular"  
                        />

                        <button type="button" className={styles['btn-social']} onClick={loginWithFacebook}>
                            <svg width="18" height="18" viewBox="0 0 24 24">
                                <path fill="#1877F2" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                            </svg>
                            Facebook
                        </button>
                    </div>

                    <p className={styles['register-txt']}>
                        ¿No tienes cuenta? <Link to="/register">Regístrate gratis</Link>
                    </p>
                    </>
                    )}

                    {vista === 'olvide-correo' && (
                        <>
                            <h2 className={styles['form-heading']}>¿Olvidaste tu contraseña?</h2>
                            <p className={styles['form-sub']}>Ingresá tu correo y te ayudamos a restablecerla.</p>

                            <form onSubmit={solicitarRecuperacion} noValidate>
                                <div className={styles['field-group']}>
                                    <label htmlFor="correo-recuperar">Correo electrónico</label>
                                    <div className={styles['input-wrap']}>
                                        <input
                                            type="email"
                                            id="correo-recuperar"
                                            placeholder="TuCorreo@mail.com"
                                            autoComplete="email"
                                            required
                                            value={correoRecuperar}
                                            onChange={(e) => setCorreoRecuperar(e.target.value)}
                                        />
                                        <span className={styles['input-icon']}>
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <rect x="2" y="4" width="20" height="16" rx="2" />
                                                <path d="m2 7 10 7 10-7" />
                                            </svg>
                                        </span>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className={styles['btn-login']}
                                    disabled={cargandoRecuperar}
                                    style={{ opacity: cargandoRecuperar ? 0.7 : 1 }}
                                    onClick={handleRipple}
                                >
                                    <span>{cargandoRecuperar ? 'Enviando...' : 'Continuar'}</span>
                                </button>
                            </form>

                            <p className={styles['register-txt']}>
                                <button
                                    type="button"
                                    className={styles['forgot-link']}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                                    onClick={volverALogin}
                                >
                                    ← Volver a iniciar sesión
                                </button>
                            </p>
                        </>
                    )}

                </div>
            </div>
        </div>
    );
}

export default Login;