import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import DogNav from '../../components/DogNav/DogNav';
import { API_BASE } from '../../api/config';
import styles from './Perfil.module.css';

// Mapa de roles para mostrar una etiqueta legible
const ROLES = {
    1: 'Administrador',
    2: 'Veterinario',
    3: 'Cliente'
};

const ESTADOS_CUENTA = {
    1: { label: 'Activa', clase: 'estadoActiva' },
    2: { label: 'Invitada', clase: 'estadoInvitada' },
    3: { label: 'Suspendida', clase: 'estadoSuspendida' }
};

// Genera las iniciales a partir del nombre y apellidos
const obtenerIniciales = (nombre = '', apellidos = '') => {
    const a = nombre.trim()[0] || '';
    const b = apellidos.trim()[0] || '';
    return (a + b).toUpperCase() || '👤';
};

const Perfil = () => {
    // El id puede venir por la URL (/perfil/5); si no, se toma el del usuario
    // logueado guardado en localStorage, con 1 como valor de respaldo.
    const { id: idParam } = useParams();
    const idUsuario = idParam || localStorage.getItem('idUsuario') || 1;

    const [perfil, setPerfil] = useState(null);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        let activo = true;

        const cargarPerfil = async () => {
            setCargando(true);
            setError(false);
            try {
                const res = await fetch(`${API_BASE}/usuario/${idUsuario}`);
                if (!res.ok) throw new Error('No se pudo obtener el perfil');

                const data = await res.json();
                if (activo) setPerfil(data);
            } catch {
                if (activo) setError(true);
            } finally {
                if (activo) setCargando(false);
            }
        };

        cargarPerfil();
        return () => { activo = false; };
    }, [idUsuario]);

    const estado = perfil ? (ESTADOS_CUENTA[perfil.idEstadoCuenta] || ESTADOS_CUENTA[1]) : null;

    return (
        <>
            <DogNav />

            <main className={styles.layout}>
                <div className={styles.container}>

                    {/* --- TARJETA DE CABECERA --- */}
                    <section className={styles.cover}>
                        <div className={styles.coverBanner} />

                        <div className={styles.identity}>
                            {cargando ? (
                                <div className={`${styles.avatar} ${styles.skeleton}`} />
                            ) : (
                                <div className={styles.avatar}>
                                    {perfil ? obtenerIniciales(perfil.nombre, perfil.apellidos) : '👤'}
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

                    {/* --- ESTADO DE ERROR --- */}
                    {error && !cargando && (
                        <div className={styles.errorBox}>
                            <span className={styles.errorIcon}>⚠️</span>
                            <p>No pudimos cargar la información del perfil. Inténtalo más tarde.</p>
                        </div>
                    )}

                    {/* --- INFORMACIÓN PERSONAL --- */}
                    {!error && (
                        <section className={styles.infoCard}>
                            <h2 className={styles.sectionTitle}>Información personal</h2>

                            <div className={styles.infoGrid}>
                                <Campo etiqueta="Nombre" valor={perfil?.nombre} cargando={cargando} icono="🧑" />
                                <Campo etiqueta="Apellidos" valor={perfil?.apellidos} cargando={cargando} icono="🪪" />
                                <Campo etiqueta="Correo electrónico" valor={perfil?.correo} cargando={cargando} icono="✉️" />
                                <Campo etiqueta="Teléfono" valor={perfil?.telefono || 'No registrado'} cargando={cargando} icono="📞" />
                                <Campo etiqueta="Método de acceso" valor={perfil?.proveedor} cargando={cargando} icono="🔐" />
                                <Campo
                                    etiqueta="Miembro desde"
                                    valor={perfil ? new Date(perfil.fechaRegistro).toLocaleDateString('es-CR', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}
                                    cargando={cargando}
                                    icono="📅"
                                />
                            </div>
                        </section>
                    )}
                </div>
            </main>
        </>
    );
};

// Fila reutilizable de dato: muestra un skeleton mientras carga
const Campo = ({ etiqueta, valor, cargando, icono }) => (
    <div className={styles.campo}>
        <span className={styles.campoIcon}>{icono}</span>
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
