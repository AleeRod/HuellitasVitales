import React from 'react';
import styles from './RunningDog.module.css';

const VARIANTS = {
    retriever: {
        body: '#D9A066',
        bodyDark: '#C08A50',
        earShape: 'floppy',
        tailShape: 'long',
    },
    poodle: {
        body: '#EFE9DD',
        bodyDark: '#D8CFBB',
        earShape: 'curly',
        tailShape: 'poof',
    },
    terrier: {
        body: '#5B4636',
        bodyDark: '#43322A',
        earShape: 'pointy',
        tailShape: 'stub',
    },
};

const RunningDog = ({ variant = 'retriever', size = 60, speed = 1, className = '' }) => {
    const cfg = VARIANTS[variant] || VARIANTS.retriever;
    const width = size * 1.7;

    // Duración base de la zancada; más rápido = número menor
    const strideDuration = (0.42 / speed).toFixed(2);
    const bobDuration = (0.42 / speed).toFixed(2);

    const cssVars = {
        '--dog-body': cfg.body,
        '--dog-body-dark': cfg.bodyDark,
        '--stride-duration': `${strideDuration}s`,
        '--bob-duration': `${bobDuration}s`,
    };

    return (
        <div
            className={`${styles.dogRoot} ${className}`}
            style={{ ...cssVars, width, height: size }}
        >
            <svg
                viewBox="0 0 120 70"
                className={styles.dogSvg}
                xmlns="http://www.w3.org/2000/svg"
            >
                <g className={styles.bodyBob}>
                    {/* --- PATAS TRASERAS (detrás del cuerpo) --- */}
                    <g transform="translate(38,42)">
                        <g className={styles.legBackFar}>
                            <rect x="-4" y="0" width="8" height="24" rx="4" fill={cfg.bodyDark} />
                        </g>
                    </g>
                    <g transform="translate(28,42)">
                        <g className={styles.legBackNear}>
                            <rect x="-4" y="0" width="8" height="24" rx="4" fill={cfg.bodyDark} />
                        </g>
                    </g>

                    {/* --- COLA (pivote fijo + grupo animado adentro) --- */}
                    <g transform="translate(20,32)">
                        <g className={styles.tailWag}>
                            {cfg.tailShape === 'poof' ? (
                                <circle cx="-10" cy="-8" r="7" fill={cfg.body} />
                            ) : cfg.tailShape === 'stub' ? (
                                <rect x="-8" y="-4" width="8" height="6" rx="3" fill={cfg.body} />
                            ) : (
                                <path d="M0,0 Q-16,-6 -14,-18" stroke={cfg.body} strokeWidth="5" strokeLinecap="round" fill="none" />
                            )}
                        </g>
                    </g>

                    {/* --- CUERPO --- */}
                    <ellipse cx="55" cy="34" rx="30" ry="15" fill={cfg.body} />

                    {/* --- CABEZA --- */}
                    <g transform="translate(90,24)">
                        {/* Oreja (detrás de la cabeza) */}
                        <g className={styles.earFlop}>
                            {cfg.earShape === 'curly' ? (
                                <circle cx="-2" cy="6" r="7" fill={cfg.bodyDark} />
                            ) : cfg.earShape === 'pointy' ? (
                                <path d="M-6,-2 L2,-14 L6,0 Z" fill={cfg.bodyDark} />
                            ) : (
                                <path d="M-4,-2 Q6,4 0,16 Q-8,10 -4,-2 Z" fill={cfg.bodyDark} />
                            )}
                        </g>

                        <circle cx="0" cy="0" r="13" fill={cfg.body} />
                        {/* Hocico */}
                        <ellipse cx="13" cy="4" rx="8" ry="6" fill={cfg.body} />
                        <circle cx="19" cy="4" r="2" fill="#2B2118" />
                        {/* Ojo */}
                        <circle cx="4" cy="-2" r="1.8" fill="#2B2118" />
                    </g>

                    {/* --- PATAS DELANTERAS (delante del cuerpo) --- */}
                    <g transform="translate(72,42)">
                        <g className={styles.legFrontFar}>
                            <rect x="-4" y="0" width="8" height="24" rx="4" fill={cfg.bodyDark} />
                        </g>
                    </g>
                    <g transform="translate(80,42)">
                        <g className={styles.legFrontNear}>
                            <rect x="-4" y="0" width="8" height="24" rx="4" fill={cfg.bodyDark} />
                        </g>
                    </g>
                </g>
            </svg>
        </div>
    );
};

export default RunningDog;