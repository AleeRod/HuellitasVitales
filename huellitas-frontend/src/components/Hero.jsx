import React from 'react';
import { Link } from 'react-router-dom';
import ModernDog from './ModernDog';

const Hero = () => {
  return (
    <header className="hero-section">
      <div className="hero-content">
        <div className="hero-badge">Clínica Veterinaria Digital</div>
        <h1 className="hero-title">
          Cuidamos a tus mejores amigos como si fueran <span>nuestros.</span>
        </h1>
        <p className="hero-text">
          Bienvenido a Huellitas Vitales, tu portal de autogestión veterinaria. 
          Agenda citas, revisa el historial clínico de tus mascotas y lleva el control 
          de sus vacunas desde la comodidad de tu hogar.
        </p>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'flex-start' }}>
          <Link to="/register" className="btn-solid" style={{ fontSize: '1.1rem', padding: '0.9rem 2.2rem' }}>
            Comenzar ahora
          </Link>
          <Link to="/login" className="btn-outline" style={{ fontSize: '1.1rem', padding: '0.9rem 2.2rem' }}>
            Ya tengo cuenta
          </Link>
        </div>
      </div>

      <div className="hero-image-container">
        <div className="hero-interactive-wrapper">
          <div className="hero-image-blob"></div>
          
          {/* EL CONTENEDOR MÁGICO CON EL NUEVO PERRITO */}
          <div className="hero-dog-container">
             <ModernDog />
          </div>

          <div className="floating-badge-hero badge-left">
            <div className="icon-box medical">🩺</div>
            <div className="badge-content">
              <span className="badge-label">Historial</span>
              <span className="badge-value">Digital</span>
            </div>
          </div>

          <div className="floating-badge-hero badge-right">
            <div className="icon-box clinic">⭐</div>
            <div className="badge-content">
              <span className="badge-label">Top</span>
              <span className="badge-value">Clínica</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Hero;