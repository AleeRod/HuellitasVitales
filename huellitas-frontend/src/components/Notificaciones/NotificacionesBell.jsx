import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import { API_BASE, manejarSesionExpirada } from "../../api/config";
import styles from "./NotificacionesBell.module.css";

const obtenerToken = () => localStorage.getItem("token_huellitas") || "";

const formatFecha = (fechaISO) => {
  if (!fechaISO) return "";
  return new Date(fechaISO).toLocaleString("es-CR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
};

const idRolActual = () => {
  try {
    const u = JSON.parse(localStorage.getItem("usuario_huellitas") || "null");
    return u?.idRol ?? null;
  } catch {
    return null;
  }
};

// A qué pantalla mandar según el tipo de notificación y el rol de quien la recibe — cada rol
// tiene su propio panel, y adentro, su propia pestaña para emergencias/traslados. Los únicos
// dos "tipo" que existen hoy en el sistema son Emergencia y TrasladoExpediente.
const rutaDestino = (notificacion) => {
  const idRol = idRolActual();
  if (notificacion.tipo === "Emergencia") {
    if (idRol === 3) return "/cliente/emergencia";
    if (idRol === 2) return "/veterinario?vista=emergencias";
    if (idRol === 1) return "/admin?seccion=emergencias";
    return null; // Funcionario: no tiene una pestaña de emergencias en su panel todavía.
  }
  if (notificacion.tipo === "TrasladoExpediente") {
    if (idRol === 3) return "/cliente/trasladar-expediente";
    if (idRol === 2) return "/veterinario?vista=traslados";
    if (idRol === 1) return "/admin?seccion=traslados";
    if (idRol === 4) return "/funcionario?seccion=traslados";
  }
  return null;
};

// Campanita de notificaciones real: reemplaza los botones <Bell> decorativos que había
// repetidos por toda la app (sin onClick, sin datos). Consume /api/notificacion.
const NotificacionesBell = ({ size = 18 }) => {
  const [abierto, setAbierto] = useState(false);
  const [notificaciones, setNotificaciones] = useState([]);
  const [cargado, setCargado] = useState(false);
  const contenedorRef = useRef(null);
  const navigate = useNavigate();

  const cargar = async () => {
    try {
      const res = await fetch(`${API_BASE}/notificacion`, {
        headers: { Authorization: `Bearer ${obtenerToken()}` },
      });

      if (res.status === 401) {
        // La sesión expiró (el JWT dura 2 horas). Antes esto se reintentaba cada minuto contra
        // un token muerto para siempre, además de reventar al parsear el 401 sin body como si
        // fuera JSON.
        manejarSesionExpirada();
        return;
      }
      if (!res.ok) return;

      const data = await res.json();
      setNotificaciones(data.notificaciones || []);
      setCargado(true);
    } catch (err) {
      console.error("Error al cargar notificaciones:", err);
    }
  };

  useEffect(() => {
    cargar();
    const intervalo = setInterval(cargar, 60000);
    return () => clearInterval(intervalo);
  }, []);

  useEffect(() => {
    const alHacerClickFuera = (e) => {
      if (contenedorRef.current && !contenedorRef.current.contains(e.target)) setAbierto(false);
    };
    document.addEventListener("mousedown", alHacerClickFuera);
    return () => document.removeEventListener("mousedown", alHacerClickFuera);
  }, []);

  const toggle = () => {
    setAbierto((prev) => !prev);
    if (!cargado) cargar();
  };

  const marcarLeida = async (notificacion) => {
    if (!notificacion.leida) {
      setNotificaciones((prev) => prev.map((n) => (n.idNotificacion === notificacion.idNotificacion ? { ...n, leida: true } : n)));
      try {
        await fetch(`${API_BASE}/notificacion/${notificacion.idNotificacion}/leida`, {
          method: "PUT",
          headers: { Authorization: `Bearer ${obtenerToken()}` },
        });
      } catch (err) {
        console.error("Error al marcar notificación como leída:", err);
      }
    }

    // Además de marcarla leída, la lleva directo a la zona relacionada (emergencia, traslado...)
    // en vez de dejarla ahí sin ninguna acción real.
    setAbierto(false);
    const destino = rutaDestino(notificacion);
    if (destino) navigate(destino);
  };

  const noLeidas = notificaciones.filter((n) => !n.leida).length;

  return (
    <div className={styles.wrap} ref={contenedorRef}>
      <button className={styles.boton} title="Notificaciones" onClick={toggle}>
        <Bell size={size} />
        {noLeidas > 0 && <span className={styles.badge}>{noLeidas > 9 ? "9+" : noLeidas}</span>}
      </button>

      {abierto && (
        <div className={styles.dropdown}>
          <div className={styles.header}>Notificaciones</div>
          {notificaciones.length === 0 ? (
            <div className={styles.vacio}>No tenés notificaciones todavía.</div>
          ) : (
            notificaciones.map((n) => (
              <button
                key={n.idNotificacion}
                className={`${styles.item} ${!n.leida ? styles.itemNoLeida : ""}`}
                onClick={() => marcarLeida(n)}
              >
                <div className={styles.itemTitulo}>
                  {!n.leida && <span className={styles.puntoNoLeido} />}
                  {n.titulo}
                </div>
                <div className={styles.itemMensaje}>{n.mensaje}</div>
                <div className={styles.itemFecha}>{formatFecha(n.fechaCreacion)}</div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default NotificacionesBell;
