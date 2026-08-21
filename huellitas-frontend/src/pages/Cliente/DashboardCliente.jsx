import React, { useState, useEffect } from 'react';
import {
  PawPrint, CalendarDays, Activity, Paperclip, Plus, Dog, Cat, Clock, Stethoscope, AlertTriangle
} from 'lucide-react';

import ClienteLayout from '../../components/Cliente/ClienteLayout/ClienteLayout';
import AgendarCitaModal from '../../components/Cliente/AgendarCitaModal/AgendarCitaModal';
import { API_BASE } from '../../api/config';
import { ToastContainer } from '../../components/Toast/Toast';
import { useToast } from '../../components/Toast/useToast';

const ICONO_HISTORIAL = {
  Cita: Stethoscope,
  AtencionExterna: Paperclip,
  Emergencia: AlertTriangle,
};

const DashboardCliente = () => {
  const [usuario, setUsuario] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [citas, setCitas] = useState([]);
  const [mascotas, setMascotas] = useState([]);
  const [resumen, setResumen] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [cargandoCitas, setCargandoCitas] = useState(false);
  const [cargandoMascotas, setCargandoMascotas] = useState(false);
  const [mostrarFormularioMascota, setMostrarFormularioMascota] = useState(false);
  const [editandoMascotaId, setEditandoMascotaId] = useState(null);
  const [formMascota, setFormMascota] = useState({
    nombre: '',
    idEspecie: 1,
    raza: '',
    fechaNacimiento: '',
    activo: true
  });
  const { toasts, showToast, removeToast } = useToast();

  useEffect(() => {
    try {
      const guardado = localStorage.getItem('usuario_huellitas') || localStorage.getItem('usuario') || localStorage.getItem('user');
      if (guardado) setUsuario(JSON.parse(guardado));
    } catch (err) {
      console.error('No se pudo leer el usuario guardado', err);
    }
  }, []);

  const nombreUsuario = usuario?.nombre || usuario?.Nombre || usuario?.nombreCompleto || 'Cliente';
  const citasPendientes = citas.filter((c) => c.idEstadoCita !== 3 && c.idEstadoCita !== 4).length;
  const citasProximas = citas
    .filter((c) => c.idEstadoCita !== 3 && c.idEstadoCita !== 4)
    .slice(0, 2);

  const obtenerToken = () => localStorage.getItem('token_huellitas') || localStorage.getItem('jwt') || localStorage.getItem('token');

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
    } finally {
      setCargandoCitas(false);
    }
  };

  const cargarMisMascotas = async () => {
    const token = obtenerToken();
    if (!token) return;

    try {
      setCargandoMascotas(true);
      const res = await fetch(`${API_BASE}/usuario/mascotas`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.mensaje || 'No se pudo cargar tus mascotas');
      setMascotas(Array.isArray(data?.mascotas) ? data.mascotas : []);
    } catch (error) {
      console.error(error);
      setMascotas([]);
    } finally {
      setCargandoMascotas(false);
    }
  };

  const cargarResumen = async () => {
    const token = obtenerToken();
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/reporte/resumen`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json().catch(() => ({}));
      if (res.ok) setResumen(data.reporte);
    } catch (error) {
      console.error(error);
    }
  };

  const cargarHistorial = async () => {
    const token = obtenerToken();
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/reporte/historial-clinico`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json().catch(() => ({}));
      if (res.ok) setHistorial((data.historial || []).slice(0, 5));
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    cargarMisCitas();
    cargarMisMascotas();
    cargarResumen();
    cargarHistorial();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetFormularioMascota = () => {
    setFormMascota({ nombre: '', idEspecie: 1, raza: '', fechaNacimiento: '', activo: true });
    setEditandoMascotaId(null);
    setMostrarFormularioMascota(false);
  };

  const abrirFormularioNuevaMascota = () => {
    resetFormularioMascota();
    setMostrarFormularioMascota(true);
  };

  const abrirFormularioEdicionMascota = (mascota) => {
    setEditandoMascotaId(mascota.idMascota ?? mascota.IdMascota);
    setFormMascota({
      nombre: mascota.nombre || mascota.Nombre || '',
      idEspecie: Number(mascota.idEspecie ?? mascota.IdEspecie ?? 1),
      raza: mascota.raza || mascota.Raza || '',
      fechaNacimiento: mascota.fechaNacimiento || mascota.FechaNacimiento ? (mascota.fechaNacimiento || mascota.FechaNacimiento).slice(0, 10) : '',
      activo: mascota.activo ?? mascota.Activo ?? true
    });
    setMostrarFormularioMascota(true);
  };

  const guardarMascota = async () => {
    const token = obtenerToken();
    if (!token) {
      showToast('Debes iniciar sesión para gestionar mascotas.', 'warning');
      return;
    }

    const payload = {
      nombre: formMascota.nombre.trim(),
      idEspecie: Number(formMascota.idEspecie),
      raza: formMascota.raza?.trim() || null,
      fechaNacimiento: formMascota.fechaNacimiento || null,
      activo: formMascota.activo
    };

    if (!payload.nombre) {
      showToast('El nombre de la mascota es obligatorio.', 'error');
      return;
    }

    try {
      const url = editandoMascotaId
        ? `${API_BASE}/usuario/mascotas/${editandoMascotaId}`
        : `${API_BASE}/usuario/mascotas`;
      const method = editandoMascotaId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.mensaje || 'No se pudo guardar la mascota.');

      showToast(data?.mensaje || 'Mascota guardada correctamente.', 'success');
      resetFormularioMascota();
      await cargarMisMascotas();
    } catch (error) {
      showToast(error.message || 'Error al guardar la mascota.', 'error');
    }
  };

  const eliminarMascota = async (mascota) => {
    const idMascota = mascota.idMascota ?? mascota.IdMascota;
    const nombre = mascota.nombre || mascota.Nombre || 'esta mascota';

    const confirmar = window.confirm(`¿Deseas eliminar a ${nombre}?`);
    if (!confirmar) return;

    const token = obtenerToken();
    if (!token) {
      showToast('Debes iniciar sesión para eliminar mascotas.', 'warning');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/usuario/mascotas/${idMascota}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.mensaje || 'No se pudo eliminar la mascota.');

      showToast(data?.mensaje || 'Mascota eliminada.', 'success');
      await cargarMisMascotas();
    } catch (error) {
      showToast(error.message || 'Error al eliminar la mascota.', 'error');
    }
  };

  const handleConfirmarCita = async (datosCita) => {
    const token = obtenerToken();
    if (!token) {
      showToast('Debes iniciar sesión para agendar una cita.', 'warning');
      setIsModalOpen(false);
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

      setIsModalOpen(false);
      showToast(data?.mensaje || 'Cita agendada correctamente.', 'success');
      await cargarMisCitas();
      await cargarResumen();
    } catch (error) {
      showToast(error.message || 'Ocurrió un error al agendar la cita.', 'error');
    }
  };

  const formatFecha = (fechaISO) => {
    if (!fechaISO) return null;
    return new Date(fechaISO).toLocaleDateString('es-CR', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <ClienteLayout activo="dashboard" titulo={`Hola, ${nombreUsuario.split(' ')[0]}`}>
      {/* STATS — todas conectadas a datos reales */}
      <section className="stats-grid">
        <article className="stat-card">
          <div className="stat-icon"><PawPrint size={24} color="#52B788" /></div>
          <div className="stat-label">Mascotas registradas</div>
          <div className="stat-number">{mascotas.length}</div>
          <div className="stat-note">Perros y gatos asociados a tu cuenta</div>
        </article>

        <article className="stat-card">
          <div className="stat-icon"><CalendarDays size={24} color="#52B788" /></div>
          <div className="stat-label">Citas pendientes</div>
          <div className="stat-number">{cargandoCitas ? '…' : citasPendientes}</div>
          <div className="stat-note">Próximas visitas programadas</div>
        </article>

        <article className="stat-card">
          <div className="stat-icon"><Stethoscope size={24} color="#52B788" /></div>
          <div className="stat-label">Citas completadas</div>
          <div className="stat-number">{resumen ? resumen.citasCompletadas : '…'}</div>
          <div className="stat-note">Consultas ya atendidas</div>
        </article>

        <article className="stat-card">
          <div className="stat-icon"><Paperclip size={24} color="#52B788" /></div>
          <div className="stat-label">Atenciones externas</div>
          <div className="stat-number">{resumen ? resumen.atencionesExternasRegistradas : '…'}</div>
          <div className="stat-note">Registradas fuera de la plataforma</div>
        </article>
      </section>

      <section className="dashboard-grid">
        {/* MASCOTAS */}
        <div className="content-card">
          <div className="card-head">
            <div>
              <h2 className="card-title">Mis mascotas</h2>
              <p className="card-subtitle">Gestiona las mascotas registradas en tu cuenta.</p>
            </div>
            <button className="btn-main" onClick={abrirFormularioNuevaMascota}>
              <Plus size={16} style={{ marginRight: '6px' }} /> Agregar mascota
            </button>
          </div>

          {mostrarFormularioMascota && (
            <div style={{ marginTop: 18, marginBottom: 18, padding: 18, border: '1px solid #e9ecef', borderRadius: 14, background: '#f7f9f8' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Nombre</label>
                  <input
                    value={formMascota.nombre}
                    onChange={(e) => setFormMascota({ ...formMascota, nombre: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #dfe6e9', borderRadius: 10 }}
                    placeholder="Ej. Luna"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Especie</label>
                  <select
                    value={formMascota.idEspecie}
                    onChange={(e) => setFormMascota({ ...formMascota, idEspecie: Number(e.target.value) })}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #dfe6e9', borderRadius: 10 }}
                  >
                    <option value={1}>Perro</option>
                    <option value={2}>Gato</option>
                    <option value={3}>Otra</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Raza</label>
                  <input
                    value={formMascota.raza}
                    onChange={(e) => setFormMascota({ ...formMascota, raza: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #dfe6e9', borderRadius: 10 }}
                    placeholder="Opcional"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Nacimiento</label>
                  <input
                    type="date"
                    value={formMascota.fechaNacimiento}
                    onChange={(e) => setFormMascota({ ...formMascota, fechaNacimiento: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #dfe6e9', borderRadius: 10 }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14, gap: 10 }}>
                <button className="btn-soft" onClick={resetFormularioMascota}>Cancelar</button>
                <button className="btn-main" onClick={guardarMascota}>{editandoMascotaId ? 'Guardar cambios' : 'Guardar mascota'}</button>
              </div>
            </div>
          )}

          <div className="pet-list">
            {cargandoMascotas && <div className="appointment" style={{ display: 'block' }}>Cargando tus mascotas…</div>}
            {!cargandoMascotas && mascotas.length === 0 && (
              <div className="appointment" style={{ display: 'block' }}>Aún no tienes mascotas vinculadas a tu cuenta.</div>
            )}
            {!cargandoMascotas && mascotas.map((mascota) => {
              const nombre = mascota.nombre || mascota.Nombre;
              const especie = mascota.especie || mascota.Especie || 'Otra';
              const raza = mascota.raza || mascota.Raza || 'Sin raza';
              const Icon = especie === 'Gato' ? Cat : Dog;
              const mascotaId = mascota.idMascota ?? mascota.IdMascota;

              return (
                <div className="pet-item" key={mascotaId}>
                  <div className="pet-info">
                    <div className="pet-icon"><Icon size={24} color="#52B788" /></div>
                    <div>
                      <div className="pet-title">{nombre}</div>
                      <div className="pet-detail">{especie} · {raza}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button className="btn-soft" onClick={() => abrirFormularioEdicionMascota(mascota)} style={{ padding: '8px 10px' }}>Editar</button>
                    <button className="btn-main" onClick={() => eliminarMascota(mascota)} style={{ padding: '8px 10px', background: '#ef4444', borderColor: '#ef4444' }}>Eliminar</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CITAS */}
        <div className="content-card">
          <div className="card-head">
            <div>
              <h2 className="card-title">Próximas citas</h2>
              <p className="card-subtitle">Visitas veterinarias programadas.</p>
            </div>
            <button className="btn-main" onClick={() => setIsModalOpen(true)}>
              <CalendarDays size={16} style={{ marginRight: '6px' }} /> Agendar cita
            </button>
          </div>

          <div className="appointment-list">
            {cargandoCitas && <div className="appointment" style={{ display: 'block' }}>Cargando tus citas…</div>}
            {!cargandoCitas && citasProximas.length === 0 && (
              <div className="appointment" style={{ display: 'block' }}>Aún no tienes citas agendadas.</div>
            )}
            {!cargandoCitas && citasProximas.map((cita) => {
              const fecha = new Date(cita.fecha);
              const dia = fecha.getDate();
              const mes = fecha.toLocaleDateString('es-CR', { month: 'short' }).replace('.', '');
              return (
                <div className="appointment" key={cita.idCita}>
                  <div className="date-box">
                    {dia}
                    <span>{mes}</span>
                  </div>
                  <div>
                    <div className="appointment-title">{cita.nombreServicio} — {cita.nombreMascota}</div>
                    <div className="appointment-text">{cita.horaInicio?.slice(0, 5)} · {cita.nombreVeterinario} · {cita.estadoCita}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RESUMEN DE CUENTA (reemplaza las barras de "estado de salud" que eran fijas/falsas) */}
        <div className="content-card">
          <div className="card-head">
            <div>
              <h2 className="card-title">Resumen de tu cuenta</h2>
              <p className="card-subtitle">Actividad clínica registrada hasta hoy.</p>
            </div>
          </div>

          <div className="appointment-list">
            <div className="appointment">
              <div className="date-box" style={{ background: 'rgba(82,183,136,.12)' }}>
                <Clock size={20} />
              </div>
              <div>
                <div className="appointment-title">Próxima cita</div>
                <div className="appointment-text">
                  {resumen?.proximaCita ? formatFecha(resumen.proximaCita) : 'No tenés citas programadas todavía.'}
                </div>
              </div>
            </div>

            <div className="appointment">
              <div className="date-box" style={{ background: 'rgba(239,68,68,.1)', color: '#b91c1c' }}>
                <AlertTriangle size={20} />
              </div>
              <div>
                <div className="appointment-title">Emergencias solicitadas</div>
                <div className="appointment-text">{resumen ? resumen.emergenciasSolicitadas : '…'} en total</div>
              </div>
            </div>
          </div>
        </div>

        {/* HISTORIAL — timeline real (citas completadas + atenciones externas + emergencias) */}
        <div className="content-card table-area">
          <div className="card-head">
            <div>
              <h2 className="card-title">Historial reciente</h2>
              <p className="card-subtitle">Últimas consultas y movimientos registrados.</p>
            </div>
          </div>

          <div className="appointment-list">
            {historial.length === 0 && (
              <div className="appointment" style={{ display: 'block' }}>Todavía no hay actividad clínica registrada.</div>
            )}
            {historial.map((item, index) => {
              const Icon = ICONO_HISTORIAL[item.tipo] || Activity;
              return (
                <div className="appointment" key={index}>
                  <div className="date-box" style={{ background: 'rgba(27,67,50,.10)' }}>
                    <Icon size={18} />
                  </div>
                  <div>
                    <div className="appointment-title">{item.nombreMascota} — {item.titulo}</div>
                    <div className="appointment-text">{formatFecha(item.fecha)} · {item.detalle}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <AgendarCitaModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmarCita}
      />
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ClienteLayout>
  );
};

export default DashboardCliente;
