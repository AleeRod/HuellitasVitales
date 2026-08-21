import React, { useEffect, useState } from "react";
import { X, Send, Check, Calendar, FileText, Eye, ArrowLeftRight } from "lucide-react";
import { API_BASE } from "../../../api/config";
import { ToastContainer } from "../../Toast/Toast";
import { useToast } from "../../Toast/useToast";
import { useConfirm } from "../../ConfirmModal/useConfirm";
import styles from "./PanelSolicitudesTraslado.module.css";

const ESTADO = {
  CARGANDO: "cargando",
  OK: "ok",
  VACIO: "vacio",
  ERROR: "error",
};

const obtenerToken = () => localStorage.getItem("token_huellitas") || "";
const authHeaders = (conJson = false) => ({
  Authorization: `Bearer ${obtenerToken()}`,
  ...(conJson ? { "Content-Type": "application/json" } : {}),
});

const formatFecha = (fechaISO) => {
  if (!fechaISO) return "-";
  return new Date(fechaISO).toLocaleString("es-CR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

const PanelSolicitudesTraslado = () => {
  const { toasts, showToast, removeToast } = useToast();
  const { pedirConfirmacion, ConfirmacionModal } = useConfirm();

  const [solicitudes, setSolicitudes] = useState([]);
  const [estado, setEstado] = useState(ESTADO.CARGANDO);

  const [expedienteAbierto, setExpedienteAbierto] = useState(null);
  const [cargandoExpediente, setCargandoExpediente] = useState(false);

  const [modalRechazo, setModalRechazo] = useState(null); // solicitud a rechazar
  const [respuesta, setRespuesta] = useState("");
  const [procesandoId, setProcesandoId] = useState(null);

  useEffect(() => {
    cargarPendientes();
  }, []);

  const cargarPendientes = async () => {
    setEstado(ESTADO.CARGANDO);
    try {
      const res = await fetch(`${API_BASE}/trasladoexpediente/solicitudes/pendientes`, { headers: authHeaders() });
      const data = await res.json();
      const lista = data.solicitudes || [];
      setSolicitudes(lista);
      setEstado(lista.length === 0 ? ESTADO.VACIO : ESTADO.OK);
    } catch (err) {
      console.error(err);
      setEstado(ESTADO.ERROR);
    }
  };

  const verExpediente = async (idExpediente) => {
    setCargandoExpediente(true);
    setExpedienteAbierto({ idExpediente });
    try {
      const res = await fetch(`${API_BASE}/expediente/${idExpediente}`, { headers: authHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.mensaje || "No se pudo cargar el expediente.");
      setExpedienteAbierto(data.expediente);
    } catch (err) {
      console.error(err);
      showToast(err.message || "No se pudo cargar el expediente.", "error");
      setExpedienteAbierto(null);
    } finally {
      setCargandoExpediente(false);
    }
  };

  const aceptar = (solicitud) => {
    pedirConfirmacion({
      titulo: "Aceptar traslado",
      mensaje: `¿Aceptar el traslado del expediente de ${solicitud.nombreMascota}?`,
      textoConfirmar: "Sí, aceptar",
      variante: "normal",
      onConfirmar: () => resolver(solicitud.idSolicitudTraslado, "aceptar")
    });
  };

  const abrirRechazo = (solicitud) => {
    setModalRechazo(solicitud);
    setRespuesta("");
  };

  const confirmarRechazo = async () => {
    if (!modalRechazo) return;
    await resolver(modalRechazo.idSolicitudTraslado, "rechazar", respuesta);
    setModalRechazo(null);
  };

  const resolver = async (idSolicitud, accion, respuestaTexto) => {
    setProcesandoId(idSolicitud);
    try {
      const res = await fetch(`${API_BASE}/trasladoexpediente/solicitudes/${idSolicitud}/${accion}`, {
        method: "PUT",
        headers: authHeaders(true),
        body: JSON.stringify({ respuesta: respuestaTexto || null }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.mensaje || "No se pudo resolver la solicitud.");
      showToast("Solicitud de traslado resuelta correctamente.", "success");
      cargarPendientes();
    } catch (err) {
      console.error(err);
      showToast(err.message || "No se pudo resolver la solicitud.", "error");
    } finally {
      setProcesandoId(null);
    }
  };

  return (
    <div className={styles.panel}>
      <div className={styles.headerRow}>
        <div>
          <h2 className={styles.titulo}>Solicitudes de traslado</h2>
          <p className={styles.subtitulo}>Expedientes que otras personas quieren trasladar a tu veterinaria.</p>
        </div>
      </div>

      {estado === ESTADO.CARGANDO && <div className={styles.estadoBox}>Cargando solicitudes...</div>}

      {estado === ESTADO.ERROR && (
        <div className={styles.estadoBox}>
          No pudimos cargar las solicitudes.{" "}
          <button onClick={cargarPendientes} className={styles.linkBtn}>Reintentar</button>
        </div>
      )}

      {estado === ESTADO.VACIO && (
        <div className={styles.estadoBox}>
          <h3>No tenés solicitudes de traslado pendientes</h3>
          <p>Cuando un propietario pida trasladar el expediente de su mascota a tu veterinaria, aparecerá acá.</p>
        </div>
      )}

      {estado === ESTADO.OK && (
        <>
          <p className={styles.seccionSubtitulo}>
            <ArrowLeftRight size={16} />
            Solicitudes pendientes <span className={styles.contadorPill}>{solicitudes.length}</span>
          </p>
          <div className={styles.lista}>
          {solicitudes.map((s) => (
            <div className={styles.card} key={s.idSolicitudTraslado}>
              <div className={styles.cardTop}>
                <div className={styles.avatar}><ArrowLeftRight size={20} /></div>
                <div className={styles.cardInfo}>
                  <span className={styles.cardMascota}>{s.nombreMascota}</span>
                  {s.motivo && <span className={styles.cardMotivo}>{s.motivo}</span>}
                  <div className={styles.cardMetaRow}>
                    <span className={styles.cardMeta}><Calendar size={13} /> {formatFecha(s.fechaSolicitud)}</span>
                  </div>
                </div>
              </div>
              <div className={styles.cardAcciones}>
                <button className={styles.btnVer} onClick={() => verExpediente(s.idExpediente)}>
                  <Eye size={14} /> Ver expediente
                </button>
                <button
                  className={styles.btnAceptar}
                  onClick={() => aceptar(s)}
                  disabled={procesandoId === s.idSolicitudTraslado}
                >
                  <Check size={14} /> Aceptar
                </button>
                <button
                  className={styles.btnRechazar}
                  onClick={() => abrirRechazo(s)}
                  disabled={procesandoId === s.idSolicitudTraslado}
                >
                  <X size={14} /> Rechazar
                </button>
              </div>
            </div>
          ))}
          </div>
        </>
      )}

      {expedienteAbierto && (
        <div className={styles.overlay} onClick={() => setExpedienteAbierto(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3><FileText size={18} style={{ marginRight: 6 }} /> Expediente</h3>
              <button className={styles.closeBtn} onClick={() => setExpedienteAbierto(null)} aria-label="Cerrar">
                <X size={20} />
              </button>
            </div>
            <div className={styles.modalBody}>
              {cargandoExpediente ? (
                <p>Cargando...</p>
              ) : (
                <>
                  <div className={styles.filaDato}><span>Mascota</span><span>{expedienteAbierto.nombreMascota}</span></div>
                  <div className={styles.filaDato}><span>Veterinaria actual</span><span>{expedienteAbierto.nombreComercioActual}</span></div>
                  <div className={styles.filaDato}><span>Abierto desde</span><span>{formatFecha(expedienteAbierto.fechaApertura)}</span></div>

                  <p className={styles.seccionTitulo}>Historial de veterinarias</p>
                  <div className={styles.miniLista}>
                    {(expedienteAbierto.historialComercios || []).map((h) => (
                      <span key={h.idComercio}>
                        {h.nombreComercio} — {formatFecha(h.fechaDesde)}{h.fechaHasta ? ` a ${formatFecha(h.fechaHasta)}` : " (actual)"}
                      </span>
                    ))}
                    {(!expedienteAbierto.historialComercios || expedienteAbierto.historialComercios.length === 0) && <span>Sin historial.</span>}
                  </div>

                  <p className={styles.seccionTitulo}>Atenciones externas ({(expedienteAbierto.atencionesExternas || []).length})</p>
                  <div className={styles.miniLista}>
                    {(expedienteAbierto.atencionesExternas || []).map((a) => (
                      <span key={a.idAtencionExterna}>{formatFecha(a.fechaAtencion)} — {a.nombreVeterinaria}: {a.motivo}</span>
                    ))}
                    {(!expedienteAbierto.atencionesExternas || expedienteAbierto.atencionesExternas.length === 0) && <span>Sin registros.</span>}
                  </div>

                  <p className={styles.seccionTitulo}>Emergencias ({(expedienteAbierto.emergencias || []).length})</p>
                  <div className={styles.miniLista}>
                    {(expedienteAbierto.emergencias || []).map((em) => (
                      <span key={em.idEmergencia}>{formatFecha(em.fechaSolicitud)} — {em.motivo} ({em.estado})</span>
                    ))}
                    {(!expedienteAbierto.emergencias || expedienteAbierto.emergencias.length === 0) && <span>Sin registros.</span>}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {modalRechazo && (
        <div className={styles.overlay} onClick={() => setModalRechazo(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460 }}>
            <div className={styles.modalHeader}>
              <h3>Rechazar traslado</h3>
              <button className={styles.closeBtn} onClick={() => setModalRechazo(null)} aria-label="Cerrar">
                <X size={20} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <p>¿Por qué rechazás el traslado de {modalRechazo.nombreMascota}? (opcional)</p>
              <textarea
                className={styles.textarea}
                value={respuesta}
                onChange={(e) => setRespuesta(e.target.value)}
                placeholder="Motivo del rechazo..."
              />
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.btnSecundario} onClick={() => setModalRechazo(null)}>Cancelar</button>
              <button className={styles.btnPrimario} onClick={confirmarRechazo} disabled={procesandoId === modalRechazo.idSolicitudTraslado}>
                <Send size={14} style={{ marginRight: 4 }} /> Rechazar
              </button>
            </div>
          </div>
        </div>
      )}

      {ConfirmacionModal}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

export default PanelSolicitudesTraslado;
