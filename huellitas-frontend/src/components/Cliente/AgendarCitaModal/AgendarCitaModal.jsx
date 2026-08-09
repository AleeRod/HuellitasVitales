import React, { useEffect, useMemo, useState } from 'react';
import styles from './AgendarCitaModal.module.css';
import { API_BASE } from '../../../api/config';
import {
  X,
  ChevronLeft,
  ChevronRight,
  PawPrint,
  Stethoscope,
  Scissors,
  Syringe,
  Clock,
  CalendarDays,
  FileText,
  CheckCircle2,
  Dog,
  Cat,
  Search,
} from 'lucide-react';

/* -------------------------------------------------------------------------
   Componente reutilizable en dos zonas:
   - Marketplace: se le pasa `servicioInicial` ya elegido -> arranca en "mascota".
   - Dashboard del cliente: sin `servicioInicial` -> primer paso es elegir
     el servicio, usando el mismo endpoint real que ya usa el Marketplace
     (/marketplace/catalogo), para no inventar una segunda fuente de datos.

   Lo que SIGUE siendo mock, porque el backend todavía no lo tiene:
   - Mascotas del cliente (falta endpoint de mascotas)
   - Horario laboral del veterinario / disponibilidad real (#184)
   - Citas ya ocupadas (para no chocar horarios, #187)
   Cuando esos endpoints existan, se reemplazan los bloques MOCK de abajo
   por fetch reales — la forma de los datos ya está pensada para calzar.
------------------------------------------------------------------------- */

const HORARIO_VETERINARIO_MOCK = [
  { DiaSemana: 1, HoraInicio: '08:00', HoraFin: '17:00' },
  { DiaSemana: 2, HoraInicio: '08:00', HoraFin: '17:00' },
  { DiaSemana: 3, HoraInicio: '08:00', HoraFin: '17:00' },
  { DiaSemana: 4, HoraInicio: '08:00', HoraFin: '17:00' },
  { DiaSemana: 5, HoraInicio: '08:00', HoraFin: '17:00' },
  { DiaSemana: 6, HoraInicio: '08:00', HoraFin: '12:00' },
];

const CITAS_OCUPADAS_MOCK = [
  { idVeterinario: 1, FechaOffset: 0, HoraInicio: '09:00', HoraFin: '09:30' },
  { idVeterinario: 1, FechaOffset: 1, HoraInicio: '10:00', HoraFin: '10:30' },
];

const MIS_MASCOTAS_MOCK = [
  { IdMascota: 1, Nombre: 'Max', Especie: 'Perro', Raza: 'Golden Retriever' },
  { IdMascota: 2, Nombre: 'Luna', Especie: 'Gato', Raza: 'Persa' },
  { IdMascota: 3, Nombre: 'Rocky', Especie: 'Perro', Raza: 'French Poodle' },
];

const today = new Date();
const addDays = (d, n) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};
const toISO = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.toISOString().slice(0, 10);
};
const toMin = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};
const minToHHMM = (min) => `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
const fmtHora12 = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  const suf = h >= 12 ? 'p.m.' : 'a.m.';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${suf}`;
};
const fmtDiaCorto = (d) => d.toLocaleDateString('es-CR', { weekday: 'short' }).replace('.', '').toUpperCase();
const fmtFechaLarga = (d) => d.toLocaleDateString('es-CR', { weekday: 'long', day: 'numeric', month: 'long' });
const fmtColones = (n) => `₡${Number(n).toLocaleString('es-CR')}`;

const especieIcon = (especie) => (especie === 'Gato' ? Cat : Dog);

const iconoPorTipo = (tipoLabel = '') => {
  const t = tipoLabel.toLowerCase();
  if (t.includes('groom') || t.includes('baño') || t.includes('peluq')) return Scissors;
  if (t.includes('procedimiento') || t.includes('vacun')) return Syringe;
  return Stethoscope;
};

const AgendarCitaModal = ({ open, onClose, servicioInicial = null, onConfirm }) => {
  const [servicioElegido, setServicioElegido] = useState(null);
  const [busquedaServicio, setBusquedaServicio] = useState('');
  const [serviciosDisponibles, setServiciosDisponibles] = useState([]);
  const [cargandoServicios, setCargandoServicios] = useState(false);
  const [errorServicios, setErrorServicios] = useState(false);

  const [pasoIdx, setPasoIdx] = useState(0);
  const [idMascota, setIdMascota] = useState(null);
  const [fechaSel, setFechaSel] = useState(toISO(today));
  const [horaSel, setHoraSel] = useState(null);
  const [notas, setNotas] = useState('');
  const [exito, setExito] = useState(false);

  const servicio = servicioInicial || servicioElegido;
  const pasosBase = servicioInicial ? ['mascota', 'horario', 'confirmar'] : ['servicio', 'mascota', 'horario', 'confirmar'];

  // Reset cada vez que se abre, y trae el catálogo real si hay que elegir servicio
  useEffect(() => {
    if (!open) return;
    setPasoIdx(0);
    setServicioElegido(null);
    setBusquedaServicio('');
    setIdMascota(null);
    setFechaSel(toISO(today));
    setHoraSel(null);
    setNotas('');
    setExito(false);

    if (!servicioInicial) {
      setCargandoServicios(true);
      setErrorServicios(false);
      fetch(`${API_BASE}/marketplace/catalogo`)
        .then((res) => {
          if (!res.ok) throw new Error('No se pudo cargar el catálogo');
          return res.json();
        })
        .then((data) => setServiciosDisponibles(data.servicios || []))
        .catch(() => setErrorServicios(true))
        .finally(() => setCargandoServicios(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, servicioInicial]);

  const idVeterinario = servicio?.idVeterinario ?? null;
  const nombreVeterinario = servicio ? (servicio.nombreVeterinario || `Equipo de ${servicio.nombreComercio}`) : '';
  const mascota = MIS_MASCOTAS_MOCK.find((m) => m.IdMascota === idMascota);
  const Icon = servicio ? iconoPorTipo(servicio.tipoServicio) : Stethoscope;

  const serviciosFiltrados = useMemo(() => {
    const q = busquedaServicio.trim().toLowerCase();
    if (!q) return serviciosDisponibles;
    return serviciosDisponibles.filter(
      (s) => s.nombreServicio?.toLowerCase().includes(q) || s.nombreComercio?.toLowerCase().includes(q)
    );
  }, [serviciosDisponibles, busquedaServicio]);

  const proximosDias = useMemo(() => Array.from({ length: 14 }, (_, i) => addDays(today, i)), []);

  const horarioDia = (iso) => {
    const dow = new Date(`${iso}T00:00:00`).getDay();
    return HORARIO_VETERINARIO_MOCK.find((h) => h.DiaSemana === dow);
  };

  const slotsDisponibles = useMemo(() => {
    if (!servicio) return [];
    const h = horarioDia(fechaSel);
    if (!h) return [];
    const dur = Number(servicio.duracionMinutos) || 30;
    const ocupados = CITAS_OCUPADAS_MOCK.filter(
      (c) => c.idVeterinario === idVeterinario && toISO(addDays(today, c.FechaOffset)) === fechaSel
    );
    const out = [];
    for (let m = toMin(h.HoraInicio); m + dur <= toMin(h.HoraFin); m += 30) {
      const fin = m + dur;
      const choca = ocupados.some((c) => m < toMin(c.HoraFin) && fin > toMin(c.HoraInicio));
      if (!choca) out.push(minToHHMM(m));
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fechaSel, servicio]);

  const paso = pasosBase[pasoIdx];
  const totalPasos = pasosBase.length;

  const puedeAvanzar =
    (paso === 'servicio' && !!servicio) ||
    (paso === 'mascota' && !!idMascota) ||
    (paso === 'horario' && !!horaSel) ||
    paso === 'confirmar';

  const siguiente = () => {
    if (paso === 'confirmar') {
      const horaFin = minToHHMM(toMin(horaSel) + (Number(servicio.duracionMinutos) || 30));
      const nuevaCita = {
        idMascota,
        nombreMascota: mascota.Nombre,
        idVeterinario,
        nombreVeterinario,
        idServicio: servicio.idServicio,
        nombreServicio: servicio.nombreServicio,
        fecha: fechaSel,
        horaInicio: horaSel,
        horaFin,
        notas,
      };
      onConfirm && onConfirm(nuevaCita);
      setExito(true);
      return;
    }
    setPasoIdx((i) => Math.min(i + 1, totalPasos - 1));
  };

  const atras = () => setPasoIdx((i) => Math.max(i - 1, 0));

  if (!open) return null;

  return (
    <div className={styles.acmRoot}>
      <div className={styles.backdrop} onClick={onClose} />
      <div className={styles.modal} role="dialog" aria-modal="true">
        <button className={styles.closeBtn} onClick={onClose} aria-label="Cerrar">
          <X size={18} />
        </button>

        {!exito && (
          <>
            <div className={styles.header}>
              <div className={styles.eyebrow}>{servicio ? servicio.nombreComercio : 'Huellitas Vitales'}</div>
              <h2 className={styles.title}>{servicio ? servicio.nombreServicio : 'Agendar cita'}</h2>
              <div className={styles.stepDots}>
                {pasosBase.map((p, i) => (
                  <span key={p} className={`${styles.stepDot} ${i <= pasoIdx ? styles.stepDotActive : ''}`} />
                ))}
              </div>
            </div>

            <div className={styles.body}>
              {paso === 'servicio' && (
                <>
                  <div className={styles.searchRow}>
                    <Search size={16} />
                    <input
                      className={styles.searchInput}
                      placeholder="Buscar servicio o clínica..."
                      value={busquedaServicio}
                      onChange={(e) => setBusquedaServicio(e.target.value)}
                    />
                  </div>

                  {cargandoServicios && <div className={styles.noSlots}>Cargando servicios disponibles...</div>}
                  {errorServicios && <div className={styles.noSlots}>No pudimos cargar los servicios. Intentá de nuevo más tarde.</div>}

                  {!cargandoServicios && !errorServicios && (
                    <div className={styles.serviceScroll}>
                      {serviciosFiltrados.length === 0 && (
                        <div className={styles.noSlots}>No encontramos servicios con ese nombre.</div>
                      )}
                      {serviciosFiltrados.map((s) => {
                        const SIcon = iconoPorTipo(s.tipoServicio);
                        const active = servicioElegido?.idServicio === s.idServicio;
                        return (
                          <button
                            key={s.idServicio}
                            className={`${styles.optionCard} ${active ? styles.optionCardActive : ''}`}
                            onClick={() => setServicioElegido(s)}
                          >
                            <div className={styles.optionIcon}><SIcon size={20} /></div>
                            <div className={styles.optionTitle}>{s.nombreServicio}</div>
                            <div className={styles.optionSub}>{s.tipoServicio} · {s.nombreComercio}</div>
                            <div className={styles.optionMeta}>{fmtColones(s.precio)} · {s.duracionMinutos} min</div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </>
              )}

              {paso === 'mascota' && (
                <div className={styles.grid2}>
                  {MIS_MASCOTAS_MOCK.map((m) => {
                    const MIcon = especieIcon(m.Especie);
                    const active = idMascota === m.IdMascota;
                    return (
                      <button
                        key={m.IdMascota}
                        className={`${styles.optionCard} ${active ? styles.optionCardActive : ''}`}
                        onClick={() => setIdMascota(m.IdMascota)}
                      >
                        <div className={styles.optionIcon}><MIcon size={20} /></div>
                        <div className={styles.optionTitle}>{m.Nombre}</div>
                        <div className={styles.optionSub}>{m.Especie} · {m.Raza}</div>
                      </button>
                    );
                  })}
                </div>
              )}

              {paso === 'horario' && (
                <>
                  <div className={styles.dayScroll}>
                    {proximosDias.map((d) => {
                      const iso = toISO(d);
                      const active = iso === fechaSel;
                      const disponible = !!horarioDia(iso);
                      return (
                        <button
                          key={iso}
                          disabled={!disponible}
                          className={`${styles.dayChip} ${active ? styles.dayChipActive : ''} ${!disponible ? styles.dayChipDisabled : ''}`}
                          onClick={() => {
                            setFechaSel(iso);
                            setHoraSel(null);
                          }}
                        >
                          <span>{fmtDiaCorto(d)}</span>
                          <strong>{d.getDate()}</strong>
                        </button>
                      );
                    })}
                  </div>

                  <div className={styles.slotsLabel}>
                    <Clock size={14} /> Horarios disponibles — {fmtFechaLarga(new Date(`${fechaSel}T00:00:00`))}
                  </div>
                  <div className={styles.slotsGrid}>
                    {slotsDisponibles.length === 0 && (
                      <div className={styles.noSlots}>No hay horarios disponibles este día. Probá con otra fecha.</div>
                    )}
                    {slotsDisponibles.map((h) => (
                      <button
                        key={h}
                        className={`${styles.slotBtn} ${horaSel === h ? styles.slotBtnActive : ''}`}
                        onClick={() => setHoraSel(h)}
                      >
                        {fmtHora12(h)}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {paso === 'confirmar' && mascota && (
                <>
                  <div className={styles.summaryCard}>
                    <div className={styles.summaryRow}>
                      <CalendarDays size={16} />
                      <div>
                        <div className={styles.summaryLabel}>Fecha y hora</div>
                        {fmtFechaLarga(new Date(`${fechaSel}T00:00:00`))} · {fmtHora12(horaSel)}
                      </div>
                    </div>
                    <div className={styles.summaryRow}>
                      <PawPrint size={16} />
                      <div>
                        <div className={styles.summaryLabel}>Mascota</div>
                        {mascota.Nombre} ({mascota.Raza})
                      </div>
                    </div>
                    <div className={styles.summaryRow}>
                      <Icon size={16} />
                      <div>
                        <div className={styles.summaryLabel}>Servicio</div>
                        {servicio.nombreServicio} · {fmtColones(servicio.precio)}
                      </div>
                    </div>
                    <div className={styles.summaryRow}>
                      <FileText size={16} />
                      <div>
                        <div className={styles.summaryLabel}>Atiende</div>
                        {nombreVeterinario}
                      </div>
                    </div>
                  </div>

                  <label className={styles.notesLabel}>Notas para el veterinario (opcional)</label>
                  <textarea
                    className={styles.notesInput}
                    rows={3}
                    placeholder="Ej: mi mascota tiene alergias, o síntomas que quieras mencionar..."
                    value={notas}
                    onChange={(e) => setNotas(e.target.value)}
                  />
                </>
              )}
            </div>

            <div className={styles.footer}>
              {pasoIdx > 0 && (
                <button className={styles.btnGhost} onClick={atras}>
                  <ChevronLeft size={16} /> Atrás
                </button>
              )}
              <button className={styles.btnPrimary} disabled={!puedeAvanzar} onClick={siguiente}>
                {paso === 'confirmar' ? 'Confirmar cita' : 'Continuar'}
                {paso !== 'confirmar' && <ChevronRight size={16} />}
              </button>
            </div>
          </>
        )}

        {exito && mascota && servicio && (
          <div className={styles.successView}>
            <div className={styles.successIcon}><CheckCircle2 size={40} /></div>
            <h2 className={styles.successTitle}>¡Cita solicitada!</h2>
            <p className={styles.successText}>
              Quedó <strong>pendiente de confirmación</strong> por parte de {nombreVeterinario}. Te avisaremos cuando la confirme.
            </p>
            <div className={styles.summaryCard}>
              <div className={styles.summaryRow}>
                <CalendarDays size={16} />
                <div>{fmtFechaLarga(new Date(`${fechaSel}T00:00:00`))} · {fmtHora12(horaSel)}</div>
              </div>
              <div className={styles.summaryRow}>
                <PawPrint size={16} />
                <div>{mascota.Nombre} — {servicio.nombreServicio}</div>
              </div>
            </div>
            <button className={styles.btnPrimary} onClick={onClose}>Listo</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgendarCitaModal;