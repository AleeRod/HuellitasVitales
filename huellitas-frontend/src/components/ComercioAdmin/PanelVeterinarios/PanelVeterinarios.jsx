import React, { useEffect, useState } from "react";
import {
  X,
  Plus,
  Search,
  Stethoscope,
  Mail,
  CheckCircle,
  UserMinus,
  Store,
} from "lucide-react";
import { API_BASE } from "../../../api/config";
import styles from "./PanelVeterinarios.module.css";

const ESTADO = {
  CARGANDO: "cargando",
  OK: "ok",
  VACIO: "vacio",
  ERROR: "error",
  SIN_COMERCIO: "sin_comercio",
};

const obtenerToken = () => localStorage.getItem("token_huellitas") || "";

const authHeaders = (conJson = false) => ({
  Authorization: `Bearer ${obtenerToken()}`,
  ...(conJson ? { "Content-Type": "application/json" } : {}),
});

const iniciales = (nombre = "", apellidos = "") =>
  `${nombre.charAt(0)}${apellidos.charAt(0)}`.toUpperCase() || "V";

const PanelVeterinarios = ({ esAdmin = false }) => {
  const [veterinarias, setVeterinarias] = useState([]);
  const [idComercioSeleccionado, setIdComercioSeleccionado] = useState("");
  const [cargandoVeterinarias, setCargandoVeterinarias] = useState(true);

  const [veterinarios, setVeterinarios] = useState([]);
  const [estado, setEstado] = useState(ESTADO.CARGANDO);

  // Modal de vincular veterinario
  const [modalAbierto, setModalAbierto] = useState(false);
  const [correoBusqueda, setCorreoBusqueda] = useState("");
  const [buscandoUsuario, setBuscandoUsuario] = useState(false);
  const [usuarioEncontrado, setUsuarioEncontrado] = useState(null);
  const [especialidad, setEspecialidad] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [errorModal, setErrorModal] = useState("");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    cargarVeterinarias();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (idComercioSeleccionado) {
      cargarVeterinarios(idComercioSeleccionado);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idComercioSeleccionado]);

  const cargarVeterinarias = async () => {
    setCargandoVeterinarias(true);
    try {
      const ruta = esAdmin ? "veterinarias-lista" : "mis-veterinarias";
      const res = await fetch(`${API_BASE}/servicio/${ruta}`, { headers: authHeaders() });
      const data = await res.json();
      const lista = data.veterinarias || [];
      setVeterinarias(lista);
      if (lista.length > 0) {
        setIdComercioSeleccionado(String(lista[0].idComercio));
      } else {
        setEstado(ESTADO.SIN_COMERCIO);
      }
    } catch (err) {
      console.error(err);
      setEstado(ESTADO.ERROR);
    } finally {
      setCargandoVeterinarias(false);
    }
  };

  const cargarVeterinarios = async (idComercio) => {
    setEstado(ESTADO.CARGANDO);
    try {
      const res = await fetch(`${API_BASE}/veterinario/comercio/${idComercio}`, {
        headers: authHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.mensaje || "No se pudo cargar el equipo veterinario");
      const lista = data.veterinarios || [];
      setVeterinarios(lista);
      setEstado(lista.length === 0 ? ESTADO.VACIO : ESTADO.OK);
    } catch (err) {
      console.error(err);
      setEstado(ESTADO.ERROR);
    }
  };

  const abrirModal = () => {
    setCorreoBusqueda("");
    setUsuarioEncontrado(null);
    setEspecialidad("");
    setDescripcion("");
    setErrorModal("");
    setModalAbierto(true);
  };

  const cerrarModal = () => setModalAbierto(false);

  const buscarUsuario = async (e) => {
    e.preventDefault();
    const correo = correoBusqueda.trim();
    if (!correo) return;

    setBuscandoUsuario(true);
    setErrorModal("");
    setUsuarioEncontrado(null);
    try {
      const res = await fetch(
        `${API_BASE}/veterinario/buscar-usuario?correo=${encodeURIComponent(correo)}`,
        { headers: authHeaders() }
      );
      const data = await res.json();
      if (!res.ok) {
        setErrorModal(data?.mensaje || "No se encontró ningún usuario con ese correo.");
        return;
      }
      setUsuarioEncontrado(data);
    } catch (err) {
      console.error(err);
      setErrorModal("Ocurrió un error al buscar el usuario.");
    } finally {
      setBuscandoUsuario(false);
    }
  };

  const vincularVeterinario = async () => {
    if (!usuarioEncontrado) {
      setErrorModal("Primero buscá y confirmá el usuario por correo.");
      return;
    }

    setGuardando(true);
    setErrorModal("");
    try {
      const res = await fetch(`${API_BASE}/veterinario`, {
        method: "POST",
        headers: authHeaders(true),
        body: JSON.stringify({
          idComercio: Number(idComercioSeleccionado),
          correo: usuarioEncontrado.correo,
          especialidad: especialidad.trim() || null,
          descripcion: descripcion.trim() || null,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.mensaje || "No se pudo vincular al veterinario.");

      cerrarModal();
      cargarVeterinarios(idComercioSeleccionado);
    } catch (err) {
      setErrorModal(err.message);
    } finally {
      setGuardando(false);
    }
  };

  const quitarVeterinario = async (veterinario) => {
    const confirmar = window.confirm(
      `¿Quitar a ${veterinario.nombre} ${veterinario.apellidos} de esta veterinaria? Sus citas y servicios ya registrados no se ven afectados.`
    );
    if (!confirmar) return;

    try {
      const res = await fetch(`${API_BASE}/veterinario/${veterinario.idVeterinario}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.mensaje || "No se pudo quitar al veterinario.");
      cargarVeterinarios(idComercioSeleccionado);
    } catch (err) {
      console.error(err);
      alert(err.message || "No se pudo quitar al veterinario.");
    }
  };

  const veterinariaActual = veterinarias.find(
    (v) => String(v.idComercio) === String(idComercioSeleccionado)
  );

  if (!cargandoVeterinarias && veterinarias.length === 0) {
    return (
      <div className={styles.panel}>
        <div className={styles.estadoBox}>
          <Store size={32} color="#52B788" />
          <h3>No hay veterinarias disponibles</h3>
          <p>
            {esAdmin
              ? "Todavía no hay ninguna veterinaria aprobada en la plataforma."
              : "Tu cuenta todavía no está vinculada a una veterinaria aprobada."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.panel}>
      <div className={styles.headerRow}>
        <div>
          <h2 className={styles.titulo}>Veterinarios</h2>
          <p className={styles.subtitulo}>
            Gestioná el equipo médico que atiende los servicios de tu veterinaria.
          </p>
        </div>

        <div className={styles.headerAcciones}>
          {veterinarias.length > 1 && (
            <label className={styles.selectorComercio}>
              <Store size={16} />
              <select
                value={idComercioSeleccionado}
                onChange={(e) => setIdComercioSeleccionado(e.target.value)}
              >
                {veterinarias.map((v) => (
                  <option key={v.idComercio} value={v.idComercio}>
                    {v.nombreComercial}
                  </option>
                ))}
              </select>
            </label>
          )}

          <button
            className={styles.btnNuevo}
            onClick={abrirModal}
            disabled={!idComercioSeleccionado}
          >
            <Plus size={18} />
            Agregar veterinario
          </button>
        </div>
      </div>

      {estado === ESTADO.CARGANDO && (
        <div className={styles.estadoBox}>Cargando equipo veterinario...</div>
      )}

      {estado === ESTADO.ERROR && (
        <div className={styles.estadoBox}>
          No pudimos cargar el equipo veterinario.{" "}
          <button
            onClick={() => cargarVeterinarios(idComercioSeleccionado)}
            className={styles.linkBtn}
          >
            Reintentar
          </button>
        </div>
      )}

      {estado === ESTADO.VACIO && (
        <div className={styles.estadoBox}>
          <Stethoscope size={32} color="#52B788" />
          <h3>Todavía no hay veterinarios en {veterinariaActual?.nombreComercial}</h3>
          <p>
            Agregá al primer veterinario buscándolo por su correo. Debe tener ya una cuenta
            creada en Huellitas Vitales.
          </p>
          <button className={styles.btnNuevo} onClick={abrirModal}>
            <Plus size={18} />
            Agregar el primero
          </button>
        </div>
      )}

      {estado === ESTADO.OK && (
        <div className={styles.grid}>
          {veterinarios.map((v) => (
            <div className={styles.card} key={v.idVeterinario}>
              <div className={styles.cardTop}>
                <div className={styles.avatar}>{iniciales(v.nombre, v.apellidos)}</div>
                <div>
                  <div className={styles.cardNombre}>
                    {v.nombre} {v.apellidos}
                  </div>
                  <div className={styles.cardCorreo}>
                    <Mail size={12} />
                    {v.correo}
                  </div>
                </div>
              </div>

              {v.especialidad && (
                <span className={styles.especialidadBadge}>
                  <Stethoscope size={14} />
                  {v.especialidad}
                </span>
              )}

              {v.descripcion && <p className={styles.cardDescripcion}>{v.descripcion}</p>}

              <div className={styles.cardFooter}>
                <button className={styles.btnQuitar} onClick={() => quitarVeterinario(v)}>
                  <UserMinus size={14} />
                  Quitar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalAbierto && (
        <div className={styles.overlay} onClick={cerrarModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>
                <Stethoscope size={20} />
                Agregar veterinario
              </h3>
              <button className={styles.closeBtn} onClick={cerrarModal} aria-label="Cerrar">
                <X size={20} />
              </button>
            </div>

            <div className={styles.modalBody}>
              <p className={styles.ayudaModal}>
                El veterinario debe tener ya una cuenta creada en Huellitas Vitales. Buscalo por
                su correo para vincularlo a <strong>{veterinariaActual?.nombreComercial}</strong>.
              </p>

              <form onSubmit={buscarUsuario} className={styles.busquedaForm}>
                <label className={styles.campo} style={{ flex: 1 }}>
                  <span>Correo del veterinario</span>
                  <input
                    type="email"
                    value={correoBusqueda}
                    onChange={(e) => {
                      setCorreoBusqueda(e.target.value);
                      setUsuarioEncontrado(null);
                    }}
                    placeholder="veterinario@correo.com"
                    required
                  />
                </label>
                <button type="submit" className={styles.btnSecundario} disabled={buscandoUsuario}>
                  <Search size={16} />
                  {buscandoUsuario ? "Buscando..." : "Buscar"}
                </button>
              </form>

              {usuarioEncontrado && (
                <div className={styles.usuarioEncontrado}>
                  <CheckCircle size={18} color="#2e7d32" />
                  <div>
                    <div className={styles.usuarioNombre}>
                      {usuarioEncontrado.nombre} {usuarioEncontrado.apellidos}
                    </div>
                    <div className={styles.usuarioCorreo}>{usuarioEncontrado.correo}</div>
                  </div>
                </div>
              )}

              {usuarioEncontrado && (
                <>
                  <label className={styles.campo}>
                    <span>Especialidad (opcional)</span>
                    <input
                      type="text"
                      value={especialidad}
                      onChange={(e) => setEspecialidad(e.target.value)}
                      placeholder="Ej: Medicina felina"
                      maxLength={150}
                    />
                  </label>

                  <label className={styles.campo}>
                    <span>Descripción (opcional)</span>
                    <textarea
                      value={descripcion}
                      onChange={(e) => setDescripcion(e.target.value)}
                      placeholder="Breve reseña que verán los clientes"
                      maxLength={500}
                      rows={3}
                    />
                  </label>
                </>
              )}

              {errorModal && <p className={styles.errorMsg}>{errorModal}</p>}
            </div>

            <div className={styles.modalFooter}>
              <button className={styles.btnSecundario} onClick={cerrarModal} disabled={guardando}>
                Cancelar
              </button>
              <button
                className={styles.btnPrimario}
                onClick={vincularVeterinario}
                disabled={!usuarioEncontrado || guardando}
              >
                <Plus size={16} />
                {guardando ? "Vinculando..." : "Vincular veterinario"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PanelVeterinarios;
