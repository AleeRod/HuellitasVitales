import React, { useState, useEffect } from 'react';

import ClienteLayout from '../../components/Cliente/ClienteLayout/ClienteLayout';
import { API_BASE } from '../../api/config';
import { ToastContainer } from '../../components/Toast/Toast';
import { useToast } from '../../components/Toast/useToast';

const MisCitas = () => {
  const [citas, setCitas] = useState([]);
  const [cargandoCitas, setCargandoCitas] = useState(false);
  const { toasts, showToast, removeToast } = useToast();

  const cargarMisCitas = async () => {
    const token = localStorage.getItem('token_huellitas') || localStorage.getItem('jwt') || localStorage.getItem('token');
    if (!token) return;

    try {
      setCargandoCitas(true);
      const res = await fetch(`${API_BASE}/cita/mis-citas`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('No se pudo cargar tus citas');
      const data = await res.json();
      setCitas(data?.citas || []);
    } catch (error) {
      console.error(error);
      setCitas([]);
      showToast('Error al cargar tus citas', 'error');
    } finally {
      setCargandoCitas(false);
    }
  };

  useEffect(() => {
    cargarMisCitas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getIdEstado = (cita) => Number(cita?.idEstadoCita ?? cita?.IdEstadoCita ?? 0);
  const esReprogramada = (cita) => {
    const texto = `${cita?.notas ?? cita?.Notas ?? ''} ${cita?.motivo ?? cita?.Motivo ?? ''}`.toLowerCase();
    return /reprogram|reagend/.test(texto);
  };

  const misCitasAgrupadas = [
    { key: 'confirmadas', label: 'Confirmadas', items: citas.filter((c) => getIdEstado(c) === 2) },
    { key: 'pendientes', label: 'Pendientes', items: citas.filter((c) => getIdEstado(c) === 1 && !esReprogramada(c)) },
    { key: 'reprogramadas', label: 'Reprogramadas', items: citas.filter((c) => getIdEstado(c) === 1 && esReprogramada(c)) },
    { key: 'canceladas', label: 'Canceladas', items: citas.filter((c) => getIdEstado(c) === 3) }
  ];

  const renderCitaCard = (cita) => {
    const idEstado = getIdEstado(cita);
    const estadoTexto = idEstado === 1 ? 'Pendiente' : idEstado === 2 ? 'Confirmada' : idEstado === 3 ? 'Cancelada' : 'Completada';
    const fechaRaw = cita?.fecha ?? cita?.Fecha;
    const hora = cita?.horaInicio ?? cita?.HoraInicio ?? '00:00';
    const fecha = fechaRaw ? new Date(fechaRaw) : null;
    const fechaLabel = fecha && !Number.isNaN(fecha.getTime())
      ? fecha.toLocaleDateString('es-CR', { day: '2-digit', month: 'short', year: 'numeric' })
      : 'Sin fecha';
    const dia = fecha && !Number.isNaN(fecha.getTime()) ? fecha.getDate() : '--';
    const mes = fecha && !Number.isNaN(fecha.getTime())
      ? fecha.toLocaleDateString('es-CR', { month: 'short' }).replace('.', '')
      : '---';
    const badgeStyle = {
      background: idEstado === 2 ? 'rgba(82,183,136,.16)' : idEstado === 3 ? 'rgba(239,68,68,.12)' : idEstado === 4 ? 'rgba(148,163,184,.16)' : 'rgba(221,161,94,.18)',
      color: idEstado === 2 ? '#2d6a4f' : idEstado === 3 ? '#b91c1c' : idEstado === 4 ? '#475569' : '#945d18'
    };

    return (
      <div className="appointment" key={cita.idCita ?? cita.IdCita}>
        <div className="date-box" style={{ background: idEstado === 2 ? 'rgba(82,183,136,.12)' : idEstado === 3 ? 'rgba(239,68,68,.12)' : 'rgba(27,67,50,.10)' }}>
          {dia}
          <span>{mes}</span>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', marginBottom: '.35rem' }}>
            <div className="appointment-title">{cita.nombreServicio ?? cita.NombreServicio ?? 'Consulta'} · {cita.nombreMascota ?? cita.NombreMascota ?? 'Mascota'}</div>
            <span className="status-badge" style={badgeStyle}>{estadoTexto}</span>
          </div>
          <div className="appointment-text">
            {fechaLabel} · {String(hora).slice(0, 5)} · {cita.nombreVeterinario ?? cita.NombreVeterinario ?? 'Veterinario'}
          </div>
          {cita.notas || cita.Notas ? (
            <div className="appointment-text" style={{ marginTop: '.35rem', fontSize: '.76rem', fontStyle: 'italic', color: '#718096' }}>
              Notas: {cita.notas ?? cita.Notas}
            </div>
          ) : null}
        </div>
      </div>
    );
  };

  return (
    <ClienteLayout activo="citas">
      <section className="dashboard-grid" style={{ gridTemplateColumns: '1fr' }}>
        <div className="content-card">
          <div className="card-head">
            <div>
              <h2 className="card-title">Mis citas</h2>
              <p className="card-subtitle">Consulta todas tus citas organizadas por estado.</p>
            </div>
          </div>

          {cargandoCitas && <div className="appointment-list"><div className="appointment" style={{ display: 'block' }}>Cargando tus citas…</div></div>}
          {!cargandoCitas && citas.length === 0 && (
            <div className="appointment-list"><div className="appointment" style={{ display: 'block' }}>Aún no tienes citas agendadas.</div></div>
          )}
          {!cargandoCitas && citas.length > 0 && (
            <div className="appointment-list">
              {misCitasAgrupadas.map((grupo) => (
                <div key={grupo.key} style={{ border: '1px solid #e9ecef', borderRadius: 18, background: '#fbfdfb', padding: '1rem', marginBottom: '.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', paddingBottom: '.75rem', borderBottom: '1px solid #dde3d8' }}>
                    <strong style={{ color: '#1B4332', fontSize: '.98rem' }}>{grupo.label}</strong>
                    <span style={{ background: '#edf7f1', color: '#2d6a4f', borderRadius: 999, padding: '0.35rem 0.65rem', fontSize: '.74rem', fontWeight: 700 }}>
                      {grupo.items.length} {grupo.items.length === 1 ? 'cita' : 'citas'}
                    </span>
                  </div>
                  {grupo.items.length === 0 ? (
                    <div className="appointment" style={{ display: 'block', background: '#fafbfa', border: '1px dashed #dde3d8' }}>
                      No tienes citas en esta categoría.
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gap: '.75rem' }}>
                      {grupo.items.map((cita) => renderCitaCard(cita))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ClienteLayout>
  );
};

export default MisCitas;
