import React, { useEffect, useState } from "react";
import { CalendarDays, AlertTriangle, Paperclip, ArrowLeftRight } from "lucide-react";
import { API_BASE } from "../../../api/config";
import styles from "./PanelReportes.module.css";

const ESTADO = {
  CARGANDO: "cargando",
  OK: "ok",
  ERROR: "error",
};

const obtenerToken = () => localStorage.getItem("token_huellitas") || "";

const formatFecha = (fechaISO) => {
  if (!fechaISO) return "-";
  return new Date(fechaISO).toLocaleDateString("es-CR", { day: "2-digit", month: "2-digit", year: "numeric" });
};

const PanelReportes = () => {
  const [reporte, setReporte] = useState(null);
  const [estado, setEstado] = useState(ESTADO.CARGANDO);

  useEffect(() => {
    cargar();
  }, []);

  const cargar = async () => {
    setEstado(ESTADO.CARGANDO);
    try {
      const res = await fetch(`${API_BASE}/reporte/resumen`, {
        headers: { Authorization: `Bearer ${obtenerToken()}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.mensaje || "No se pudo cargar el reporte.");
      setReporte(data.reporte);
      setEstado(ESTADO.OK);
    } catch (err) {
      console.error(err);
      setEstado(ESTADO.ERROR);
    }
  };

  if (estado === ESTADO.CARGANDO) {
    return (
      <div className={styles.panel}>
        <div className={styles.estadoBox}>Cargando reporte...</div>
      </div>
    );
  }

  if (estado === ESTADO.ERROR) {
    return (
      <div className={styles.panel}>
        <div className={styles.estadoBox}>
          No pudimos cargar el reporte.{" "}
          <button onClick={cargar} className={styles.linkBtn}>Reintentar</button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.panel}>
      <div className={styles.headerRow}>
        <h2 className={styles.titulo}>Reportes</h2>
        <p className={styles.subtitulo}>Resumen de la actividad clínica reciente.</p>
      </div>

      <div className={styles.statGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}><CalendarDays size={20} /></div>
          <div className={styles.statLabel}>Citas completadas</div>
          <div className={styles.statNumber}>{reporte.citasCompletadas}</div>
          <div className={styles.statNote}>de {reporte.citasTotales} citas registradas</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}><AlertTriangle size={20} /></div>
          <div className={styles.statLabel}>Emergencias atendidas</div>
          <div className={styles.statNumber}>{reporte.emergenciasAtendidas}</div>
          <div className={styles.statNote}>{reporte.emergenciasActivas} activas ahora</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}><Paperclip size={20} /></div>
          <div className={styles.statLabel}>Atenciones externas</div>
          <div className={styles.statNumber}>{reporte.atencionesExternasRegistradas}</div>
          <div className={styles.statNote}>registradas por clientes</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}><ArrowLeftRight size={20} /></div>
          <div className={styles.statLabel}>Traslados resueltos</div>
          <div className={styles.statNumber}>{reporte.trasladosResueltos}</div>
          <div className={styles.statNote}>aceptados o rechazados</div>
        </div>
      </div>

      <div className={styles.gridActividad}>
        <div className={styles.bloque}>
          <h3 className={styles.bloqueTitulo}><AlertTriangle size={16} /> Últimas emergencias atendidas</h3>
          {(reporte.ultimasEmergencias || []).length === 0 ? (
            <p className={styles.itemVacio}>Sin registros todavía.</p>
          ) : (
            reporte.ultimasEmergencias.map((e) => (
              <div className={styles.item} key={e.idEmergencia}>
                <div className={styles.itemTitulo}>
                  {e.nombreMascota} — {e.motivo}
                  {e.esAtencionExterna && <span className={`${styles.badge} ${styles.badgeExterna}`}>externa</span>}
                </div>
                <div className={styles.itemMeta}>{formatFecha(e.fechaFinalizacion)}</div>
              </div>
            ))
          )}
        </div>

        <div className={styles.bloque}>
          <h3 className={styles.bloqueTitulo}><Paperclip size={16} /> Últimas atenciones externas</h3>
          {(reporte.ultimasAtencionesExternas || []).length === 0 ? (
            <p className={styles.itemVacio}>Sin registros todavía.</p>
          ) : (
            reporte.ultimasAtencionesExternas.map((a) => (
              <div className={styles.item} key={a.idAtencionExterna}>
                <div className={styles.itemTitulo}>{a.nombreMascota} — {a.nombreVeterinaria}</div>
                <div className={styles.itemMeta}>{a.motivo} · {formatFecha(a.fechaAtencion)}</div>
              </div>
            ))
          )}
        </div>

        <div className={styles.bloque}>
          <h3 className={styles.bloqueTitulo}><ArrowLeftRight size={16} /> Últimos traslados</h3>
          {(reporte.ultimosTraslados || []).length === 0 ? (
            <p className={styles.itemVacio}>Sin registros todavía.</p>
          ) : (
            reporte.ultimosTraslados.map((t) => (
              <div className={styles.item} key={t.idSolicitudTraslado}>
                <div className={styles.itemTitulo}>
                  {t.nombreMascota} → {t.veterinariaDestino}
                  <span className={`${styles.badge} ${t.estado === "Aceptada" ? styles.badgeOk : styles.badgeRechazado}`}>
                    {t.estado}
                  </span>
                </div>
                <div className={styles.itemMeta}>{formatFecha(t.fechaResolucion)}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default PanelReportes;
