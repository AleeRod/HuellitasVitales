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

   Los horarios disponibles YA consultan el horario real del veterinario y las
   citas que ya tiene ocupadas (GET /api/agenda/disponibilidad) — antes usaban un
   horario inventado igual para todos (8am-5pm de lunes a viernes, 8am-12pm
   sábado) sin importar el veterinario ni lo que ya tenía agendado, así que
   mostraba horas que en realidad no estaban libres.
------------------------------------------------------------------------- */

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
  const [mascotas, setMascotas] = useState([]);
  const [cargandoServicios, setCargandoServicios] = useState(false);
  const [cargandoMascotas, setCargandoMascotas] = useState(false);
  const [errorServicios, setErrorServicios] = useState(false);
  const [errorMascotas, setErrorMascotas] = useState(false);

  const [pasoIdx, setPasoIdx] = useState(0);
  const [idMascota, setIdMascota] = useState(null);
  const [fechaSel, setFechaSel] = useState(toISO(today));
  const [horaSel, setHoraSel] = useState(null);
  const [notas, setNotas] = useState('');
  const [exito, setExito] = useState(false);
  const [horariosDisponibles, setHorariosDisponibles] = useState([]);
  const [cargandoHorarios, setCargandoHorarios] = useState(false);
  const [errorHorarios, setErrorHorarios] = useState(false);

  const servicio = servicioInicial || servicioElegido;
  const pasosBase = servicioInicial ? ['mascota', 'horario', 'confirmar'] : ['servicio', 'mascota', 'horario', 'confirmar'];

  useEffect(() => {
    const cargarMascotas = async () => {
      const token = localStorage.getItem('token_huellitas') || localStorage.getItem('jwt') || localStorage.getItem('token');
      if (!token) {
        setMascotas([]);
        return;
      }

      try {
        setCargandoMascotas(true);
        setErrorMascotas(false);
        const res = await fetch(`${API_BASE}/usuario/mascotas`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.mensaje || 'No se pudo cargar tus mascotas.');
        setMascotas(Array.isArray(data?.mascotas) ? data.mascotas : []);
      } catch (error) {
        console.error('Mascotas del usuario:', error);
        setMascotas([]);
        setErrorMascotas(true);
      } finally {
        setCargandoMascotas(false);
      }
    };

    if (!open) return;
    setPasoIdx(0);
    setServicioElegido(null);
    setBusquedaServicio('');
    setIdMascota(null);
    setFechaSel(toISO(today));
    setHoraSel(null);
    setNotas('');
    setExito(false);
    cargarMascotas();

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
  const mascota = mascotas.find((m) => Number(m.idMascota ?? m.IdMascota) === Number(idMascota));
  const Icon = servicio ? iconoPorTipo(servicio.tipoServicio) : Stethoscope;

  const serviciosFiltrados = useMemo(() => {
    const q = busquedaServicio.trim().toLowerCase();
    if (!q) return serviciosDisponibles;
    return serviciosDisponibles.filter(
      (s) => s.nombreServicio?.toLowerCase().includes(q) || s.nombreComercio?.toLowerCase().includes(q)
    );
  }, [serviciosDisponibles, busquedaServicio]);

  const proximosDias = useMemo(() => Array.from({ length: 14 }, (_, i) => addDays(today, i)), []);

  // Horario real del veterinario para ese día + citas que ya tiene ocupadas — antes esto era
  // un horario inventado igual para todos (8am-5pm todos los días), así que aparecían horas
  // que en realidad no estaban disponibles.
  useEffect(() => {
    if (!servicio) return;
    if (!idVeterinario) {
      setHorariosDisponibles([]);
      setCargandoHorarios(false);
      setErrorHorarios(false);
      return;
    }

    let cancelado = false;
    const cargarDisponibilidad = async () => {
      setCargandoHorarios(true);
      setErrorHorarios(false);
      try {
        const dur = Number(servicio.duracionMinutos) || 30;
        const url = `${API_BASE}/agenda/disponibilidad?idVeterinario=${idVeterinario}&fecha=${fechaSel}&duracionMinutos=${dur}`;
        const res = await fetch(url);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.mensaje || 'No se pudo consultar la disponibilidad del veterinario.');
        if (!cancelado) setHorariosDisponibles(Array.isArray(data.horasDisponibles) ? data.horasDisponibles : []);
      } catch (error) {
        console.error('Disponibilidad del veterinario:', error);
        if (!cancelado) {
          setHorariosDisponibles([]);
          setErrorHorarios(true);
        }
      } finally {
        if (!cancelado) setCargandoHorarios(false);
      }
    };

    cargarDisponibilidad();
    return () => {
      cancelado = true;
    };
  }, [servicio, idVeterinario, fechaSel]);

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
        nombreMascota: mascota.nombre || mascota.Nombre,
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
                  {cargandoMascotas && <div className={styles.noSlots}>Cargando tus mascotas...</div>}
                  {!cargandoMascotas && errorMascotas && (
                    <div className={styles.noSlots}>No pudimos cargar tus mascotas. Intenta nuevamente.</div>
                  )}
                  {!cargandoMascotas && !errorMascotas && mascotas.length === 0 && (
                    <div className={styles.noSlots}>Todavía no tienes mascotas vinculadas a tu cuenta.</div>
                  )}
                  {!cargandoMascotas && !errorMascotas && mascotas.map((m) => {
                    const especie = m.especie || m.Especie || 'Otra';
                    const nombre = m.nombre || m.Nombre;
                    const raza = m.raza || m.Raza || 'Sin raza';
                    const id = Number(m.idMascota ?? m.IdMascota);
                    const MIcon = especieIcon(especie);
                    const active = idMascota === id;
                    return (
                      <button
                        key={id}
                        className={`${styles.optionCard} ${active ? styles.optionCardActive : ''}`}
                        onClick={() => setIdMascota(id)}
                      >
                        <div className={styles.optionIcon}><MIcon size={20} /></div>
                        <div className={styles.optionTitle}>{nombre}</div>
                        <div className={styles.optionSub}>{especie} · {raza}</div>
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
                      return (
                        <button
                          key={iso}
                          className={`${styles.dayChip} ${active ? styles.dayChipActive : ''}`}
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
                    {!idVeterinario && (
                      <div className={styles.noSlots}>Este servicio todavía no tiene un veterinario asignado — comunicate con la clínica para coordinar un horario.</div>
                    )}
                    {idVeterinario && cargandoHorarios && (
                      <div className={styles.noSlots}>Consultando la disponibilidad del veterinario...</div>
                    )}
                    {idVeterinario && !cargandoHorarios && errorHorarios && (
                      <div className={styles.noSlots}>No pudimos consultar la disponibilidad. Probá de nuevo más tarde.</div>
                    )}
                    {idVeterinario && !cargandoHorarios && !errorHorarios && horariosDisponibles.length === 0 && (
                      <div className={styles.noSlots}>No hay horarios disponibles este día. Probá con otra fecha.</div>
                    )}
                    {idVeterinario && !cargandoHorarios && !errorHorarios && horariosDisponibles.map((h) => (
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
                        {mascota.nombre || mascota.Nombre} ({mascota.raza || mascota.Raza || 'sin raza'})
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
                <div>{mascota.nombre || mascota.Nombre} — {servicio.nombreServicio}</div>
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