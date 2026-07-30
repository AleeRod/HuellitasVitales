import React, { useState } from 'react';

const Services = () => {
  const [activeTab, setActiveTab] = useState(0);

  const servicesData = [
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
      ),
      title: "Consulta Médica Digital",
      desc: "Agenda citas en tiempo real con veterinarios certificados. Selecciona el especialista idóneo para tu mascota y recibe el diagnóstico directo en tu perfil.",
      preview: (
        <div className="mock-preview-card">
          <div className="mock-preview-header" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
            Cita Confirmada
          </div>
          <div className="mock-preview-body">
            <p><strong>Paciente:</strong> Toby (Golden Retriever)</p>
            <p><strong>Especialista:</strong> Dra. Andrea Salazar</p>
            <p><strong>Fecha:</strong> Mañana, 10:00 AM</p>
            <span className="mock-status-pill green">Confirmada</span>
          </div>
        </div>
      )
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 2 4 4"/><path d="m17 7 3-3"/><path d="M19 9 8.7 19.3c-1 1-2.5 1-3.4 0l-.6-.6c-1-1-1-2.5 0-3.4L15 5"/><path d="m9 11 4 4"/><path d="m5 19-3 3"/><path d="m14 4 6 6"/></svg>
      ),
      title: "Carné de Vacunación Activo",
      desc: "Lleva el historial de vacunas y desparasitaciones digitalizado de forma cronológica. El sistema detecta y calcula las fechas de tus próximos refuerzos.",
      preview: (
        <div className="mock-preview-card">
          <div className="mock-preview-header" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m18 2 4 4"/><path d="m17 7 3-3"/></svg>
            Vacunación Toby
          </div>
          <div className="mock-preview-body">
            <p><strong>Parvovirus:</strong> Aplicada (Ok)</p>
            <p><strong>Rabia:</strong> Refuerzo pendiente</p>
            <p><strong>Siguiente dosis:</strong> 25 de Agosto</p>
            <span className="mock-status-pill yellow">Refuerzo Pendiente</span>
          </div>
        </div>
      )
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
      ),
      title: "Historial Médico Unificado",
      desc: "Todos los diagnósticos, laboratorios, radiografías y recetas emitidas por los médicos quedan unificados bajo el mismo perfil, listos para descargar.",
      preview: (
        <div className="mock-preview-card">
          <div className="mock-preview-header" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16h12a2 2 0 0 0 2-2V8z"/></svg>
            Receta Médica #4029
          </div>
          <div className="mock-preview-body">
            <p><strong>Medicamento:</strong> Amoxi-Pet 250mg</p>
            <p><strong>Dosis:</strong> 1 tableta cada 12 horas</p>
            <p><strong>Duración:</strong> 7 días calendario</p>
            <span className="mock-status-pill blue">Historial Médico</span>
          </div>
        </div>
      )
    }
  ];

  return (
    <section className="services-showcase-section" id="servicios">
      <div className="showcase-container">
        <div className="showcase-text-side">
          <div className="badge-clean">Nuestra Oferta Principal</div>
          <h2 className="title-clean">Una experiencia médica <span>diseñada con amor</span></h2>
          <p className="desc-clean" style={{ marginBottom: '2.5rem' }}>
            Olvídate de los expedientes de papel. Nuestra suite digital unifica todos los servicios esenciales en un espacio acogedor y fácil de utilizar.
          </p>

          <div className="showcase-menu">
            {servicesData.map((item, index) => (
              <button 
                key={index} 
                className={`showcase-menu-btn ${activeTab === index ? 'active' : ''}`}
                onMouseEnter={() => setActiveTab(index)}
                onClick={() => setActiveTab(index)}
              >
                <span className="showcase-btn-icon">{item.icon}</span>
                <div className="showcase-btn-text">
                  <h3>{item.title}</h3>
                  <p>{item.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="showcase-visual-side">
          <div className="showcase-preview-wrapper">
            <div className="showcase-preview-circle-deco"></div>
            <div className="showcase-preview-active-card">
              {servicesData[activeTab].preview}
            </div>
            <div className="showcase-interactive-info">
              <h4>{servicesData[activeTab].title}</h4>
              <p>{servicesData[activeTab].desc}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Services;