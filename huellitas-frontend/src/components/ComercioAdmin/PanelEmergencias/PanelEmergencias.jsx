import React, { useEffect, useState } from "react";
import { X, AlertTriangle, MapPin, Clock, Play, CheckCircle2, PawPrint, Radio, Phone } from "lucide-react";
import { API_BASE } from "../../../api/config";
import styles from "./PanelEmergencias.module.css";

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
  return new Date(fechaISO).toLocaleString("es-CR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
};

const PanelEmergencias = () => {
  const [pendientes, setPendientes] = useState([]);
  const [enCurso, setEnCurso] = useState([]);
  const [estado, setEstado] = useState(ESTADO.CARGANDO);
  const [procesandoId, setProcesandoId] = useState(null);

  const [modalFinalizar, setModalFinalizar] = useState(null);
  const [diagnostico, setDiagnostico] = useState("");
  const [tratamiento, setTratamiento] = useState("");
  const [errorModal, setErrorModal] = useState("");

  useEffect(() => {
    cargarTodo();
  }, []);

  const cargarTodo = async () => {
    setEstado(ESTADO.CARGANDO);
    try {
      const [rPendientes, rEnCurso] = await Promise.all([
        fetch(`${API_BASE}/emergencias/pendientes`, { headers: authHeaders() }),
        fetch(`${API_BASE}/emergencias/en-curso`, { headers: authHeaders() }),
      ]);
      const dPendientes = await rPendientes.json();
      const dEnCurso = await rEnCurso.json();
      const listaPendientes = dPendientes.emergencias || [];
      const listaEnCurso = dEnCurso.emergencias || [];
      setPendientes(listaPendientes);
      setEnCurso(listaEnCurso);
      setEstado(listaPendientes.length === 0 && listaEnCurso.length === 0 ? ESTADO.VACIO : ESTADO.OK);
    } catch (err) {
      console.error(err);
      setEstado(ESTADO.ERROR);
    }
  };

  const aceptar = async (emergencia) => {
    const confirmar = window.confirm(`¿Aceptar esta emergencia (${emergencia.motivo})?`);
    if (!confirmar) return;
    await accionar(emergencia.idExpediente, emergencia.idEmergencia, "aceptar");
  };

  const iniciar = async (emergencia) => {
    await accionar(emergencia.idExpediente, emergencia.idEmergencia, "iniciar");
  };

  const abrirFinalizar = (emergencia) => {
    setModalFinalizar(emergencia);
    setDiagnostico("");
    setTratamiento("");
    setErrorModal("");
  };

  const confirmarFinalizar = async () => {
    if (!diagnostico.trim() || !tratamiento.trim()) {
      setErrorModal("El diagnóstico y el tratamiento son obligatorios.");
      return;
    }
    setProcesandoId(modalFinalizar.idEmergencia);
    try {
      const res = await fetch(
        `${API_BASE}/expedientes/${modalFinalizar.idExpediente}/emergencias/${modalFinalizar.idEmergencia}/finalizar`,
        {
          method: "PUT",
          headers: authHeaders(true),
          body: JSON.stringify({ diagnostico: diagnostico.trim(), tratamiento: tratamiento.trim() }),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.mensaje || "No se pudo finalizar la emergencia.");
      setModalFinalizar(null);
      cargarTodo();
    } catch (err) {
      setErrorModal(err.message || "No se pudo finalizar la emergencia.");
    } finally {
      setProcesandoId(null);
    }
  };

  const accionar = async (idExpediente, idEmergencia, accion) => {
    setProcesandoId(idEmergencia);
    try {
      const res = await fetch(`${API_BASE}/expedientes/${idExpediente}/emergencias/${idEmergencia}/${accion}`, {
        method: "PUT",
        headers: authHeaders(true),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.mensaje || "No se pudo actualizar la emergencia.");
      cargarTodo();
    } catch (err) {
      console.error(err);
      alert(err.message || "No se pudo actualizar la emergencia.");
    } finally {
      setProcesandoId(null);
    }
  };

  return (
    <div className={styles.panel}>
      <div className={styles.headerRow}>
        <div>
          <h2 className={styles.titulo}>Emergencias</h2>
          <p className={styles.subtitulo}>Solicitudes dirigidas a tu veterinaria, más las generales enviadas a todas.</p>
        </div>
      </div>

      {estado === ESTADO.CARGANDO && <div className={styles.estadoBox}>Cargando emergencias...</div>}

      {estado === ESTADO.ERROR && (
        <div className={styles.estadoBox}>
          No pudimos cargar las emergencias.{" "}
          <button onClick={cargarTodo} className={styles.linkBtn}>Reintentar</button>
        </div>
      )}

      {estado === ESTADO.VACIO && (
        <div className={styles.estadoBox}>
          <AlertTriangle size={32} color="#52B788" />
          <h3>No hay emergencias activas</h3>
          <p>Cuando alguien solicite atención de emergencia en tu veterinaria, va a aparecer acá.</p>
        </div>
      )}

      {estado === ESTADO.OK && (
        <>
          {pendientes.length > 0 && (
            <>
              <p className={styles.seccionSubtitulo}>
                <AlertTriangle size={16} />
                Nuevas <span className={styles.contadorPill}>{pendientes.length}</span>
              </p>
              <div className={styles.lista}>
                {pendientes.map((e) => (
                  <div className={`${styles.card} ${styles.cardNueva}`} key={e.idEmergencia}>
                    <div className={styles.cardTop}>
                      <div className={`${styles.avatar} ${styles.avatarPulso}`}>
                        <PawPrint size={20} />
                      </div>
                      <div className={styles.cardInfo}>
                        <span className={styles.cardMascota}>{e.nombreMascota || "Mascota"}</span>
                        <span className={styles.cardMotivo}>{e.motivo}</span>
                        <div className={styles.cardMetaRow}>
                          <span className={styles.cardMeta}><MapPin size={13} /> {e.ubicacion}</span>
                          <span className={styles.cardMeta}><Clock size={13} /> {formatFecha(e.fechaSolicitud)}</span>
                          {e.telefonoContacto && (
                            <a className={styles.cardMeta} href={`tel:${e.telefonoContacto}`}>
                              <Phone size={13} /> {e.telefonoContacto}
                            </a>
                          )}
                          {!e.idComercio && (
                            <span className={styles.badgeGeneral}><Radio size={12} /> General · cualquiera puede tomarla</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className={styles.cardAcciones}>
                      <button className={styles.btnAceptar} onClick={() => aceptar(e)} disabled={procesandoId === e.idEmergencia}>
                        <CheckCircle2 size={14} /> Aceptar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {enCurso.length > 0 && (
            <>
              <p className={styles.seccionSubtitulo}>
                <Clock size={16} />
                En curso <span className={styles.contadorPillNeutro}>{enCurso.length}</span>
              </p>
              <div className={styles.lista}>
                {enCurso.map((e) => (
                  <div className={styles.card} key={e.idEmergencia}>
                    <div className={styles.cardTop}>
                      <div className={`${styles.avatar} ${styles.avatarCalmo}`}>
                        <PawPrint size={20} />
                      </div>
                      <div className={styles.cardInfo}>
                        <span className={styles.cardMascota}>{e.nombreMascota || "Mascota"}</span>
                        <span className={styles.cardMotivo}>{e.motivo}</span>
                        <div className={styles.cardMetaRow}>
                          <span className={styles.cardMeta}><MapPin size={13} /> {e.ubicacion}</span>
                          {e.telefonoContacto && (
                            <a className={styles.cardMeta} href={`tel:${e.telefonoContacto}`}>
                              <Phone size={13} /> {e.telefonoContacto}
                            </a>
                          )}
                          <span className={styles.estadoBadge}>{e.estado === "EnAtencion" ? "En atención" : "Aceptada"}</span>
                        </div>
                      </div>
                    </div>
                    <div className={styles.cardAcciones}>
                      {e.estado === "Aceptada" && (
                        <button className={styles.btnIniciar} onClick={() => iniciar(e)} disabled={procesandoId === e.idEmergencia}>
                          <Play size={14} /> Iniciar atención
                        </button>
                      )}
                      {e.estado === "EnAtencion" && (
                        <button className={styles.btnFinalizar} onClick={() => abrirFinalizar(e)} disabled={procesandoId === e.idEmergencia}>
                          <CheckCircle2 size={14} /> Finalizar
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {modalFinalizar && (
        <div className={styles.overlay} onClick={() => setModalFinalizar(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Finalizar emergencia</h3>
              <button className={styles.closeBtn} onClick={() => setModalFinalizar(null)} aria-label="Cerrar">
                <X size={20} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <label className={styles.campo}>
                <span>Diagnóstico</span>
                <textarea value={diagnostico} onChange={(e) => setDiagnostico(e.target.value)} placeholder="Diagnóstico del paciente" />
              </label>
              <label className={styles.campo}>
                <span>Tratamiento</span>
                <textarea value={tratamiento} onChange={(e) => setTratamiento(e.target.value)} placeholder="Tratamiento aplicado" />
              </label>
              {errorModal && <p className={styles.errorMsg}>{errorModal}</p>}
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.btnSecundario} onClick={() => setModalFinalizar(null)}>Cancelar</button>
              <button className={styles.btnPrimario} onClick={confirmarFinalizar} disabled={procesandoId === modalFinalizar.idEmergencia}>
                Finalizar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PanelEmergencias;
