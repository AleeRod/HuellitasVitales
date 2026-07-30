import React, { useEffect, useRef, useState } from 'react';
import DogNav from '../../components/DogNav/DogNav';
import { useDebounce } from '../../hooks/useDebounce';
import { API_BASE } from '../../api/config';
import styles from './Marketplace.module.css';

// Estados posibles de la UI de búsqueda
const ESTADO = {
    INACTIVO: 'inactivo',   // aún no se ha buscado nada
    CARGANDO: 'cargando',
    OK: 'ok',
    VACIO: 'vacio',
    ERROR: 'error'
};

// Etiqueta y emoji según el tipo de comercio (1 = Veterinaria, 2 = Almacén)
const TIPO_COMERCIO = {
    1: { label: 'Veterinaria', icon: '🩺' },
    2: { label: 'Almacén', icon: '🛍️' }
};

const Marketplace = () => {
    const [termino, setTermino] = useState('');
    const [resultados, setResultados] = useState([]);
    const [estado, setEstado] = useState(ESTADO.INACTIVO);
    // Se incrementa para forzar una nueva búsqueda (botón "Reintentar")
    const [reintento, setReintento] = useState(0);

    // El término solo "viaja" al backend 400 ms después de dejar de escribir
    const terminoDebounced = useDebounce(termino, 400);

    // Guardamos el controlador para cancelar peticiones que quedaron obsoletas
    const abortRef = useRef(null);

    useEffect(() => {
        const q = terminoDebounced.trim();

        // Sin texto -> volvemos al estado inicial y limpiamos resultados
        if (q === '') {
            setResultados([]);
            setEstado(ESTADO.INACTIVO);
            return;
        }

        // Cancela la búsqueda anterior si todavía estaba en curso
        if (abortRef.current) abortRef.current.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        const buscar = async () => {
            setEstado(ESTADO.CARGANDO);
            try {
                const res = await fetch(
                    `${API_BASE}/comercio/buscar?q=${encodeURIComponent(q)}`,
                    { signal: controller.signal }
                );

                if (!res.ok) throw new Error('Respuesta no válida del servidor');

                const data = await res.json();
                setResultados(data);
                setEstado(data.length === 0 ? ESTADO.VACIO : ESTADO.OK);
            } catch (error) {
                // Ignoramos los aborts (son cancelaciones intencionales, no errores)
                if (error.name === 'AbortError') return;
                setEstado(ESTADO.ERROR);
            }
        };

        buscar();

        return () => controller.abort();
    }, [terminoDebounced, reintento]);

    return (
        <>
            <DogNav />

            <main className={styles.layout}>
                <div className={styles.container}>
                    <header className={styles.head}>
                        <span className={styles.badge}>🛒 Marketplace</span>
                        <h1 className={styles.title}>Explora nuestros comercios</h1>
                        <p className={styles.subtitle}>
                            Veterinarias y tiendas afiliadas a Huellitas Vitales.
                        </p>
                    </header>

                    {/* Barra de búsqueda */}
                    <div className={styles.searchBar}>
                        <span className={styles.searchIcon} aria-hidden="true">🔎</span>
                        <input
                            type="text"
                            className={styles.searchInput}
                            placeholder="Busca por nombre del comercio..."
                            value={termino}
                            onChange={(e) => setTermino(e.target.value)}
                            autoFocus
                        />
                        {estado === ESTADO.CARGANDO && <span className={styles.spinner} aria-label="Cargando" />}
                    </div>

                    {/* Resultados / Estados de UI */}
                    <section className={styles.results} aria-live="polite">

                        {estado === ESTADO.INACTIVO && (
                            <div className={styles.hint}>
                                <span className={styles.hintIcon}>🐾</span>
                                <p>Empieza a escribir para descubrir comercios.</p>
                            </div>
                        )}

                        {estado === ESTADO.CARGANDO && (
                            <ul className={styles.grid}>
                                {[...Array(4)].map((_, i) => (
                                    <li key={i} className={`${styles.card} ${styles.cardSkeleton}`}>
                                        <div className={styles.skelIcon} />
                                        <div className={styles.skelLineLg} />
                                        <div className={styles.skelLineSm} />
                                    </li>
                                ))}
                            </ul>
                        )}

                        {estado === ESTADO.VACIO && (
                            <div className={styles.stateBox}>
                                <span className={styles.stateIcon}>🔍</span>
                                <h3>Sin resultados</h3>
                                <p>No encontramos comercios que coincidan con “{terminoDebounced.trim()}”.</p>
                            </div>
                        )}

                        {estado === ESTADO.ERROR && (
                            <div className={`${styles.stateBox} ${styles.stateError}`}>
                                <span className={styles.stateIcon}>⚠️</span>
                                <h3>Error de conexión</h3>
                                <p>No pudimos contactar al servidor. Revisa tu conexión e inténtalo de nuevo.</p>
                                <button className={styles.retryBtn} onClick={() => setReintento((n) => n + 1)}>
                                    Reintentar
                                </button>
                            </div>
                        )}

                        {estado === ESTADO.OK && (
                            <ul className={styles.grid}>
                                {resultados.map((c) => {
                                    const tipo = TIPO_COMERCIO[c.idTipoComercio] || { label: 'Comercio', icon: '🏪' };
                                    return (
                                        <li key={c.idComercio} className={styles.card}>
                                            <div className={styles.cardIcon}>{tipo.icon}</div>
                                            <div className={styles.cardBody}>
                                                <h3 className={styles.cardTitle}>{c.nombreComercial}</h3>
                                                <span className={styles.cardTag}>{tipo.label}</span>
                                                {c.direccion && <p className={styles.cardMeta}>📍 {c.direccion}</p>}
                                                {c.telefono && <p className={styles.cardMeta}>📞 {c.telefono}</p>}
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </section>
                </div>
            </main>
        </>
    );
};

export default Marketplace;
