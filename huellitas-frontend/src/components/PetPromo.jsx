import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Dog } from 'lucide-react';

const PetPromo = () => {
  const navigate = useNavigate();

  const handleRegisterClick = (e) => {
    e.preventDefault();
    navigate('/register', {
      state: {
        infoMessage: "¡Para registrar a tu mascota y su expediente, primero debes crear tu cuenta de dueño!"
      }
    });
  };

  return (
    <section className="pet-promo-section" id="registro-mascota">
      <div className="pet-promo-container">
        <div className="pet-promo-visual">
          <div className="pet-id-card-mockup">
            <div className="pet-id-card-pattern"></div>

            <div className="pet-id-header">
              <span className="pet-id-title">Carné Digital Inteligente</span>
              <span className="pet-id-status">
                Verificado
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ marginLeft: '4px' }}>
                  <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
            </div>

            <div className="pet-id-body">
              <div className="pet-id-avatar-clean anim-breathe" style={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  background: '#fdf0dc',
                  width: '65px',
                  height: '65px',
                  borderRadius: '50%',
                  margin: '0 auto 15px auto',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
              }}>
                <Dog size={35} color="#3d2b1f" strokeWidth={1.5} />
              </div>

              <div className="pet-id-details">
                <h3>Max (Golden Retriever)</h3>
                <p><strong>Dueño:</strong> Javier Powers</p>
                <p><strong>Nacimiento:</strong> 14/05/2021</p>
              </div>
            </div>

            <div className="pet-id-footer">
              <span className="pet-id-barcode">|| | ||| | || ||| | ||</span>
              <span className="pet-id-qr-hint">QR</span>
            </div>
          </div>

          <div className="pet-badge-floating">
            <span className="anim-float-emoji" style={{ fontSize: '1.4rem' }}>🐾</span>
            <div>
              <strong>+500</strong>
              <span>Mascotas Felices</span>
            </div>
          </div>
        </div>

        <div className="pet-promo-text">
          <span className="badge-clean">Para dueños de mascotas</span>
          <h2 className="title-clean">
            Dale a tu mejor amigo un <span>Expediente Digital</span>
          </h2>
          <p className="desc-clean">
            Registra a tus mascotas en segundos y lleva contigo todo su historial médico,
            control de peso, próximas vacunas y recetas digitales. Nunca más perderás
            una cartilla de vacunación física.
          </p>

          <ul className="pet-benefits-list">
            <li><span className="benefit-check">✔</span> Recordatorios de desparasitación automáticos.</li>
            <li><span className="benefit-check">✔</span> Carné digital QR.</li>
            <li><span className="benefit-check">✔</span> Vinculación directa con veterinarios verificados.</li>
          </ul>

          <div className="pet-action-wrapper">
            <button onClick={handleRegisterClick} className="btn-solid btn-register">
              <span className="anim-float-emoji" style={{ fontSize: '1.1rem' }}>✨</span>
              &nbsp;Crear Perfil de Mascota Gratis
            </button>
            <span className="action-hint">Serás redirigido a crear tu cuenta principal primero.</span>
          </div>
        </div>

      </div>
    </section>
  );
};

export default PetPromo;