import React, { useEffect, useState } from 'react';
import styles from './Toast.module.css';

const ICONS = {
    success: (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),
    error: (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),
    warning: (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a1 1 0 00.87 1.5h18.62a1 1 0 00.87-1.5L13.71 3.86a1 1 0 00-1.72 0z"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),
    info: (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 16v-4M12 8h.01" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
        </svg>
    ),
};

const TITLES = {
    success: 'Listo',
    error: 'Algo salió mal',
    warning: 'Revisa esto',
    info: 'Aviso',
};

const Toast = ({ message, type = 'info', duration = 4000, onClose }) => {
    const [closing, setClosing] = useState(false);

    useEffect(() => {
        const closeTimer = setTimeout(() => setClosing(true), duration);
        return () => clearTimeout(closeTimer);
    }, [duration]);

    useEffect(() => {
        if (!closing) return;
        const removeTimer = setTimeout(() => onClose && onClose(), 250); // espera la animación de salida
        return () => clearTimeout(removeTimer);
    }, [closing, onClose]);

    return (
        <div
            className={`${styles.toast} ${styles[type]} ${closing ? styles.closing : ''}`}
            role="alert"
            aria-live="assertive"
        >
            <div className={styles.iconWrap}>{ICONS[type] || ICONS.info}</div>

            <div className={styles.body}>
                <p className={styles.title}>{TITLES[type] || TITLES.info}</p>
                <p className={styles.message}>{message}</p>
            </div>

            <button
                type="button"
                className={styles.closeBtn}
                aria-label="Cerrar notificación"
                onClick={() => setClosing(true)}
            >
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
            </button>

            <span className={styles.progress} style={{ animationDuration: `${duration}ms` }} />
        </div>
    );
};

export const ToastContainer = ({ toasts, removeToast }) => {
    return (
        <div className={styles.container}>
            {toasts.map((t) => (
                <Toast
                    key={t.id}
                    message={t.message}
                    type={t.type}
                    duration={t.duration}
                    onClose={() => removeToast(t.id)}
                />
            ))}
        </div>
    );
};

export default Toast;