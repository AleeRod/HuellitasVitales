import React from 'react';
import styles from './Login.module.css';

// Panel izquierdo (mascota + mensaje) compartido por todas las pantallas de autenticación
// (Login y Restablecer contraseña) — se extrajo de Login.jsx para no duplicar este bloque
// (y sus estilos) en cada pantalla nueva del flujo de auth.
const AuthHeroPanel = ({
    titulo = <>Tu mascota merece<br />la mejor <span>atención</span></>,
    subtitulo = <>Accede a fichas clínicas, citas y reportes<br />de salud de tus pacientes en un solo lugar.</>
}) => {
    return (
        <div className={styles['panel-hero']}>
            <div className={styles['hero-badge']}>
                <svg width="10" height="10" viewBox="0 0 10 10">
                    <circle cx="5" cy="5" r="5" fill="#52B788" />
                </svg>
                Clínica Veterinaria
            </div>

            <div className={`${styles['mascot-wrap']} mb-4`}>
                <svg viewBox="0 0 280 300" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <ellipse cx="88" cy="108" rx="36" ry="50" fill="#8B5E3C" transform="rotate(-15 88 108)" />
                    <ellipse cx="192" cy="108" rx="36" ry="50" fill="#8B5E3C" transform="rotate(15 192 108)" />
                    <ellipse cx="88" cy="112" rx="22" ry="34" fill="#c28045" transform="rotate(-15 88 112)" />
                    <ellipse cx="192" cy="112" rx="22" ry="34" fill="#c28045" transform="rotate(15 192 112)" />
                    <ellipse cx="140" cy="155" rx="90" ry="82" fill="#c28045" />
                    <ellipse cx="96" cy="175" rx="22" ry="14" fill="#e09860" opacity=".5" />
                    <ellipse cx="184" cy="175" rx="22" ry="14" fill="#e09860" opacity=".5" />
                    <ellipse cx="112" cy="148" rx="16" ry="18" fill="#fff" />
                    <ellipse cx="168" cy="148" rx="16" ry="18" fill="#fff" />
                    <circle cx="115" cy="150" r="10" fill="#1a1a1a" />
                    <circle cx="171" cy="150" r="10" fill="#1a1a1a" />
                    <circle cx="119" cy="145" r="3.5" fill="#fff" />
                    <circle cx="175" cy="145" r="3.5" fill="#fff" />
                    <ellipse cx="140" cy="185" rx="30" ry="22" fill="#e8c49a" />
                    <ellipse cx="140" cy="174" rx="14" ry="9" fill="#4a2c0a" />
                    <ellipse cx="134" cy="175" rx="3" ry="2" fill="#2a1500" />
                    <ellipse cx="146" cy="175" rx="3" ry="2" fill="#2a1500" />
                    <path d="M 122 192 Q 140 208 158 192" stroke="#4a2c0a" strokeWidth="3" strokeLinecap="round" fill="none" />
                    <ellipse cx="140" cy="255" rx="72" ry="52" fill="#c28045" />
                    <ellipse cx="96" cy="282" rx="24" ry="18" fill="#b87030" />
                    <ellipse cx="184" cy="282" rx="24" ry="18" fill="#b87030" />
                    <ellipse cx="82" cy="293" rx="8" ry="6" fill="#a06028" />
                    <ellipse cx="96" cy="297" rx="8" ry="6" fill="#a06028" />
                    <ellipse cx="110" cy="293" rx="8" ry="6" fill="#a06028" />
                    <ellipse cx="170" cy="293" rx="8" ry="6" fill="#a06028" />
                    <ellipse cx="184" cy="297" rx="8" ry="6" fill="#a06028" />
                    <ellipse cx="198" cy="293" rx="8" ry="6" fill="#a06028" />
                    <rect x="130" cy="247" y="244" width="20" height="7" rx="3" fill="rgba(255,255,255,.35)" />
                    <rect x="136.5" y="237.5" width="7" height="20" rx="3" fill="rgba(255,255,255,.35)" />
                    <path d="M 208 240 Q 255 210 248 170 Q 242 150 230 160" stroke="#b87030" strokeWidth="18" strokeLinecap="round" fill="none" />
                </svg>
            </div>

            <h1 className={styles['hero-title']}>{titulo}</h1>
            <p className={styles['hero-sub']}>{subtitulo}</p>

            <div className={styles['dots-grid']}>
                <span></span><span></span><span></span><span></span><span></span><span></span>
                <span></span><span></span><span></span><span></span><span></span><span></span>
                <span></span><span></span><span></span><span></span><span></span><span></span>
                <span></span><span></span><span></span><span></span><span></span><span></span>
            </div>
        </div>
    );
};

export default AuthHeroPanel;
