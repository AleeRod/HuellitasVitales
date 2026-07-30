import React from 'react';
import { useNavigate } from 'react-router-dom';

const CommercePromo = () => {
  const navigate = useNavigate();

  return (
    <section className="commerce-promo-section" id="comercios">
      <div className="commerce-promo-container">
        
        <div className="commerce-promo-content">
          <div className="badge-clean">Para Veterinarias y Almacenes</div>
          <h2 className="title-clean">Gestión integral para tu negocio</h2>
          <p className="desc-clean">
            Huellitas Vitales ofrece una infraestructura robusta para administrar clínicas y puntos de venta. 
            Centraliza tu operación, valida tu marca y gestiona a tu personal desde un entorno profesional.
          </p>

          <button 
            onClick={() => navigate('/SolicitudComercio')} 
            className="btn-solid"
            style={{ marginTop: '2.5rem' }}
          >
            Enviar Solicitud
          </button>
          
        </div>

        <div className="commerce-promo-visual">
          <div className="process-timeline">
            <div className="timeline-item">
              <div className="timeline-number">01</div>
              <div className="timeline-text">
                <h3>Registro de Entidad</h3>
                <p>Ingresa los datos legales de tu clínica o almacén veterinario.</p>
              </div>
            </div>
            
            <div className="timeline-item">
              <div className="timeline-number">02</div>
              <div className="timeline-text">
                <h3>Validación Administrativa</h3>
                <p>Revisamos tu solicitud para garantizar la seguridad de nuestra red.</p>
              </div>
            </div>
            
            <div className="timeline-item">
              <div className="timeline-number">03</div>
              <div className="timeline-text">
                <h3>Control Operativo</h3>
                <p>Acceso total: gestiona funcionarios, inventarios y citas de forma ilimitada.</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default CommercePromo;