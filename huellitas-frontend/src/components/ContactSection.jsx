import React, { useState } from 'react';

const ContactSection = () => {
  const [formValues, setFormValues] = useState({ name: '', email: '', message: '' });
  const [focusFields, setFocusFields] = useState({ name: false, email: false, message: false });

  const handleFocus = (field) => setFocusFields({ ...focusFields, [field]: true });
  
  const handleBlur = (field, val) => {
    if (val.trim() === "") setFocusFields({ ...focusFields, [field]: false });
  };

  const handleChange = (field, e) => setFormValues({ ...formValues, [field]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    alert("Mensaje enviado. Nuestro equipo se pondrá en contacto pronto.");
    setFormValues({ name: '', email: '', message: '' });
  };

  return (
    <section className="contact-section" id="contacto">
      <div className="contact-container">
        
        <div className="contact-info-side">
          <div className="badge-clean">Soporte y Ventas</div>
          <h2 className="title-clean">¿Necesitas ayuda? <span>Hablemos</span></h2>
          <p className="desc-clean">
            Nuestro equipo técnico y asesor está disponible para resolver dudas sobre implementaciones en clínicas, integraciones de software o soporte general.
          </p>

          <div className="contact-details-cards" style={{ marginTop: '2.5rem' }}>
            <div className="contact-item-card glow-on-hover">
              <span className="card-glow-dot"></span>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--pine)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
              <div>
                <h4>Soporte Técnico</h4>
                <p>soporte@huellitasvitales.com</p>
              </div>
            </div>
            <div className="contact-item-card glow-on-hover">
              <span className="card-glow-dot"></span>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--pine)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.27 2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 6 6l.92-.92a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.72 16z"></path></svg>
              <div>
                <h4>Atención Telefónica</h4>
                <p>+506 4000-8888</p>
              </div>
            </div>
          </div>
        </div>

        <div className="contact-form-side">
          <form className="landing-contact-form" onSubmit={handleSubmit}>
            <div className={`floating-group ${focusFields.name || formValues.name ? 'active' : ''}`}>
              <label htmlFor="form-name">Nombre Completo</label>
              <input type="text" id="form-name" value={formValues.name} onChange={(e) => handleChange('name', e)} onFocus={() => handleFocus('name')} onBlur={(e) => handleBlur('name', e.target.value)} required />
            </div>

            <div className={`floating-group ${focusFields.email || formValues.email ? 'active' : ''}`}>
              <label htmlFor="form-email">Correo Institucional / Personal</label>
              <input type="email" id="form-email" value={formValues.email} onChange={(e) => handleChange('email', e)} onFocus={() => handleFocus('email')} onBlur={(e) => handleBlur('email', e.target.value)} required />
            </div>

            <div className={`floating-group ${focusFields.message || formValues.message ? 'active' : ''}`}>
              <label htmlFor="form-message">Describe tu consulta</label>
              <textarea id="form-message" rows="4" value={formValues.message} onChange={(e) => handleChange('message', e)} onFocus={() => handleFocus('message')} onBlur={(e) => handleBlur('message', e.target.value)} required ></textarea>
            </div>

            <button type="submit" className="btn-solid">
              Enviar Mensaje
            </button>
          </form>
        </div>

      </div>
    </section>
  );
};

export default ContactSection;