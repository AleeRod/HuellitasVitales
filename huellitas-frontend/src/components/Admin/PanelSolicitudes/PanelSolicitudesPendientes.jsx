import { useEffect, useState, useCallback } from "react";
import styles from "./PanelSolicitudesPendientes.module.css";
import { API_BASE } from "../../../api/config.js";


    function getAuthHeaders() {
    const token = localStorage.getItem("token_huellitas");
    return {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
    }

    function formatFecha(fechaISO) {
    if (!fechaISO) return "-";
    const d = new Date(fechaISO);
    return d.toLocaleDateString("es-CR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
    }

    export default function PanelSolicitudesPendientes() {
    const [solicitudes, setSolicitudes] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(null);
    const [procesandoId, setProcesandoId] = useState(null);

    const cargarSolicitudes = useCallback(async () => {
        setCargando(true);
        setError(null);
        try {
        const res = await fetch(`${API_BASE}/Comercio/pendientes`, {
            headers: getAuthHeaders(),
        });

        if (res.status === 403) {
            throw new Error("No tienes permisos para ver esta información.");
        }
        if (!res.ok) throw new Error(`Error ${res.status} al cargar solicitudes`);

        const data = await res.json();
        setSolicitudes(data);
        } catch (err) {
        setError(err.message || "No se pudieron cargar las solicitudes");
        } finally {
        setCargando(false);
        }
    }, []);

    useEffect(() => {
        cargarSolicitudes();
    }, [cargarSolicitudes]);

    const handleResolver = async (idComercio, accion) => {
        const confirmacion = window.confirm(
        accion === "aprobar"
            ? "¿Aprobar esta solicitud de comercio?"
            : "¿Rechazar esta solicitud de comercio?"
        );
        if (!confirmacion) return;

        setProcesandoId(idComercio);
        try {
        const res = await fetch(`${API_BASE}/Comercio/${idComercio}/${accion}`, {
            method: "PUT",
            headers: getAuthHeaders(),
        });

        const data = await res.json().catch(() => null);

        if (!res.ok) {
            throw new Error(
            data?.mensaje || `No se pudo ${accion} la solicitud (${res.status})`
            );
        }

        // La solicitud deja de estar pendiente: la quitamos de la lista
        setSolicitudes((prev) => prev.filter((s) => s.idComercio !== idComercio));
        } catch (err) {
        alert(err.message || `No se pudo ${accion} la solicitud`);
        } finally {
        setProcesandoId(null);
        }
    };

    return (
        <div className={styles.container}>
        <h2>Solicitudes de Comercio Pendientes</h2>

        {cargando && <p className={styles.info}>Cargando solicitudes...</p>}

        {!cargando && error && (
            <div className={styles.error}>
            <span>{error}</span>
            <button onClick={cargarSolicitudes}>Reintentar</button>
            </div>
        )}

        {!cargando && !error && solicitudes.length === 0 && (
            <p className={styles.info}>No hay solicitudes pendientes.</p>
        )}

        {!cargando && !error && solicitudes.length > 0 && (
            <table className={styles.tabla}>
            <thead>
                <tr>
                <th>Comercio</th>
                <th>Tipo</th>
                <th>Persona Legal</th>
                <th>Dirección</th>
                <th>Teléfono</th>
                <th>Fecha Solicitud</th>
                <th>Acciones</th>
                </tr>
            </thead>
            <tbody>
                {solicitudes.map((s) => {
                const enProceso = procesandoId === s.idComercio;

                return (
                    <tr key={s.idComercio}>
                    <td>{s.nombreComercial}</td>
                    <td>{s.tipoComercio}</td>
                    <td>{s.nombrePersonaLegal}</td>
                    <td>{s.direccion || "-"}</td>
                    <td>{s.telefono || "-"}</td>
                    <td>{formatFecha(s.fechaSolicitud)}</td>
                    <td className={styles.acciones}>
                        <button
                        className={styles.aceptar}
                        disabled={enProceso}
                        onClick={() => handleResolver(s.idComercio, "aprobar")}
                        >
                        {enProceso ? "..." : "Aceptar"}
                        </button>
                        <button
                        className={styles.rechazar}
                        disabled={enProceso}
                        onClick={() => handleResolver(s.idComercio, "rechazar")}
                        >
                        {enProceso ? "..." : "Rechazar"}
                        </button>
                    </td>
                    </tr>
                );
                })}
            </tbody>
            </table>
        )}
        </div>
    );
    }