import React, { useMemo, useState, useEffect } from 'react';
import styles from './AgendaDiariaVeterinario.module.css';
import { API_BASE } from '../../../api/config';
import {
  CalendarDays,
  Calendar,
  Rows3,
  ChevronLeft,
  ChevronRight,
  PawPrint,
  Stethoscope,
  Scissors,
  Syringe,
  Clock,
  User,
  FileText,
  X,
  Check,
  Ban,
  Repeat,
} from 'lucide-react';

/* -------------------------------------------------------------------------
   MOCK DATA — misma forma que las tablas reales:
   MASCOTA, SERVICIO, TIPO_SERVICIO_CAT, ESTADO_CITA_CAT,
   HORARIO_VETERINARIO, CITA
   Reemplazar por la respuesta del endpoint GET (#184) cuando esté lista.
------------------------------------------------------------------------- */

const ESTADO_CITA_CAT = [
  { IdEstadoCita: 1, Nombre: 'Pendiente', badgeClass: 'statusNext' },
  { IdEstadoCita: 2, Nombre: 'Confirmada', badgeClass: 'statusReady' },
  { IdEstadoCita: 3, Nombre: 'Cancelada', badgeClass: 'statusUrgent' },
  { IdEstadoCita: 4, Nombre: 'Completada', badgeClass: 'statusDone' },
];

const TIPO_SERVICIO_CAT = [
  { IdTipoServicio: 1, Nombre: 'Consulta', icon: Stethoscope },
  { IdTipoServicio: 2, Nombre: 'Grooming', icon: Scissors },
  { IdTipoServicio: 3, Nombre: 'Procedimiento', icon: Syringe },
];

const HORARIO_VETERINARIO = [
  { DiaSemana: 1, HoraInicio: '08:00', HoraFin: '17:00' },
  { DiaSemana: 2, HoraInicio: '08:00', HoraFin: '17:00' },
  { DiaSemana: 3, HoraInicio: '08:00', HoraFin: '17:00' },
  { DiaSemana: 4, HoraInicio: '08:00', HoraFin: '17:00' },
  { DiaSemana: 5, HoraInicio: '08:00', HoraFin: '17:00' },
  { DiaSemana: 6, HoraInicio: '08:00', HoraFin: '12:00' },
];

const fechaValida = (value) => {
  if (!value) return false;
  const d = value instanceof Date ? value : new Date(value);
  return !Number.isNaN(d.getTime());
};

const toISO = (d) => {
  if (!d) return '';
  const x = d instanceof Date ? new Date(d) : new Date(d);
  if (!fechaValida(x)) return '';
  x.setHours(0, 0, 0, 0);
  return x.toISOString().slice(0, 10);
};
const addDays = (d, n) => {
  const x = new Date(d);
  if (Number.isNaN(x.getTime())) return new Date(today);
  x.setDate(x.getDate() + n);
  return x;
};
const today = new Date();

const mkCita = (id, dayOffset, horaInicio, horaFin, data) => ({
  IdCita: id,
  IdMascota: data.idMascota,
  IdServicio: data.idServicio,
  IdEstadoCita: data.idEstadoCita,
  Fecha: toISO(addDays(today, dayOffset)),
  HoraInicio: horaInicio,
  HoraFin: horaFin,
  Notas: data.notas || '',
  NombreMascota: data.mascota,
  Especie: data.especie,
  NombreCliente: data.cliente,
  IdTipoServicio: data.tipo,
  NombreServicio: data.servicio,
});

const CITAS_MOCK = [
  mkCita(301, 0, '08:00', '08:30', { idMascota: 41, idServicio: 3, idEstadoCita: 2, mascota: 'Max', especie: 'Golden Retriever', cliente: 'Brandon Alfaro', tipo: 1, servicio: 'Consulta general' }),
  mkCita(302, 0, '09:30', '10:15', { idMascota: 22, idServicio: 5, idEstadoCita: 4, mascota: 'Luna', especie: 'Gata Persa', cliente: 'Laura Pérez', tipo: 3, servicio: 'Vacunación' }),
  mkCita(303, 0, '11:00', '11:30', { idMascota: 9, idServicio: 2, idEstadoCita: 1, mascota: 'Rocky', especie: 'French Poodle', cliente: 'José Méndez', tipo: 1, servicio: 'Control dental' }),
  mkCita(304, 0, '13:30', '14:10', { idMascota: 15, idServicio: 7, idEstadoCita: 3, mascota: 'Toby', especie: 'Beagle', cliente: 'Ana Mora', tipo: 1, servicio: 'Revisión por dolor', notas: 'Dolor abdominal, prioridad alta.' }),
  mkCita(305, 1, '08:30', '09:00', { idMascota: 31, idServicio: 2, idEstadoCita: 2, mascota: 'Zeus', especie: 'Pastor Alemán', cliente: 'Diego Rodríguez', tipo: 1, servicio: 'Consulta general' }),
  mkCita(306, 1, '10:00', '10:30', { idMascota: 12, idServicio: 3, idEstadoCita: 1, mascota: 'Coco', especie: 'Ave', cliente: 'Paula Powers', tipo: 1, servicio: 'Consulta general' }),
  mkCita(307, 2, '08:00', '08:30', { idMascota: 18, idServicio: 6, idEstadoCita: 1, mascota: 'Nube', especie: 'Perro mestizo', cliente: 'Kevin Araya', tipo: 3, servicio: 'Desparasitación' }),
  mkCita(308, 2, '13:00', '13:45', { idMascota: 27, idServicio: 5, idEstadoCita: 2, mascota: 'Simba', especie: 'Gato Siamés', cliente: 'Fabiana Castro', tipo: 2, servicio: 'Baño y corte' }),
];

const fmtHora = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  const suf = h >= 12 ? 'p.m.' : 'a.m.';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return { hora: `${h12}:${String(m).padStart(2, '0')}`, suf };
};
const fmtDia = (d) => d.toLocaleDateString('es-CR', { weekday: 'short' }).replace('.', '').toUpperCase();
const fmtFecha = (d) => d.toLocaleDateString('es-CR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
const fmtMes = (d) => {
  const s = d.toLocaleDateString('es-CR', { month: 'long', year: 'numeric' });
  return s.charAt(0).toUpperCase() + s.slice(1);
};

const estadoInfo = (id) => ESTADO_CITA_CAT.find((e) => e.IdEstadoCita === id);
const tipoInfo = (id) => TIPO_SERVICIO_CAT.find((t) => t.IdTipoServicio === id);

const toMin = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};
const minToHHMM = (min) => `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;

const buildMonthGrid = (anchor) => {
  const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const dow = first.getDay();
  const mondayOffset = dow === 0 ? -6 : 1 - dow;
  const start = addDays(first, mondayOffset);
  return Array.from({ length: 42 }, (_, i) => addDays(start, i));
};

const AgendaDiariaVeterinario = () => {
  const [viewMode, setViewMode] = useState('semana'); // 'semana' | 'mes'
  const [weekAnchor, setWeekAnchor] = useState(today);
  const [monthAnchor, setMonthAnchor] = useState(today);
  const [selectedDate, setSelectedDate] = useState(toISO(today));
  const [statusFilter, setStatusFilter] = useState('all');
  const [citas, setCitas] = useState([]);
  const [selectedCita, setSelectedCita] = useState(null);
  const [slideDir, setSlideDir] = useState(1);
  const [reprogramando, setReprogramando] = useState(false);
  const [nuevaFecha, setNuevaFecha] = useState('');
  const [nuevaHora, setNuevaHora] = useState('');
  const [cargandoAgenda, setCargandoAgenda] = useState(false);

  const normalizarCita = (cita) => {
    const fechaRaw = cita?.fecha ?? cita?.Fecha;
    const fechaNormalizada = fechaValida(fechaRaw) ? toISO(fechaRaw) : toISO(today);

    return {
      ...cita,
      IdCita: cita.idCita ?? cita.IdCita,
      IdMascota: cita.idMascota ?? cita.IdMascota,
      NombreMascota: cita.nombreMascota ?? cita.NombreMascota ?? 'Mascota',
      Especie: cita.especie ?? cita.Especie ?? 'Sin especie',
      NombreCliente: cita.nombreCliente ?? cita.NombreCliente ?? 'Cliente',
      IdVeterinario: cita.idVeterinario ?? cita.IdVeterinario,
      NombreVeterinario: cita.nombreVeterinario ?? cita.NombreVeterinario ?? '',
      IdServicio: cita.idServicio ?? cita.IdServicio,
      NombreServicio: cita.nombreServicio ?? cita.NombreServicio ?? 'Servicio',
      IdTipoServicio: cita.idTipoServicio ?? cita.IdTipoServicio ?? 1,
      IdEstadoCita: cita.idEstadoCita ?? cita.IdEstadoCita ?? 1,
      Fecha: fechaNormalizada,
      HoraInicio: cita.horaInicio ?? cita.HoraInicio ?? '08:00:00',
      HoraFin: cita.horaFin ?? cita.HoraFin ?? '08:30:00',
      Notas: cita.notas ?? cita.Notas ?? '',
    };
  };

  const cargarAgenda = async () => {
    const token = localStorage.getItem('token_huellitas') || localStorage.getItem('jwt') || localStorage.getItem('token');
    if (!token) {
      setCitas([]);
      return;
    }

    try {
      setCargandoAgenda(true);
      const res = await fetch(`${API_BASE}/cita/veterinario`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.mensaje || 'No se pudo cargar la agenda.');
      const citasApi = Array.isArray(data?.citas) ? data.citas : [];
      setCitas(citasApi.map(normalizarCita));
    } catch (error) {
      console.error('Agenda veterinario:', error);
      setCitas([]);
    } finally {
      setCargandoAgenda(false);
    }
  };

  useEffect(() => {
    cargarAgenda();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const weekDays = useMemo(() => {
    const start = new Date(weekAnchor);
    const dow = start.getDay();
    const mondayOffset = dow === 0 ? -6 : 1 - dow;
    const monday = addDays(start, mondayOffset);
    return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
  }, [weekAnchor]);

  const monthDays = useMemo(() => buildMonthGrid(monthAnchor), [monthAnchor]);

  const citasPorDia = (iso) => citas.filter((c) => c.Fecha === iso);

  useEffect(() => {
    if (!citas.length || !selectedDate) return;

    const visibles = citas.filter((c) => {
      const fecha = c?.Fecha;
      return !!fecha && (statusFilter === 'all' || c.IdEstadoCita === Number(statusFilter));
    });
    const hayEnFecha = visibles.some((c) => c.Fecha === selectedDate);

    if (!hayEnFecha) {
      const siguiente = [...visibles].sort(
        (a, b) => (a.Fecha || '').localeCompare(b.Fecha || '') || (a.HoraInicio || '').localeCompare(b.HoraInicio || '')
      )[0];

      if (siguiente && siguiente.Fecha && siguiente.Fecha !== selectedDate) {
        setSelectedDate(siguiente.Fecha);
        const fechaObj = new Date(`${siguiente.Fecha}T00:00:00`);
        if (!Number.isNaN(fechaObj.getTime())) {
          setWeekAnchor(fechaObj);
          setMonthAnchor(fechaObj);
        }
      }
    }
  }, [citas, statusFilter, selectedDate]);

  const selectedDateObj = useMemo(() => new Date(`${selectedDate}T00:00:00`), [selectedDate]);

  const diaSemana = selectedDateObj.getDay();
  const horarioDia = HORARIO_VETERINARIO.find((h) => h.DiaSemana === diaSemana);

  const citasDelDia = citasPorDia(selectedDate)
    .filter((c) => statusFilter === 'all' || c.IdEstadoCita === Number(statusFilter))
    .sort((a, b) => a.HoraInicio.localeCompare(b.HoraInicio));

  const selectDate = (d) => {
    const iso = toISO(d);
    if (!iso) return;
    setSelectedDate(iso);
    setWeekAnchor(d);
    setMonthAnchor(d);
    setSelectedCita(null);
    setReprogramando(false);
  };

  const changeWeek = (dir) => {
    setSlideDir(dir);
    setWeekAnchor(addDays(weekAnchor, dir * 7));
  };
  const changeMonth = (dir) => {
    setSlideDir(dir);
    setMonthAnchor(new Date(monthAnchor.getFullYear(), monthAnchor.getMonth() + dir, 1));
  };
  const goToday = () => {
    setSlideDir(1);
    selectDate(today);
  };

  const updateEstado = async (idCita, idEstadoCita) => {
    const token = localStorage.getItem('token_huellitas') || localStorage.getItem('jwt') || localStorage.getItem('token');
    if (!token) return;

    try {
      if (idEstadoCita === 2) {
        const res = await fetch(`${API_BASE}/cita/${idCita}/confirmar`, {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.mensaje || 'No se pudo confirmar la cita.');
        await cargarAgenda();
        return;
      }

      if (idEstadoCita === 3) {
        const res = await fetch(`${API_BASE}/cita/${idCita}/cancelar`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ motivo: 'Cancelada desde agenda veterinario' })
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.mensaje || 'No se pudo cancelar la cita.');
        await cargarAgenda();
        return;
      }

      console.warn('La acción de completar cita no tiene endpoint activo aún.');
    } catch (error) {
      console.error('Error al actualizar cita:', error);
    }
  };

  const iniciarReprogramar = () => {
    setNuevaFecha(selectedCita.Fecha);
    setNuevaHora(selectedCita.HoraInicio);
    setReprogramando(true);
  };

  const horarioParaFecha = (iso) => {
    const dow = new Date(`${iso}T00:00:00`).getDay();
    return HORARIO_VETERINARIO.find((h) => h.DiaSemana === dow);
  };

  const opcionesHora = useMemo(() => {
    if (!reprogramando) return [];
    const h = horarioParaFecha(nuevaFecha);
    if (!h) return [];
    const out = [];
    for (let m = toMin(h.HoraInicio); m < toMin(h.HoraFin); m += 30) out.push(minToHHMM(m));
    return out;
  }, [reprogramando, nuevaFecha]);

  const guardarReprogramacion = async () => {
    if (!nuevaHora || !horarioParaFecha(nuevaFecha) || !selectedCita) return;

    const token = localStorage.getItem('token_huellitas') || localStorage.getItem('jwt') || localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE}/cita/${selectedCita.IdCita}/reprogramar`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          fecha: nuevaFecha,
          horaInicio: `${nuevaHora}:00`,
          notas: selectedCita.Notas || ''
        })
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.mensaje || 'No se pudo reprogramar la cita.');

      setReprogramando(false);
      await cargarAgenda();
      selectDate(new Date(`${nuevaFecha}T00:00:00`));
    } catch (error) {
      console.error('Error al reprogramar cita:', error);
    }
  };

  return (
    <div className={`${styles.contentCard} ${styles.agendaCard}`}>
      <div className={styles.cardHead}>
        <div>
          <h2 className={styles.cardTitle}>Vista de agenda diaria</h2>
          <p className={styles.cardSubtitle}>Listado visual de citas, horarios, pacientes y estado de atención.</p>
        </div>
        <div className={styles.headActions}>
          <div className={styles.viewToggle}>
            <button
              className={`${styles.viewToggleBtn} ${viewMode === 'semana' ? styles.viewToggleBtnActive : ''}`}
              onClick={() => setViewMode('semana')}
            >
              <Rows3 size={14} /> Semana
            </button>
            <button
              className={`${styles.viewToggleBtn} ${viewMode === 'mes' ? styles.viewToggleBtnActive : ''}`}
              onClick={() => setViewMode('mes')}
            >
              <Calendar size={14} /> Mes
            </button>
          </div>
          <button className={styles.btnSoft} onClick={goToday}>Hoy</button>
        </div>
      </div>

      {viewMode === 'semana' && (
        <div className={styles.dayStrip}>
          <button className={styles.iconButtonSm} onClick={() => changeWeek(-1)} aria-label="Semana anterior">
            <ChevronLeft size={16} />
          </button>
          <div className={styles.dayStripViewport}>
            <div className={styles.dayStripTrack} key={toISO(weekDays[0])} data-dir={slideDir}>
              {weekDays.map((d) => {
                const iso = toISO(d);
                const count = citasPorDia(iso).length;
                const active = iso === selectedDate;
                const esHoy = iso === toISO(today);
                return (
                  <button
                    key={iso}
                    className={`${styles.dayPill} ${active ? styles.dayPillActive : ''}`}
                    onClick={() => selectDate(d)}
                  >
                    <span className={styles.dayDow}>{fmtDia(d)}</span>
                    <span className={styles.dayNum}>{d.getDate()}</span>
                    <span className={styles.dayCount}>{count > 0 ? count : '—'}</span>
                    {esHoy && !active && <span className={styles.dayTodayDot} />}
                  </button>
                );
              })}
            </div>
          </div>
          <button className={styles.iconButtonSm} onClick={() => changeWeek(1)} aria-label="Semana siguiente">
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {viewMode === 'mes' && (
        <div className={styles.monthNav}>
          <button className={styles.iconButtonSm} onClick={() => changeMonth(-1)} aria-label="Mes anterior">
            <ChevronLeft size={16} />
          </button>
          <span className={styles.monthLabel}>{fmtMes(monthAnchor)}</span>
          <button className={styles.iconButtonSm} onClick={() => changeMonth(1)} aria-label="Mes siguiente">
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {viewMode === 'mes' && (
        <div className={styles.monthViewport}>
          <div className={styles.monthGrid} key={fmtMes(monthAnchor)} data-dir={slideDir}>
            {['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'].map((d) => (
              <div key={d} className={styles.monthDow}>{d}</div>
            ))}
            {monthDays.map((d) => {
              const iso = toISO(d);
              const enMes = d.getMonth() === monthAnchor.getMonth();
              const active = iso === selectedDate;
              const esHoy = iso === toISO(today);
              const citasDia = citasPorDia(iso);
              const estadosPresentes = [...new Set(citasDia.map((c) => c.IdEstadoCita))].slice(0, 3);
              return (
                <button
                  key={iso}
                  className={`${styles.monthCell} ${!enMes ? styles.monthCellMuted : ''} ${active ? styles.monthCellActive : ''} ${esHoy ? styles.monthCellToday : ''}`}
                  onClick={() => selectDate(d)}
                >
                  <span className={styles.monthCellNum}>{d.getDate()}</span>
                  {citasDia.length > 0 && (
                    <span className={styles.monthCellDots}>
                      {estadosPresentes.map((idEst) => (
                        <span
                          key={idEst}
                          className={`${styles.miniDot} ${styles[estadoInfo(idEst).badgeClass]}`}
                        />
                      ))}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className={styles.agendaToolbar}>
        <div className={styles.datePill}>
          <CalendarDays size={15} />
          {fmtFecha(selectedDateObj)}
        </div>
        <div className="d-flex gap-2 flex-wrap">
          <select
            className={styles.filterSelect}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Todos los estados</option>
            {ESTADO_CITA_CAT.map((e) => (
              <option key={e.IdEstadoCita} value={e.IdEstadoCita}>{e.Nombre}</option>
            ))}
          </select>
          <button className={styles.btnSoft}>Exportar agenda</button>
        </div>
      </div>

      <div className={styles.agendaBody}>
        {cargandoAgenda && (
          <div className={styles.emptyState}>
            <PawPrint size={22} />
            Cargando agenda real...
          </div>
        )}

        {!cargandoAgenda && (
          <div className={styles.scheduleList}>
            {!horarioDia && (
              <div className={styles.emptyState}>
                <PawPrint size={22} />
                El veterinario no atiende este día.
              </div>
            )}

            {horarioDia && citasDelDia.length === 0 && (
              <div className={styles.emptyState}>
                <PawPrint size={22} />
                No hay citas agendadas para este día.
              </div>
            )}

            {citasDelDia.map((c) => {
              const est = estadoInfo(c.IdEstadoCita) || ESTADO_CITA_CAT[0];
              const tipo = tipoInfo(c.IdTipoServicio);
              const Icon = tipo ? tipo.icon : Stethoscope;
              const horaInicio = typeof c.HoraInicio === 'string' ? c.HoraInicio : `${String(c.HoraInicio.hours || 0).padStart(2, '0')}:${String(c.HoraInicio.minutes || 0).padStart(2, '0')}`;
              const { hora, suf } = fmtHora(horaInicio.length >= 5 ? horaInicio.slice(0, 5) : horaInicio);
              const active = selectedCita?.IdCita === c.IdCita;
              return (
                <div
                  key={c.IdCita}
                  className={`${styles.scheduleItem} ${active ? styles.scheduleItemActive : ''}`}
                  onClick={() => setSelectedCita(c)}
                >
                  <div className={styles.timeBox}>
                    {hora}
                    <span>{suf}</span>
                  </div>

                  <div className={styles.patientInfo}>
                    <div className={styles.petIcon}><Icon size={20} /></div>
                    <div>
                      <div className={styles.patientTitle}>{c.NombreMascota} — {c.NombreServicio}</div>
                      <div className={styles.patientDetail}>{c.Especie} · Dueño: {c.NombreCliente}</div>
                    </div>
                  </div>

                  <span className={`${styles.statusBadge} ${styles[est.badgeClass]}`}>{est.Nombre}</span>
                </div>
              );
            })}
          </div>
        )}

        {selectedCita && (() => {
          const est = estadoInfo(selectedCita.IdEstadoCita) || ESTADO_CITA_CAT[0];
          const tipo = tipoInfo(selectedCita.IdTipoServicio);
          const Icon = tipo ? tipo.icon : Stethoscope;
          return (
            <div className={styles.detailPanel}>
              <button className={styles.detailClose} onClick={() => setSelectedCita(null)} aria-label="Cerrar">
                <X size={16} />
              </button>

              <span className={`${styles.statusBadge} ${styles[est.badgeClass]}`}>{est.Nombre}</span>
              <div className={styles.detailTitle}>{selectedCita.NombreMascota}</div>
              <div className={styles.detailSub}>{selectedCita.Especie}</div>

              <div className={styles.detailRow}>
                <Clock size={15} />
                <div>
                  <div className={styles.detailLabel}>Horario</div>
                  {fmtHora(selectedCita.HoraInicio).hora} {fmtHora(selectedCita.HoraInicio).suf} – {fmtHora(selectedCita.HoraFin).hora} {fmtHora(selectedCita.HoraFin).suf}
                </div>
              </div>

              <div className={styles.detailRow}>
                <User size={15} />
                <div>
                  <div className={styles.detailLabel}>Dueño</div>
                  {selectedCita.NombreCliente}
                </div>
              </div>

              <div className={styles.detailRow}>
                <Icon size={15} />
                <div>
                  <div className={styles.detailLabel}>Servicio</div>
                  {selectedCita.NombreServicio}
                </div>
              </div>

              {selectedCita.Notas && (
                <div className={styles.detailRow}>
                  <FileText size={15} />
                  <div>
                    <div className={styles.detailLabel}>Notas</div>
                    {selectedCita.Notas}
                  </div>
                </div>
              )}

              {!reprogramando && (
                <div className={styles.detailActions}>
                  <button className={styles.btnMain} onClick={() => updateEstado(selectedCita.IdCita, 2)}>
                    <Check size={14} /> Confirmar
                  </button>
                  <button className={styles.btnSoft} onClick={() => updateEstado(selectedCita.IdCita, 4)}>
                    Completar
                  </button>
                  <button className={styles.btnSoft} onClick={iniciarReprogramar}>
                    <Repeat size={14} /> Reprogramar
                  </button>
                  <button className={styles.btnDanger} onClick={() => updateEstado(selectedCita.IdCita, 3)}>
                    <Ban size={14} /> Cancelar
                  </button>
                </div>
              )}

              {reprogramando && (
                <div className={styles.reprogramarBox}>
                  <div className={styles.detailLabel}>Nueva fecha</div>
                  <input
                    type="date"
                    className={styles.dateInput}
                    value={nuevaFecha}
                    onChange={(e) => setNuevaFecha(e.target.value)}
                  />

                  <div className={styles.detailLabel} style={{ marginTop: '.7rem' }}>Nueva hora</div>
                  {opcionesHora.length === 0 && (
                    <div className={styles.noSlotsMsg}>El veterinario no atiende ese día.</div>
                  )}
                  {opcionesHora.length > 0 && (
                    <select
                      className={styles.dateInput}
                      value={nuevaHora}
                      onChange={(e) => setNuevaHora(e.target.value)}
                    >
                      {opcionesHora.map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  )}

                  <div className={styles.detailActions}>
                    <button
                      className={styles.btnMain}
                      onClick={guardarReprogramacion}
                      disabled={opcionesHora.length === 0}
                    >
                      <Check size={14} /> Guardar cambios
                    </button>
                    <button className={styles.btnSoft} onClick={() => setReprogramando(false)}>
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })()}
      </div>
    </div>
  );
};

export default AgendaDiariaVeterinario;