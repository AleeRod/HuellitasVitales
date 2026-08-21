import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, MapPin, FileWarning, Send, Stethoscope, Clock, CheckCircle2, X, Phone } from 'lucide-react';

import ClienteLayout from '../../components/Cliente/ClienteLayout/ClienteLayout';
import MascotaChips from '../../components/Cliente/MascotaChips/MascotaChips';
import ExpedienteBadge from '../../components/Cliente/ExpedienteBadge/ExpedienteBadge';
import SelectorVeterinaria from '../../components/Cliente/SelectorVeterinaria/SelectorVeterinaria';
import { API_BASE } from '../../api/config';
import { ToastContainer } from '../../components/Toast/Toast';
import { useToast } from '../../components/Toast/useToast';
import styles from './SolicitarEmergencia.module.css';

const FORM_VACIO = { ubicacion: '', motivo: '', descripcion: '' };
const FORM_EXTERNA_VACIO = { nombreVeterinarioExterno: '', nombreClinicaExterna: '', diagnostico: '', tratamiento: '' };
const MOTIVOS_RAPIDOS = ['Accidente / trauma', 'Envenenamiento', 'Dificultad para respirar', 'Sangrado', 'Convulsiones'];
const HOLD_MS = 1400; // tiempo que hay que mantener presionado el botón SOS
const RADIO_ANILLO = 54;
const CIRCUNFERENCIA = 2 * Math.PI * RADIO_ANILLO;

const ESTADO_INFO = {
  Solicitada: { texto: 'Solicitada', clase: styles.estadoSolicitada, icono: Clock },
  Aceptada: { texto: 'Aceptada', clase: styles.estadoAceptada, icono: CheckCircle2 },
  EnAtencion: { texto: 'En atención', clase: styles.estadoEnAtencion, icono: Stethoscope },
  Finalizada: { texto: 'Finalizada', clase: styles.estadoFinalizada, icono: CheckCircle2 },
};

export default function SolicitarEmergencia() {
  const [mascotas, setMascotas] = useState([]);
  const [mascotaId, setMascotaId] = useState('');
  const [expedienteBasico, setExpedienteBasico] = useState(null);
  const [detalleExpediente, setDetalleExpediente] = useState(null);
  const [cargandoExpediente, setCargandoExpediente] = useState(false);
  const [form, setForm] = useState(FORM_VACIO);
  const [enviando, setEnviando] = useState(false);
  const [disponibilidad, setDisponibilidad] = useState(null);
  const [misEmergencias, setMisEmergencias] = useState([]);
  const [emergenciaExterna, setEmergenciaExterna] = useState(null);
  const [formExterna, setFormExterna] = useState(FORM_EXTERNA_VACIO);
  const [veterinarias, setVeterinarias] = useState([]);
  const [veterinariaElegida, setVeterinariaElegida] = useState('');
  const [mostrarSelectorVeterinaria, setMostrarSelectorVeterinaria] = useState(false);
  const [perfil, setPerfil] = useState(null);
  const [telefonoContacto, setTelefonoContacto] = useState('');
  const [filtroHistorial, setFiltroHistorial] = useState('todas');
  const [expandidaId, setExpandidaId] = useState(null);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [manteniendo, setManteniendo] = useState(false);
  const [activado, setActivado] = useState(false);
  const holdTimeoutRef = useRef(null);
  const flashTimeoutRef = useRef(null);
  const { toasts, showToast, removeToast } = useToast();

  const headers = () => ({ Authorization: `Bearer ${localStorage.getItem('token_huellitas')}` });

  // Botón SOS "mantené presionado": al soltar antes de tiempo se cancela sin abrir nada — es
  // a propósito, para que una emergencia no se dispare con un toque accidental.
  const iniciarPresionSos = (e) => {
    e.preventDefault();
    setManteniendo(true);
    holdTimeoutRef.current = setTimeout(() => {
      setManteniendo(false);
      setActivado(true);
      setModalAbierto(true);
      flashTimeoutRef.current = setTimeout(() => setActivado(false), 600);
    }, HOLD_MS);
  };

  const cancelarPresionSos = () => {
    setManteniendo(false);
    if (holdTimeoutRef.current) {
      clearTimeout(holdTimeoutRef.current);
      holdTimeoutRef.current = null;
    }
  };

  useEffect(() => () => {
    if (holdTimeoutRef.current) clearTimeout(holdTimeoutRef.current);
    if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
  }, []);

  const cerrarModalEmergencia = () => {
    setModalAbierto(false);
    setMascotaId('');
    setExpedienteBasico(null);
    setDetalleExpediente(null);
    setDisponibilidad(null);
    setMostrarSelectorVeterinaria(false);
    setVeterinariaElegida('');
    setForm(FORM_VACIO);
  };

  // El teléfono de contacto vive en el perfil del usuario (USUARIO.Telefono), no en la
  // emergencia: así la veterinaria siempre ve el número vigente, y no queda una copia vieja
  // pegada a cada solicitud. Si el cliente todavía no cargó uno, se le pide acá mismo.
  useEffect(() => {
    fetch(`${API_BASE}/usuario/perfil`, { headers: headers() })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d) return;
        setPerfil(d);
        setTelefonoContacto(d.telefono || '');
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetch(`${API_BASE}/usuario/mascotas`, { headers: headers() })
      .then((r) => r.json())
      .then((d) => setMascotas(d.mascotas || []));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Historial de emergencias de TODAS las mascotas del cliente — antes solo se veía la de la
  // mascota seleccionada en ese momento, así que había que ir clickeando una por una para ver
  // todo lo que se pidió.
  const cargarMisEmergencias = async () => {
    const r = await fetch(`${API_BASE}/emergencias/mis-emergencias`, { headers: headers() });
    const d = await r.json().catch(() => ({}));
    setMisEmergencias(d.emergencias || []);
  };

  useEffect(() => {
    cargarMisEmergencias();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Una vez que hay expediente (ya existía, o se acaba de abrir), trae el detalle enriquecido
  // (nombre real de la veterinaria) y la disponibilidad de veterinarios ahora mismo.
  const cargarDetalleYDisponibilidad = async (expediente) => {
    const [rDetalle, rDisp] = await Promise.all([
      fetch(`${API_BASE}/expediente/${expediente.idExpediente}`, { headers: headers() }),
      expediente.idComercioActual
        ? fetch(`${API_BASE}/comercios/${expediente.idComercioActual}/veterinarios-disponibles`, { headers: headers() })
        : Promise.resolve(null),
    ]);
    const detalle = await rDetalle.json();
    if (detalle.success) setDetalleExpediente(detalle.expediente);
    if (rDisp) setDisponibilidad(await rDisp.json());
  };

  const seleccionarMascota = async (id) => {
    setMascotaId(id);
    setExpedienteBasico(null);
    setDetalleExpediente(null);
    setDisponibilidad(null);
    setVeterinariaElegida('');
    setMostrarSelectorVeterinaria(false);
    setCargandoExpediente(true);

    try {
      const r = await fetch(`${API_BASE}/expediente/mascota/${id}`, { headers: headers() });
      const d = await r.json();
      if (!r.ok) {
        // La mascota nunca tuvo una cita, así que no hay expediente todavía. Una emergencia no
        // puede esperar a que el cliente elija veterinaria primero: se abre el expediente solo
        // (sin veterinaria asignada) y se pasa directo al formulario — por defecto la solicitud
        // se manda a todas las veterinarias disponibles.
        const ra = await fetch(`${API_BASE}/expediente/abrir-sin-veterinaria`, {
          method: 'POST',
          headers: { ...headers(), 'Content-Type': 'application/json' },
          body: JSON.stringify({ idMascota: Number(id) }),
        });
        const da = await ra.json();
        if (!ra.ok) {
          showToast(da.mensaje || 'No se pudo iniciar el expediente.', 'error');
          return;
        }
        setExpedienteBasico(da.expediente);
        await cargarDetalleYDisponibilidad(da.expediente);
        return;
      }
      setExpedienteBasico(d.expediente);
      await cargarDetalleYDisponibilidad(d.expediente);
    } finally {
      setCargandoExpediente(false);
    }
  };

  const alternarSelectorVeterinaria = async () => {
    const proximoValor = !mostrarSelectorVeterinaria;
    setMostrarSelectorVeterinaria(proximoValor);
    if (proximoValor && veterinarias.length === 0) {
      try {
        const rv = await fetch(`${API_BASE}/comercio/buscar?q=`, { headers: headers() });
        const dv = await rv.json();
        const lista = Array.isArray(dv) ? dv : dv.comercios || [];
        setVeterinarias(lista.filter((c) => (c.idTipoComercio ?? c.IdTipoComercio) === 1));
      } catch {
        showToast('No se pudieron cargar las veterinarias.', 'error');
      }
    }
  };

  const enviar = async (e) => {
    e.preventDefault();
    if (!expedienteBasico) return showToast('Selecciona una mascota con expediente.', 'warning');
    if (!telefonoContacto.trim()) return showToast('Agregá un teléfono de contacto para que la veterinaria pueda comunicarse con vos.', 'warning');

    const eligioVeterinariaPuntual = mostrarSelectorVeterinaria && veterinariaElegida;

    setEnviando(true);
    try {
      // Si el teléfono es nuevo o cambió respecto al perfil, se guarda ahí — es la única
      // fuente de verdad que después consulta la veterinaria (no viaja duplicado dentro de
      // la emergencia).
      if (perfil && telefonoContacto.trim() !== (perfil.telefono || '')) {
        await fetch(`${API_BASE}/usuario/perfil`, {
          method: 'PUT',
          headers: { ...headers(), 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nombre: perfil.nombre || '',
            apellidos: perfil.apellidos || '',
            correo: perfil.correo || '',
            telefono: telefonoContacto.trim(),
          }),
        });
        setPerfil((prev) => (prev ? { ...prev, telefono: telefonoContacto.trim() } : prev));
      }

      const cuerpo = eligioVeterinariaPuntual ? { ...form, idComercio: Number(veterinariaElegida) } : form;
      const r = await fetch(`${API_BASE}/expedientes/${expedienteBasico.idExpediente}/emergencias`, {
        method: 'POST',
        headers: { ...headers(), 'Content-Type': 'application/json' },
        body: JSON.stringify(cuerpo),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.mensaje || 'No se pudo enviar la emergencia.');

      showToast(
        eligioVeterinariaPuntual
          ? 'Solicitud de emergencia enviada a la veterinaria elegida.'
          : 'Solicitud de emergencia enviada a todas las veterinarias disponibles.',
        'success'
      );
      cerrarModalEmergencia();
      cargarMisEmergencias();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setEnviando(false);
    }
  };

  const abrirAtencionExterna = (emergencia) => {
    setEmergenciaExterna(emergencia);
    setFormExterna(FORM_EXTERNA_VACIO);
  };

  const guardarAtencionExterna = async (e) => {
    e.preventDefault();
    // Se usa el idExpediente de la propia emergencia (no el de la mascota seleccionada): el
    // historial ahora es global, así que puede estar cerrando una emergencia de cualquiera de
    // sus mascotas, no solo la que tenga elegida en ese momento.
    const r = await fetch(`${API_BASE}/expedientes/${emergenciaExterna.idExpediente}/emergencias/${emergenciaExterna.idEmergencia}/atencion-externa`, {
      method: 'PUT',
      headers: { ...headers(), 'Content-Type': 'application/json' },
      body: JSON.stringify(formExterna),
    });
    const d = await r.json();
    if (!r.ok) return showToast(d.mensaje || 'No se pudo registrar la atención.', 'error');

    showToast('Atención externa registrada. La emergencia quedó cerrada.', 'success');
    setEmergenciaExterna(null);
    cargarMisEmergencias();
  };

  const formatFecha = (fechaISO) => {
    if (!fechaISO) return '';
    return new Date(fechaISO).toLocaleString('es-CR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <ClienteLayout activo="emergencia">
      <div className={styles.panel}>
        <div className={styles.hero}>
          <div className={styles.heroIcono}><AlertTriangle size={26} /></div>
          <div>
            <h1 className={styles.heroTitulo}>¿Tu mascota necesita atención inmediata?</h1>
            <p className={styles.heroSub}>Mantené presionado el botón para avisarle al instante a todas las veterinarias disponibles.</p>
          </div>
        </div>
      </div>

      {/* Fuera de .panel (que tiene un ancho tope de 780px) para que el botón quede
          realmente centrado en todo el ancho de la página, no solo dentro de esa columna. */}
      <div className={styles.sosSeccion}>
        <div className={styles.botonSosHalo}>
          <button
            type="button"
            className={`${styles.botonSos} ${manteniendo ? styles.botonSosPresionando : ''} ${activado ? styles.botonSosActivado : ''}`}
            onPointerDown={iniciarPresionSos}
            onPointerUp={cancelarPresionSos}
            onPointerLeave={cancelarPresionSos}
            onPointerCancel={cancelarPresionSos}
            onContextMenu={(e) => e.preventDefault()}
          >
            <svg className={styles.botonSosRing} viewBox="0 0 120 120">
              <circle className={styles.botonSosRingFondo} cx="60" cy="60" r={RADIO_ANILLO} />
              <circle
                className={styles.botonSosRingRelleno}
                cx="60" cy="60" r={RADIO_ANILLO}
                style={{
                  strokeDasharray: CIRCUNFERENCIA,
                  strokeDashoffset: manteniendo ? 0 : CIRCUNFERENCIA,
                  transitionDuration: manteniendo ? `${HOLD_MS}ms` : '150ms',
                }}
              />
            </svg>
            <span className={styles.botonSosNucleo}>
              <AlertTriangle size={34} />
              <span className={styles.botonSosTexto}>SOS</span>
            </span>
          </button>
        </div>
        <p className={styles.sosAyuda}><Clock size={15} /> Mantené presionado 1-2 segundos para abrir la solicitud de emergencia.</p>
      </div>

      {modalAbierto && (
        <div className={styles.overlay} onClick={() => !enviando && cerrarModalEmergencia()}>
          <div className={`${styles.modal} ${styles.modalEmergencia}`} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <AlertTriangle size={20} color="#c0392b" />
              <h3>Solicitar emergencia</h3>
              <button
                type="button"
                onClick={cerrarModalEmergencia}
                style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#4a5568' }}
                aria-label="Cerrar"
                disabled={enviando}
              >
                <X size={18} />
              </button>
            </div>
            <p className={styles.modalSub}>Elegí a tu mascota y contanos qué está pasando.</p>

            <div className={styles.modalPaso}>
              <span className={styles.pasoLabel}><span className={styles.pasoNumero}>1</span> Elegí la mascota</span>
              <MascotaChips mascotas={mascotas} valor={mascotaId} onSeleccionar={seleccionarMascota} />
            </div>

            {mascotaId && (
              <div className={styles.modalPaso}>
                <span className={styles.pasoLabel}><span className={styles.pasoNumero}>2</span> Detalles de la emergencia</span>

                <ExpedienteBadge detalle={detalleExpediente} cargando={cargandoExpediente} />

                {disponibilidad && (
                  <div className={`${styles.disponibilidad} ${disponibilidad.fueraDeHorario ? styles.disponibleAviso : styles.disponibleOk}`}>
                    {disponibilidad.fueraDeHorario ? <Clock size={18} /> : <CheckCircle2 size={18} />}
                    <span>
                      {disponibilidad.fueraDeHorario
                        ? 'Tu veterinaria no tiene ningún veterinario dentro de su horario ahora mismo. Igual podés enviar la solicitud — puede tardar más en responder. Si preferís, buscá atención por tu cuenta y después registrala como "atención externa" abajo.'
                        : 'Tu veterinaria tiene veterinarios disponibles ahora mismo.'}
                    </span>
                  </div>
                )}

                {expedienteBasico && (
                  <form onSubmit={enviar} className={styles.form}>
                    <label className={styles.campo}>
                      <span><Phone size={14} style={{ verticalAlign: '-2px', marginRight: 4 }} />Teléfono de contacto</span>
                      <input
                        required
                        type="tel"
                        value={telefonoContacto}
                        onChange={(e) => setTelefonoContacto(e.target.value)}
                        placeholder="Ej. 8888-8888"
                      />
                      {!perfil?.telefono && (
                        <span style={{ color: '#a3720a', fontSize: '0.78rem', fontWeight: 600 }}>
                          No tenés un teléfono guardado en tu cuenta — se va a agregar a tu perfil al enviar.
                        </span>
                      )}
                    </label>

                    <label className={styles.campo}>
                      <span><MapPin size={14} style={{ verticalAlign: '-2px', marginRight: 4 }} />Ubicación exacta</span>
                      <input
                        required
                        value={form.ubicacion}
                        onChange={(e) => setForm({ ...form, ubicacion: e.target.value })}
                        placeholder="Dirección, punto de referencia o zona"
                      />
                    </label>

                    <label className={styles.campo}>
                      <span><FileWarning size={14} style={{ verticalAlign: '-2px', marginRight: 4 }} />Motivo de la emergencia</span>
                      <div className={styles.motivoChips}>
                        {MOTIVOS_RAPIDOS.map((m) => (
                          <button
                            type="button"
                            key={m}
                            className={`${styles.motivoChip} ${form.motivo === m ? styles.motivoChipActivo : ''}`}
                            onClick={() => setForm({ ...form, motivo: m })}
                          >
                            {m}
                          </button>
                        ))}
                      </div>
                      <input
                        required
                        value={form.motivo}
                        onChange={(e) => setForm({ ...form, motivo: e.target.value })}
                        placeholder="Elegí una opción arriba o escribí el motivo"
                      />
                    </label>

                    <label className={styles.campo}>
                      <span>Descripción (opcional)</span>
                      <textarea
                        rows={3}
                        placeholder="Síntomas, hace cuánto pasó, cómo está reaccionando tu mascota..."
                        value={form.descripcion}
                        onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                      />
                    </label>

                    <div className={styles.selectorVetOpcional}>
                      <button type="button" className={styles.linkVetPuntual} onClick={alternarSelectorVeterinaria}>
                        {mostrarSelectorVeterinaria
                          ? 'Enviar a todas las veterinarias en vez de una puntual'
                          : '¿Preferís avisarle a una veterinaria puntual?'}
                      </button>
                      {mostrarSelectorVeterinaria && (
                        <div className={styles.flujoRow} style={{ marginTop: '0.6rem' }}>
                          <SelectorVeterinaria
                            opciones={veterinarias}
                            valor={veterinariaElegida}
                            onSeleccionar={setVeterinariaElegida}
                          />
                        </div>
                      )}
                    </div>

                    <button className={styles.btnEnviar} disabled={enviando}>
                      <Send size={16} /> {enviando ? 'Enviando…' : 'Enviar solicitud de emergencia'}
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {misEmergencias.length > 0 && (
        <div className={`${styles.panel} ${styles.historialPanel}`}>
          <div className={styles.seccion}>
            <div className={styles.historialHeader}>
              <div className={styles.historialTitulo}>
                <h2>Historial de emergencias</h2>
                <span className={styles.historialContador}>{misEmergencias.length}</span>
              </div>
              <div className={styles.filtroTabs}>
                {[
                  { id: 'todas', label: 'Todas' },
                  { id: 'activas', label: 'Activas' },
                  { id: 'finalizadas', label: 'Finalizadas' },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    className={`${styles.filtroTab} ${filtroHistorial === f.id ? styles.filtroTabActivo : ''}`}
                    onClick={() => setFiltroHistorial(f.id)}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {(() => {
              const emergenciasFiltradas = misEmergencias.filter((em) => {
                if (filtroHistorial === 'activas') return em.estado !== 'Finalizada';
                if (filtroHistorial === 'finalizadas') return em.estado === 'Finalizada';
                return true;
              });

              if (emergenciasFiltradas.length === 0) {
                return (
                  <div className={styles.estadoVacio}>
                    No tenés emergencias {filtroHistorial === 'activas' ? 'activas' : 'finalizadas'} por ahora.
                  </div>
                );
              }

              return (
                <div className={styles.lista}>
                  {emergenciasFiltradas.map((em) => {
                    const info = ESTADO_INFO[em.estado] || ESTADO_INFO.Solicitada;
                    const Icono = info.icono;
                    const expandida = expandidaId === em.idEmergencia;
                    const tieneDetalle = Boolean(em.descripcion || em.diagnostico || em.tratamiento || (em.esAtencionExterna && em.nombreClinicaExterna));

                    return (
                      <div
                        className={styles.itemGrande}
                        key={em.idEmergencia}
                        style={tieneDetalle ? { cursor: 'pointer' } : undefined}
                        onClick={tieneDetalle ? () => setExpandidaId(expandida ? null : em.idEmergencia) : undefined}
                      >
                        <div className={styles.itemGrandeTop}>
                          <div className={styles.itemGrandeInfo}>
                            <div className={`${styles.itemGrandeIcono} ${info.clase}`}><Icono size={20} /></div>
                            <div>
                              <div className={styles.itemGrandeMascota}>{em.nombreMascota}</div>
                              <div className={styles.itemGrandeMotivo}>{em.motivo}</div>
                              <div className={styles.itemGrandeMetaRow}>
                                <span><Clock size={12} /> {formatFecha(em.fechaSolicitud)}</span>
                                {em.ubicacion && <span><MapPin size={12} /> {em.ubicacion}</span>}
                                {em.esAtencionExterna && <span>Atendida por fuera</span>}
                              </div>
                            </div>
                          </div>
                          <div className={styles.itemGrandeAcciones} onClick={(e) => e.stopPropagation()}>
                            <span className={`${styles.estadoBadge} ${info.clase}`}>{info.texto}</span>
                            {em.estado === 'Solicitada' && (
                              <button className={styles.btnAtencionExterna} onClick={() => abrirAtencionExterna(em)}>
                                Ya me atendieron por fuera
                              </button>
                            )}
                          </div>
                        </div>

                        {expandida && tieneDetalle && (
                          <div className={styles.itemGrandeDetalle}>
                            {em.descripcion && <div><strong>Descripción:</strong> {em.descripcion}</div>}
                            {em.esAtencionExterna && em.nombreClinicaExterna && (
                              <div><strong>Atendida en:</strong> {em.nombreClinicaExterna}{em.nombreVeterinarioExterno ? ` (Dr./Dra. ${em.nombreVeterinarioExterno})` : ''}</div>
                            )}
                            {em.diagnostico && <div><strong>Diagnóstico:</strong> {em.diagnostico}</div>}
                            {em.tratamiento && <div><strong>Tratamiento:</strong> {em.tratamiento}</div>}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {emergenciaExterna && (
        <div className={styles.overlay} onClick={() => setEmergenciaExterna(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <Stethoscope size={20} color="#1B4332" />
              <h3>Registrar atención externa</h3>
              <button
                type="button"
                onClick={() => setEmergenciaExterna(null)}
                style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#4a5568' }}
                aria-label="Cerrar"
              >
                <X size={18} />
              </button>
            </div>
            <p className={styles.modalSub}>Contanos quién atendió a tu mascota fuera de Huellitas Vitales.</p>
            <form onSubmit={guardarAtencionExterna} className={styles.form} style={{ marginTop: 0 }}>
              <label className={styles.campo}>
                <span>Nombre del veterinario</span>
                <input
                  required
                  value={formExterna.nombreVeterinarioExterno}
                  onChange={(e) => setFormExterna({ ...formExterna, nombreVeterinarioExterno: e.target.value })}
                />
              </label>
              <label className={styles.campo}>
                <span>Nombre de la clínica</span>
                <input
                  required
                  value={formExterna.nombreClinicaExterna}
                  onChange={(e) => setFormExterna({ ...formExterna, nombreClinicaExterna: e.target.value })}
                />
              </label>
              <label className={styles.campo}>
                <span>Diagnóstico</span>
                <textarea
                  required
                  rows={2}
                  value={formExterna.diagnostico}
                  onChange={(e) => setFormExterna({ ...formExterna, diagnostico: e.target.value })}
                />
              </label>
              <label className={styles.campo}>
                <span>Tratamiento</span>
                <textarea
                  required
                  rows={2}
                  value={formExterna.tratamiento}
                  onChange={(e) => setFormExterna({ ...formExterna, tratamiento: e.target.value })}
                />
              </label>
              <div className={styles.modalFooter}>
                <button type="button" className={styles.btnSecundario} onClick={() => setEmergenciaExterna(null)}>Cancelar</button>
                <button type="submit" className={styles.btnPrimario}>Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ClienteLayout>
  );
}
