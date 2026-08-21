import React, { useEffect, useState } from 'react';
import { CalendarDays, Repeat, Ban, Save } from 'lucide-react';

import ClienteLayout from '../../components/Cliente/ClienteLayout/ClienteLayout';
import AgendarCitaModal from '../../components/Cliente/AgendarCitaModal/AgendarCitaModal';
import { API_BASE } from '../../api/config';
import { ToastContainer } from '../../components/Toast/Toast';
import { useToast } from '../../components/Toast/useToast';
import { useConfirm } from '../../components/ConfirmModal/useConfirm';
import CustomSelect from '../../components/CustomSelect/CustomSelect';
import styles from './MisCitas.module.css';

const obtenerToken = () => localStorage.getItem('token_huellitas') || localStorage.getItem('jwt') || localStorage.getItem('token');

const toMinutos = (hhmmss) => {
  if (!hhmmss) return 0;
  const [h, m] = hhmmss.split(':').map(Number);
  return h * 60 + m;
};

// CRUD completo de citas del cliente: agendar (AgendarCitaModal, ya existía pero vivía en el
// Dashboard), reprogramar (con disponibilidad real del veterinario, mismo endpoint que ya usa
// AgendarCitaModal) y cancelar — antes esta pantalla solo mostraba la lista, sin ninguna acción.
const MisCitas = () => {
  const [citas, setCitas] = useState([]);
  const [cargandoCitas, setCargandoCitas] = useState(false);
  const { toasts, showToast, removeToast } = useToast();
  const { pedirConfirmacion, ConfirmacionModal } = useConfirm();

  const [modalAgendarAbierto, setModalAgendarAbierto] = useState(false);

  // ─── Reprogramar ───
  const [citaAReprogramar, setCitaAReprogramar] = useState(null);
  const [nuevaFecha, setNuevaFecha] = useState('');
  const [nuevaHora, setNuevaHora] = useState(null);
  const [horariosDisponibles, setHorariosDisponibles] = useState([]);
  const [cargandoHorarios, setCargandoHorarios] = useState(false);
  const [guardandoReprogramacion, setGuardandoReprogramacion] = useState(false);

  const cargarMisCitas = async () => {
    const token = obtenerToken();
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

  // ─── Agendar (Crear) ───
  const handleConfirmarCita = async (datosCita) => {
    const token = obtenerToken();
    if (!token) {
      showToast('Debes iniciar sesión para agendar una cita.', 'warning');
      setModalAgendarAbierto(false);
      return;
    }

    try {
      const payload = {
        idMascota: Number(datosCita.idMascota),
        idServicio: Number(datosCita.idServicio),
        idVeterinario: datosCita.idVeterinario ? Number(datosCita.idVeterinario) : null,
        fecha: datosCita.fecha,
        horaInicio: datosCita.horaInicio,
        notas: datosCita.notas || ''
      };

      const res = await fetch(`${API_BASE}/cita`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.mensaje || 'No se pudo agendar la cita.');

      showToast(data?.mensaje || 'Cita agendada correctamente.', 'success');
      await cargarMisCitas();
    } catch (error) {
      showToast(error.message || 'Ocurrió un error al agendar la cita.', 'error');
    }
  };

  // ─── Reprogramar (Actualizar) ───
  const abrirReprogramar = (cita) => {
    const fechaISO = (cita?.fecha ?? cita?.Fecha ?? '').slice(0, 10);
    setCitaAReprogramar(cita);
    setNuevaFecha(fechaISO);
    setNuevaHora(null);
    setHorariosDisponibles([]);
  };

  const cerrarReprogramar = () => {
    if (guardandoReprogramacion) return;
    setCitaAReprogramar(null);
  };

  useEffect(() => {
    if (!citaAReprogramar || !nuevaFecha) return undefined;

    const idVeterinario = citaAReprogramar?.idVeterinario ?? citaAReprogramar?.IdVeterinario;
    const horaInicio = citaAReprogramar?.horaInicio ?? citaAReprogramar?.HoraInicio;
    const horaFin = citaAReprogramar?.horaFin ?? citaAReprogramar?.HoraFin;
    const duracionMinutos = Math.max(15, toMinutos(horaFin) - toMinutos(horaInicio)) || 30;

    if (!idVeterinario) {
      setHorariosDisponibles([]);
      return undefined;
    }

    let cancelado = false;
    const cargarDisponibilidad = async () => {
      setCargandoHorarios(true);
      try {
        const url = `${API_BASE}/agenda/disponibilidad?idVeterinario=${idVeterinario}&fecha=${nuevaFecha}&duracionMinutos=${duracionMinutos}`;
        const res = await fetch(url);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.mensaje || 'No se pudo consultar la disponibilidad.');
        if (!cancelado) setHorariosDisponibles(Array.isArray(data.horasDisponibles) ? data.horasDisponibles : []);
      } catch (error) {
        console.error('Disponibilidad del veterinario:', error);
        if (!cancelado) setHorariosDisponibles([]);
      } finally {
        if (!cancelado) setCargandoHorarios(false);
      }
    };

    cargarDisponibilidad();
    return () => { cancelado = true; };
  }, [citaAReprogramar, nuevaFecha]);

  const guardarReprogramacion = async () => {
    if (!citaAReprogramar || !nuevaHora) return;
    const token = obtenerToken();
    if (!token) {
      showToast('Debes iniciar sesión para reprogramar una cita.', 'warning');
      return;
    }

    const idCita = citaAReprogramar?.idCita ?? citaAReprogramar?.IdCita;
    const notas = citaAReprogramar?.notas ?? citaAReprogramar?.Notas ?? '';

    setGuardandoReprogramacion(true);
    try {
      const res = await fetch(`${API_BASE}/cita/${idCita}/reprogramar`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ fecha: nuevaFecha, horaInicio: `${nuevaHora}:00`, notas })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.mensaje || 'No se pudo reprogramar la cita.');

      showToast(data?.mensaje || 'Cita reprogramada correctamente.', 'success');
      setCitaAReprogramar(null);
      await cargarMisCitas();
    } catch (error) {
      showToast(error.message || 'No se pudo reprogramar la cita.', 'error');
    } finally {
      setGuardandoReprogramacion(false);
    }
  };

  // ─── Cancelar (Eliminar) ───
  const cancelarCita = (cita) => {
    const idCita = cita?.idCita ?? cita?.IdCita;
    const nombreMascota = cita?.nombreMascota ?? cita?.NombreMascota ?? 'tu mascota';

    pedirConfirmacion({
      titulo: 'Cancelar cita',
      mensaje: `¿Cancelar la cita de ${nombreMascota}? Esta acción no se puede deshacer.`,
      textoConfirmar: 'Sí, cancelar',
      onConfirmar: async () => {
        const token = obtenerToken();
        if (!token) {
          showToast('Debes iniciar sesión para cancelar una cita.', 'warning');
          return;
        }

        try {
          const res = await fetch(`${API_BASE}/cita/${idCita}/cancelar`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ motivo: 'Cancelada por el cliente.' })
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error(data?.mensaje || 'No se pudo cancelar la cita.');

          showToast(data?.mensaje || 'Cita cancelada correctamente.', 'success');
          await cargarMisCitas();
        } catch (error) {
          showToast(error.message || 'No se pudo cancelar la cita.', 'error');
        }
      }
    });
  };

  const getIdEstado = (cita) => Number(cita?.idEstadoCita ?? cita?.IdEstadoCita ?? 0);
  const esReprogramada = (cita) => {
    const texto = `${cita?.notas ?? cita?.Notas ?? ''} ${cita?.motivo ?? cita?.Motivo ?? ''}`.toLowerCase();
    return /reprogram|reagend/.test(texto);
  };
  const puedeGestionar = (cita) => [1, 2].includes(getIdEstado(cita)); // Pendiente o Confirmada

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

          {puedeGestionar(cita) && (
            <div className={styles.acciones}>
              <button type="button" className={styles.btnAccion} onClick={() => abrirReprogramar(cita)}>
                <Repeat size={13} /> Reprogramar
              </button>
              <button type="button" className={`${styles.btnAccion} ${styles.btnAccionDanger}`} onClick={() => cancelarCita(cita)}>
                <Ban size={13} /> Cancelar
              </button>
            </div>
          )}
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
              <p className="card-subtitle">Consulta, agendá, reprogramá o cancelá tus citas veterinarias.</p>
            </div>
            <button className="btn-main" onClick={() => setModalAgendarAbierto(true)}>
              <CalendarDays size={16} style={{ marginRight: '6px' }} /> Agendar cita
            </button>
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

      <AgendarCitaModal
        open={modalAgendarAbierto}
        onClose={() => setModalAgendarAbierto(false)}
        onConfirm={handleConfirmarCita}
      />

      {citaAReprogramar && (
        <div className={styles.overlay} onClick={cerrarReprogramar}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Reprogramar cita</h3>
              <p>{citaAReprogramar.nombreMascota ?? citaAReprogramar.NombreMascota} · {citaAReprogramar.nombreServicio ?? citaAReprogramar.NombreServicio}</p>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.campo}>
                <label>Nueva fecha</label>
                <input
                  type="date"
                  value={nuevaFecha}
                  min={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => { setNuevaFecha(e.target.value); setNuevaHora(null); }}
                />
              </div>

              <div className={styles.campo}>
                <label>Nueva hora</label>
                {cargandoHorarios ? (
                  <div className={styles.sinHorarios}>Consultando disponibilidad…</div>
                ) : horariosDisponibles.length === 0 ? (
                  <div className={styles.sinHorarios}>No hay horarios disponibles ese día. Probá con otra fecha.</div>
                ) : (
                  <CustomSelect
                    value={nuevaHora}
                    onChange={setNuevaHora}
                    placeholder="Elegí una hora"
                    opciones={horariosDisponibles.map((h) => ({ value: h, label: h }))}
                  />
                )}
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button type="button" className="btn-soft" onClick={cerrarReprogramar} disabled={guardandoReprogramacion}>
                Cancelar
              </button>
              <button
                type="button"
                className="btn-main"
                onClick={guardarReprogramacion}
                disabled={!nuevaHora || guardandoReprogramacion}
              >
                <Save size={15} style={{ marginRight: '6px' }} />
                {guardandoReprogramacion ? 'Guardando…' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </div>
      )}

      {ConfirmacionModal}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ClienteLayout>
  );
};

export default MisCitas;
