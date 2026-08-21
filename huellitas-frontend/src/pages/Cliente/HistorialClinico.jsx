import React, { useState, useEffect } from 'react';
import { AlertCircle, Stethoscope, Paperclip, AlertTriangle } from 'lucide-react';

import ClienteLayout from '../../components/Cliente/ClienteLayout/ClienteLayout';
import { API_BASE } from '../../api/config';
import { ToastContainer } from '../../components/Toast/Toast';
import { useToast } from '../../components/Toast/useToast';

const ICONO_TIPO = {
  Cita: Stethoscope,
  AtencionExterna: Paperclip,
  Emergencia: AlertTriangle,
};

const ETIQUETA_TIPO = {
  Cita: 'Consulta',
  AtencionExterna: 'Atención externa',
  Emergencia: 'Emergencia',
};

const HistorialClinico = () => {
  const [historial, setHistorial] = useState([]);
  const [cargando, setCargando] = useState(true);
  const { toasts, showToast, removeToast } = useToast();

  const cargarHistorial = async () => {
    const token = localStorage.getItem('token_huellitas') || localStorage.getItem('jwt') || localStorage.getItem('token');
    if (!token) return;

    try {
      setCargando(true);
      const res = await fetch(`${API_BASE}/reporte/historial-clinico`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.mensaje || 'No se pudo cargar el historial clínico.');
      setHistorial(data.historial || []);
    } catch (error) {
      console.error(error);
      showToast(error.message || 'Error al cargar el historial clínico.', 'error');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarHistorial();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatFecha = (fechaISO) => {
    if (!fechaISO) return '-';
    return new Date(fechaISO).toLocaleDateString('es-CR', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  return (
    <ClienteLayout activo="historial">
      <section className="dashboard-grid" style={{ gridTemplateColumns: '1fr' }}>
        <div className="content-card">
          <div className="card-head">
            <div>
              <h2 className="card-title">Historial clínico</h2>
              <p className="card-subtitle">Consultas, atenciones externas y emergencias de todas tus mascotas.</p>
            </div>
          </div>

          {cargando && (
            <div className="appointment-list"><div className="appointment" style={{ display: 'block' }}>Cargando historial…</div></div>
          )}

          {!cargando && historial.length === 0 && (
            <div className="appointment-list">
              <div className="appointment" style={{ display: 'block', textAlign: 'center', padding: '3rem 1rem' }}>
                <AlertCircle size={48} style={{ color: '#dde3d8', marginBottom: '1rem' }} />
                <strong style={{ color: '#718096' }}>Sin datos disponibles</strong>
                <p style={{ color: '#cbd5e0', fontSize: '.9rem', marginTop: '.5rem' }}>
                  El historial clínico de tus mascotas aparecerá aquí en cuanto tengas citas completadas,
                  registres una atención externa o se cierre una emergencia.
                </p>
              </div>
            </div>
          )}

          {!cargando && historial.length > 0 && (
            <div className="appointment-list">
              {historial.map((item, index) => {
                const Icon = ICONO_TIPO[item.tipo] || Stethoscope;
                return (
                  <div className="appointment" key={index} style={{ alignItems: 'flex-start' }}>
                    <div className="date-box" style={{ background: 'rgba(27,67,50,.10)' }}>
                      <Icon size={18} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                        <div className="appointment-title">{item.nombreMascota} — {item.titulo}</div>
                        <span style={{ background: '#edf7f1', color: '#2d6a4f', borderRadius: 999, padding: '0.2rem 0.6rem', fontSize: '.72rem', fontWeight: 700 }}>
                          {ETIQUETA_TIPO[item.tipo] || item.tipo}
                        </span>
                      </div>
                      <div className="appointment-text">{formatFecha(item.fecha)} · {item.detalle}</div>
                      {item.diagnostico && (
                        <div className="appointment-text" style={{ marginTop: '.35rem', fontStyle: 'italic', color: '#718096' }}>
                          Diagnóstico: {item.diagnostico}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ClienteLayout>
  );
};

export default HistorialClinico;
