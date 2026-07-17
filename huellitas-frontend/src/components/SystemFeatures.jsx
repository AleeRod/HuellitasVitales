import React, { useState } from 'react';

const SystemFeatures = () => {
  const [activeFeature, setActiveFeature] = useState(0);

  const features = [
    {
      title: "Buscador de Productos",
      desc: "Filtra en el Marketplace de alimentos, medicinas y accesorios de forma instantánea. Compra de forma enlazada con tu clínica.",
      screen: (
        <div className="screen-mockup-app">
          <div className="app-header-mock">🛒 Marketplace Huellitas</div>
          <div className="app-body-mock">
            <div className="search-bar-mock">
              🔍 Buscar 'Desparasitante'...
            </div>
            <div className="grid-items-mock">
              <div className="mock-shop-item anim-pop">💊 Antipulgas ($14)</div>
              <div className="mock-shop-item anim-pop" style={{ animationDelay: '0.1s' }}>🥩 Alimento S ($42)</div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Notificaciones Clínicas",
      desc: "Alertas tempranas de vacunas programadas, citas agendadas y recordatorios de desparasitaciones directo en tu perfil.",
      screen: (
        <div className="screen-mockup-app">
          <div className="app-header-mock">🔔 Centro de Notificaciones</div>
          <div className="app-body-mock">
            <div className="notification-item-mock urgent anim-slide-in">
              <strong>⚠️ Urgente:</strong> Mañana vacuna Rabia para Toby.
            </div>
            <div className="notification-item-mock anim-slide-in" style={{ animationDelay: '0.1s' }}>
              ✅ Cita confirmada con Dra. Andrea.
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Múltiples Mascotas",
      desc: "Registra diferentes mascotas. Cada uno tendrá su perfil independiente con historial de peso, vacunas y recetas.",
      screen: (
        <div className="screen-mockup-app">
          <div className="app-header-mock">🐾 Mis Mascotas (3)</div>
          <div className="app-body-mock">
            <div className="pet-list-mock">
              <div className="pet-row-mock anim-slide-in">🦮 Toby (Golden Retriever)</div>
              <div className="pet-row-mock anim-slide-in" style={{ animationDelay: '0.1s' }}>🐈 Luna (Siamés)</div>
              <div className="pet-row-mock anim-slide-in" style={{ animationDelay: '0.2s' }}>🐇 Tambor (Conejo)</div>
            </div>
          </div>
        </div>
      )
    }
  ];

  return (
    <section className="features-tour-section" id="funciones">
      <div className="tour-container">
        
        <div className="tour-visual-side">
          <div className="desktop-frame-mockup">
            <div className="desktop-header-buttons">
              <span className="dot red"></span>
              <span className="dot yellow"></span>
              <span className="dot green"></span>
            </div>
            <div className="desktop-screen-content">
              {features[activeFeature].screen}
            </div>
          </div>
        </div>

        <div className="tour-text-side">
          <div className="badge-clean">Explora la Plataforma</div>
          <h2 className="title-clean">Un recorrido por tu <span>portal de salud</span></h2>
          <p className="desc-clean" style={{ marginBottom: '2.5rem' }}>
            Diseñamos funciones pensadas para facilitar la administración y el bienestar diario de tus mascotas. Pasa el cursor sobre cada función para ver una muestra en vivo:
          </p>

          <div className="process-timeline">
            {features.map((item, index) => (
              <div 
                key={index} 
                className={`timeline-item-interactive ${activeFeature === index ? 'active' : ''}`}
                onMouseEnter={() => setActiveFeature(index)}
              >
                <div className="timeline-number">0{index + 1}</div>
                <div className="timeline-text">
                  <h3>{item.title}</h3>
                  <p>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};

export default SystemFeatures;