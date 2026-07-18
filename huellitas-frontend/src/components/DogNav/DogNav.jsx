import React from 'react';
import { useNavigate } from 'react-router-dom';
import RunningDog from '../DogNav/RunningDog';
import styles from './DogNav.module.css';

const DogNav = () => {
    const navigate = useNavigate();

    return (
        <nav className={styles.navContainer}>
            <button onClick={() => navigate('/')} className={styles.backBtn}>
                <span className={styles.backArrow}>←</span> Volver
            </button>

            <div className={styles.track}>
                <div className={styles.grassLine}></div>

                {/* Perro 1: Golden persiguiendo la pelota */}
                <div className={`${styles.dogWrapper} ${styles.dog1}`}>
                    <RunningDog variant="retriever" size={46} speed={1} />
                    <span className={styles.ball}>🎾</span>
                </div>

                {/* Perro 2: Poodle que va saltando */}
                <div className={`${styles.dogWrapper} ${styles.dog2}`}>
                    <div className={styles.jumpInner}>
                        <RunningDog variant="poodle" size={50} speed={1.1} />
                    </div>
                </div>

                {/* Perro 3: El chiquito corriendo rápido atrás */}
                <div className={`${styles.dogWrapper} ${styles.dog3}`}>
                    <RunningDog variant="terrier" size={32} speed={1.6} />
                </div>
            </div>
        </nav>
    );
};

export default DogNav;