import React, { useState, useEffect } from 'react';
import { PawPrint, Stethoscope, Paperclip, AlertTriangle, Clock } from 'lucide-react';

import ClienteLayout from '../../components/Cliente/ClienteLayout/ClienteLayout';
import { API_BASE } from '../../api/config';
import { ToastContainer } from '../../components/Toast/Toast';
import { useToast } from '../../components/Toast/useToast';

const Reportes = () => {
  const [reporte, setReporte] = useState(null);
  const [cargando, setCargando] = useState(true);
  const { toasts, showToast, removeToast } = useToast();

  const cargarReporte = async () => {
    const token = localStorage.getItem('token_huellitas') || localStorage.getItem('jwt') || localStorage.getItem('token');
    if (!token) return;

    try {
      setCargando(true);
      const res = await fetch(`${API_BASE}/reporte/resumen`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.mensaje || 'No se pudo cargar el reporte.');
      setReporte(data.reporte);
    } catch (error) {
      console.error(error);
      showToast(error.message || 'Error al cargar el reporte.', 'error');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarReporte();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatFecha = (fechaISO) => {
    if (!fechaISO) return 'No tenés citas programadas todavía.';
    return new Date(fechaISO).toLocaleDateString('es-CR', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  return (
    <ClienteLayout activo="reportes">
      {cargando && (
        <section className="dashboard-grid" style={{ gridTemplateColumns: '1fr' }}>
          <div className="content-card">Cargando reporte…</div>
        </section>
      )}

      {!cargando && reporte && (
        <>
          <section className="stats-grid">
            <article className="stat-card">
              <div className="stat-icon"><PawPrint size={24} color="#52B788" /></div>
              <div className="stat-label">Mascotas registradas</div>
              <div className="stat-number">{reporte.totalMascotas}</div>
              <div className="stat-note">Perros y gatos asociados a tu cuenta</div>
            </article>

            <article className="stat-card">
              <div className="stat-icon"><Stethoscope size={24} color="#52B788" /></div>
              <div className="stat-label">Citas completadas</div>
              <div className="stat-number">{reporte.citasCompletadas}</div>
              <div className="stat-note">{reporte.citasPendientes} pendientes</div>
            </article>

            <article className="stat-card">
              <div className="stat-icon"><Paperclip size={24} color="#52B788" /></div>
              <div className="stat-label">Atenciones externas</div>
              <div className="stat-number">{reporte.atencionesExternasRegistradas}</div>
              <div className="stat-note">Registradas por vos</div>
            </article>

            <article className="stat-card">
              <div className="stat-icon"><AlertTriangle size={24} color="#52B788" /></div>
              <div className="stat-label">Emergencias solicitadas</div>
              <div className="stat-number">{reporte.emergenciasSolicitadas}</div>
              <div className="stat-note">Desde que te uniste a Huellitas Vitales</div>
            </article>
          </section>

          <section className="dashboard-grid" style={{ gridTemplateColumns: '1fr' }}>
            <div className="content-card">
              <div className="card-head">
                <div>
                  <h2 className="card-title">Próxima cita</h2>
                  <p className="card-subtitle">La siguiente visita veterinaria programada.</p>
                </div>
              </div>
              <div className="appointment-list">
                <div className="appointment">
                  <div className="date-box" style={{ background: 'rgba(82,183,136,.12)' }}>
                    <Clock size={20} />
                  </div>
                  <div>
                    <div className="appointment-title">{formatFecha(reporte.proximaCita)}</div>
                    <div className="appointment-text">Consultá el detalle completo en "Mis citas".</div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </>
      )}

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ClienteLayout>
  );
};

export default Reportes;
