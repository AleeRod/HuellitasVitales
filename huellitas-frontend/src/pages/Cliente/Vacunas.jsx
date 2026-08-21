import React from 'react';
import { Syringe } from 'lucide-react';

import ClienteLayout from '../../components/Cliente/ClienteLayout/ClienteLayout';

const Vacunas = () => (
  <ClienteLayout activo="vacunas">
    <section className="dashboard-grid" style={{ gridTemplateColumns: '1fr' }}>
      <div className="content-card">
        <div className="card-head">
          <div>
            <h2 className="card-title">Vacunas</h2>
            <p className="card-subtitle">Calendario de vacunación de tus mascotas.</p>
          </div>
        </div>

        <div className="appointment-list">
          <div className="appointment" style={{ display: 'block', textAlign: 'center', padding: '3rem 1rem' }}>
            <Syringe size={48} style={{ color: '#dde3d8', marginBottom: '1rem' }} />
            <strong style={{ color: '#718096' }}>Próximamente</strong>
            <p style={{ color: '#cbd5e0', fontSize: '.9rem', marginTop: '.5rem' }}>
              El control de vacunas todavía no está disponible en la plataforma. Cuando esté
              listo, vas a poder ver acá el registro de vacunación de cada mascota.
            </p>
          </div>
        </div>
      </div>
    </section>
  </ClienteLayout>
);

export default Vacunas;
