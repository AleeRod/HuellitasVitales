import React, { useEffect, useState } from 'react';
import { ArrowLeftRight, ArrowRight, Building2, CheckCircle2, Clock, XCircle, Ban, Download } from 'lucide-react';

import ClienteLayout from '../../components/Cliente/ClienteLayout/ClienteLayout';
import MascotaChips from '../../components/Cliente/MascotaChips/MascotaChips';
import ExpedienteBadge from '../../components/Cliente/ExpedienteBadge/ExpedienteBadge';
import SelectorVeterinaria from '../../components/Cliente/SelectorVeterinaria/SelectorVeterinaria';
import { API_BASE } from '../../api/config';
import { ToastContainer } from '../../components/Toast/Toast';
import { useToast } from '../../components/Toast/useToast';
import styles from './TrasladarExpediente.module.css';

const ESTADO_INFO = {
  Pendiente: { texto: 'Pendiente', clase: styles.estadoPendiente, icono: Clock },
  Aceptada: { texto: 'Aceptada', clase: styles.estadoAceptada, icono: CheckCircle2 },
  Rechazada: { texto: 'Rechazada', clase: styles.estadoRechazada, icono: XCircle },
  Cancelada: { texto: 'Cancelada', clase: styles.estadoCancelada, icono: Ban },
};

export default function TrasladarExpediente() {
  const [mascotas, setMascotas] = useState([]);
  const [comercios, setComercios] = useState([]);
  const [mascotaId, setMascotaId] = useState('');
  const [expedienteBasico, setExpedienteBasico] = useState(null);
  const [detalleExpediente, setDetalleExpediente] = useState(null);
  const [cargandoExpediente, setCargandoExpediente] = useState(false);
  const [destino, setDestino] = useState('');
  const [motivo, setMotivo] = useState('');
  const [confirmando, setConfirmando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [misSolicitudes, setMisSolicitudes] = useState([]);
  const [sinExpediente, setSinExpediente] = useState(false);
  const [veterinariaApertura, setVeterinariaApertura] = useState('');
  const [abriendoExpediente, setAbriendoExpediente] = useState(false);
  const [descargandoPdf, setDescargandoPdf] = useState(false);
  const { toasts, showToast, removeToast } = useToast();

  const headers = () => ({ Authorization: `Bearer ${localStorage.getItem('token_huellitas')}` });

  useEffect(() => {
    fetch(`${API_BASE}/usuario/mascotas`, { headers: headers() })
      .then((r) => r.json())
      .then((d) => setMascotas(d.mascotas || []));
    fetch(`${API_BASE}/comercio/buscar?q=`, { headers: headers() })
      .then((r) => r.json())
      .then((d) => setComercios(d || d.comercios || []));
    cargarMisSolicitudes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cargarMisSolicitudes = async () => {
    const r = await fetch(`${API_BASE}/trasladoexpediente/mis-solicitudes`, { headers: headers() });
    const d = await r.json().catch(() => ({}));
    if (r.ok) setMisSolicitudes(d.solicitudes || []);
  };

  const cargarDetalle = async (expediente) => {
    const rDetalle = await fetch(`${API_BASE}/expediente/${expediente.idExpediente}`, { headers: headers() });
    const detalle = await rDetalle.json();
    if (detalle.success) setDetalleExpediente(detalle.expediente);
  };

  const seleccionarMascota = async (id) => {
    setMascotaId(id);
    setExpedienteBasico(null);
    setDetalleExpediente(null);
    setDestino('');
    setSinExpediente(false);
    setVeterinariaApertura('');
    setCargandoExpediente(true);

    try {
      const r = await fetch(`${API_BASE}/expediente/mascota/${id}`, { headers: headers() });
      const d = await r.json();
      if (!r.ok) {
        // La mascota nunca tuvo una cita, así que todavía no tiene expediente. Igual que en
        // Emergencia, dejamos elegir la veterinaria directamente en vez de bloquear acá.
        setSinExpediente(true);
        return;
      }
      setExpedienteBasico(d.expediente);
      await cargarDetalle(d.expediente);
    } finally {
      setCargandoExpediente(false);
    }
  };

  const abrirExpedienteEnVeterinaria = async () => {
    if (!veterinariaApertura) return showToast('Elegí una veterinaria.', 'warning');

    setAbriendoExpediente(true);
    try {
      const r = await fetch(`${API_BASE}/expediente/abrir`, {
        method: 'POST',
        headers: { ...headers(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ idMascota: Number(mascotaId), idComercio: Number(veterinariaApertura) }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.mensaje || 'No se pudo abrir el expediente.');

      setSinExpediente(false);
      setExpedienteBasico(d.expediente);
      await cargarDetalle(d.expediente);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setAbriendoExpediente(false);
    }
  };

  const descargarPdf = async () => {
    if (!expedienteBasico) return;
    setDescargandoPdf(true);
    try {
      const r = await fetch(`${API_BASE}/expediente/${expedienteBasico.idExpediente}/exportar-pdf`, { headers: headers() });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        throw new Error(d.mensaje || 'No se pudo generar el PDF.');
      }
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const enlace = document.createElement('a');
      enlace.href = url;
      enlace.download = `expediente-${detalleExpediente?.nombreMascota || 'mascota'}.pdf`;
      document.body.appendChild(enlace);
      enlace.click();
      enlace.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setDescargandoPdf(false);
    }
  };

  const todasLasVeterinarias = comercios.filter((c) => (c.idTipoComercio ?? c.IdTipoComercio) !== 2);

  const comerciosVeterinaria = todasLasVeterinarias.filter((c) => {
    const idComercio = c.idComercio ?? c.IdComercio;
    return idComercio !== expedienteBasico?.idComercioActual;
  });

  const nombreDestino = comerciosVeterinaria.find((c) => String(c.idComercio ?? c.IdComercio) === String(destino))?.nombreComercial;

  const confirmarEnvio = async () => {
    setEnviando(true);
    try {
      const r = await fetch(`${API_BASE}/trasladoexpediente/expedientes/${expedienteBasico.idExpediente}/solicitudes`, {
        method: 'POST',
        headers: { ...headers(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ idComercioDestino: Number(destino), motivo }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.mensaje || 'No se pudo enviar la solicitud.');

      showToast(d.mensaje || 'Solicitud de traslado enviada.', 'success');
      setMotivo('');
      setDestino('');
      setConfirmando(false);
      cargarMisSolicitudes();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setEnviando(false);
    }
  };

  const formatFecha = (fechaISO) => {
    if (!fechaISO) return '';
    return new Date(fechaISO).toLocaleDateString('es-CR', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <ClienteLayout activo="traslado">
      <div className={styles.panel}>
        <div className={styles.hero}>
          <div className={styles.heroIcono}><ArrowLeftRight size={26} /></div>
          <div>
            <h1 className={styles.heroTitulo}>Trasladar el expediente a otra veterinaria</h1>
            <p className={styles.heroSub}>La veterinaria receptora tiene que aceptar tu solicitud antes de tener acceso al historial.</p>
          </div>
        </div>

        <div className={styles.seccion}>
          <span className={styles.pasoLabel}><span className={styles.pasoNumero}>1</span> Elegí la mascota</span>
          <MascotaChips mascotas={mascotas} valor={mascotaId} onSeleccionar={seleccionarMascota} />
        </div>

        {mascotaId && sinExpediente && (
          <div className={styles.seccion}>
            <span className={styles.pasoLabel}><span className={styles.pasoNumero}>2</span> Elegí la veterinaria de tu mascota</span>
            <p style={{ color: '#4a5568', fontSize: '0.88rem', margin: '0 0 1rem' }}>
              Esta mascota todavía no tiene un expediente porque nunca tuvo una cita registrada. Elegí la
              veterinaria donde querés abrirlo y después vas a poder pedir el traslado si hace falta.
            </p>
            <div className={styles.flujo}>
              <div className={styles.flujoDestinoWrap}>
                <div className={styles.flujoLabel}>Veterinaria</div>
                <SelectorVeterinaria
                  opciones={todasLasVeterinarias}
                  valor={veterinariaApertura}
                  onSeleccionar={setVeterinariaApertura}
                />
              </div>
            </div>
            <button className={styles.btnEnviar} onClick={abrirExpedienteEnVeterinaria} disabled={abriendoExpediente || !veterinariaApertura}>
              {abriendoExpediente ? 'Abriendo…' : 'Continuar'}
            </button>
          </div>
        )}

        {mascotaId && !sinExpediente && (
          <div className={styles.seccion}>
            <span className={styles.pasoLabel}><span className={styles.pasoNumero}>2</span> Elegí a dónde trasladarlo</span>

            <ExpedienteBadge detalle={detalleExpediente} cargando={cargandoExpediente} />

            {expedienteBasico && (
              <>
                <button className={styles.btnDescargarPdf} onClick={descargarPdf} disabled={descargandoPdf}>
                  <Download size={14} /> {descargandoPdf ? 'Generando…' : 'Descargar expediente en PDF'}
                </button>

                <div className={styles.flujo}>
                  <div className={styles.flujoCard}>
                    <div className={styles.flujoIcono}><Building2 size={18} /></div>
                    <div>
                      <div className={styles.flujoLabel}>Veterinaria actual</div>
                      <div className={styles.flujoValor}>{detalleExpediente?.nombreComercioActual || 'Cargando…'}</div>
                    </div>
                  </div>

                  <ArrowRight size={22} className={styles.flujoFlecha} />

                  <div className={styles.flujoDestinoWrap}>
                    <div className={styles.flujoLabel}>Veterinaria receptora</div>
                    <SelectorVeterinaria
                      opciones={comerciosVeterinaria}
                      valor={destino}
                      onSeleccionar={setDestino}
                    />
                  </div>
                </div>

                <div className={styles.form}>
                  <label className={styles.campo}>
                    <span>Motivo del traslado (opcional)</span>
                    <textarea
                      rows={3}
                      placeholder="Contale a la veterinaria receptora por qué querés trasladar el expediente"
                      value={motivo}
                      onChange={(e) => setMotivo(e.target.value)}
                    />
                  </label>

                  <button className={styles.btnEnviar} disabled={!destino} onClick={() => setConfirmando(true)}>
                    <ArrowLeftRight size={16} /> Solicitar traslado
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        <div className={styles.seccion}>
          <h2 className={styles.seccionTitulo}>Tus solicitudes de traslado</h2>
          {misSolicitudes.length === 0 ? (
            <div className={styles.estadoVacio}>Todavía no enviaste ninguna solicitud de traslado.</div>
          ) : (
            <div className={styles.lista}>
              {misSolicitudes.map((s) => {
                const info = ESTADO_INFO[s.estado] || ESTADO_INFO.Pendiente;
                const Icono = info.icono;
                return (
                  <div className={styles.item} key={s.idSolicitudTraslado}>
                    <div>
                      <div className={styles.itemTitulo}>{s.nombreMascota} → {s.veterinariaDestino}</div>
                      <div className={styles.itemMeta}>{formatFecha(s.fechaSolicitud)}{s.motivo ? ` · ${s.motivo}` : ''}</div>
                      {s.respuesta && <div className={styles.itemRespuesta}>Respuesta: {s.respuesta}</div>}
                    </div>
                    <span className={`${styles.estadoBadge} ${info.clase}`}><Icono size={13} /> {info.texto}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {confirmando && (
        <div className={styles.overlay} onClick={() => !enviando && setConfirmando(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalIcono}><ArrowLeftRight size={24} /></div>
            <h3>Confirmar traslado</h3>
            <p>
              ¿Confirmás trasladar el expediente de{' '}
              <strong>{mascotas.find((m) => String(m.idMascota) === String(mascotaId))?.nombre}</strong> a{' '}
              <strong>{nombreDestino}</strong>? La veterinaria receptora tiene que aceptarlo antes de acceder al historial.
            </p>
            <div className={styles.modalFooter}>
              <button className={styles.btnSecundario} onClick={() => setConfirmando(false)} disabled={enviando}>Cancelar</button>
              <button className={styles.btnPrimario} onClick={confirmarEnvio} disabled={enviando}>
                {enviando ? 'Enviando…' : 'Confirmar traslado'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ClienteLayout>
  );
}
