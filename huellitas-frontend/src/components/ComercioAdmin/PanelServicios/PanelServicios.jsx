import React, { useEffect, useState } from "react";
import { X, Plus, Pencil, Trash2, Clock, DollarSign, Stethoscope, Scissors, Syringe, Tags, CheckCircle, XCircle, Store, Send, Inbox, Check, Hourglass } from "lucide-react";
import { API_BASE } from "../../../api/config";
import styles from "./PanelServicios.module.css";

const ESTADO_SOLICITUD = {
  1: { texto: "Pendiente", clase: "pendiente" },
  2: { texto: "Aprobada", clase: "aprobada" },
  3: { texto: "Rechazada", clase: "rechazada" },
};

const ICONOS_TIPO = {
  consulta: Stethoscope,
  grooming: Scissors,
  procedimiento: Syringe,
};

const iconoParaTipo = (nombre) =>
  ICONOS_TIPO[(nombre || "").trim().toLowerCase()] || Stethoscope;

const FORM_VACIO = {
  idServicio: null,
  nombre: "",
  descripcion: "",
  duracionMinutos: "",
  precio: "",
  idTipoServicio: "",
  idVeterinario: "",
  activo: true,
};

const ESTADO = {
  CARGANDO: "cargando",
  OK: "ok",
  VACIO: "vacio",
  ERROR: "error",
  SIN_COMERCIO: "sin_comercio",
};

const PanelServicios = ({ esAdmin = false }) => {
  const [servicios, setServicios] = useState([]);
  const [estado, setEstado] = useState(ESTADO.CARGANDO);
  const [modalAbierto, setModalAbierto] = useState(false);

  const [modalTiposAbierto, setModalTiposAbierto] = useState(false);
  const [tiposServicio, setTiposServicio] = useState([]);
  const [nombreTipoNuevo, setNombreTipoNuevo] = useState("");
  const [guardandoTipo, setGuardandoTipo] = useState(false);
  const [errorTipo, setErrorTipo] = useState("");

  // Solicitudes de tipo de servicio: el Admin crea directo, el Funcionario solicita.
  const [solicitudesPendientes, setSolicitudesPendientes] = useState([]);
  const [misSolicitudes, setMisSolicitudes] = useState([]);
  const [procesandoSolicitudId, setProcesandoSolicitudId] = useState(null);

  const [veterinarias, setVeterinarias] = useState([]);
  const [idComercioSeleccionado, setIdComercioSeleccionado] = useState("");
  const [veterinariosComercio, setVeterinariosComercio] = useState([]);

  const [form, setForm] = useState(FORM_VACIO);
  const [editando, setEditando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [errorForm, setErrorForm] = useState("");

  const [user, setUser] = useState(null);

  // Verificación flexible del rol (soporta idRol numérico o texto)
  const esFuncionario = Number(user?.idRol) === 4 || user?.rol === "Funcionario";
  const puedeVerTipos = esAdmin || esFuncionario;

  useEffect(() => {
    const usuarioGuardado = localStorage.getItem("usuario_huellitas");
    if (usuarioGuardado) {
      try {
        setUser(JSON.parse(usuarioGuardado));
      } catch (e) {
        console.error("Error al parsear el usuario:", e);
      }
    }

    cargarTiposServicio();
    inicializarVeterinarias();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (idComercioSeleccionado) {
      cargarServicios(idComercioSeleccionado);
      cargarVeterinariosComercio(idComercioSeleccionado);
    } else {
      setVeterinariosComercio([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idComercioSeleccionado]);

  useEffect(() => {
    if (!user) return;
    if (esAdmin) cargarSolicitudesPendientes();
    else if (esFuncionario) cargarMisSolicitudes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, esAdmin, esFuncionario]);

  const obtenerToken = () => localStorage.getItem("token_huellitas") || "";

  const getHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${obtenerToken()}`,
  });

  const cargarTiposServicio = async () => {
    try {
      const res = await fetch(`${API_BASE}/tiposervicio`);
      const data = await res.json();
      if (data.success) setTiposServicio(data.tipos || []);
    } catch (err) {
      console.error("Error al cargar tipos de servicio:", err);
    }
  };

  const inicializarVeterinarias = async () => {
    setEstado(ESTADO.CARGANDO);
    try {
      if (esAdmin) {
        const res = await fetch(`${API_BASE}/servicio/veterinarias-lista`, { headers: getHeaders() });
        const data = await res.json();
        const lista = data.veterinarias || [];
        setVeterinarias(lista);
        if (lista.length > 0) setIdComercioSeleccionado(String(lista[0].idComercio));
        else setEstado(ESTADO.SIN_COMERCIO);
      } else {
        const res = await fetch(`${API_BASE}/servicio/mis-veterinarias`, { headers: getHeaders() });
        const data = await res.json();
        const lista = data.veterinarias || [];
        setVeterinarias(lista);
        if (lista.length > 0) setIdComercioSeleccionado(String(lista[0].idComercio));
        else setEstado(ESTADO.SIN_COMERCIO);
      }
    } catch (err) {
      console.error(err);
      setEstado(ESTADO.ERROR);
    }
  };

  const cargarServicios = async (idComercio) => {
    setEstado(ESTADO.CARGANDO);
    try {
      const res = await fetch(`${API_BASE}/servicio/comercio/${idComercio}`, { headers: getHeaders() });
      if (!res.ok) throw new Error("No se pudo cargar la lista de servicios");
      const data = await res.json();
      const lista = data.servicios || [];
      setServicios(lista);
      setEstado(lista.length === 0 ? ESTADO.VACIO : ESTADO.OK);
    } catch (err) {
      console.error(err);
      setEstado(ESTADO.ERROR);
    }
  };

  const cargarVeterinariosComercio = async (idComercio) => {
    try {
      const res = await fetch(`${API_BASE}/servicio/veterinarios-comercio/${idComercio}`, { headers: getHeaders() });
      const data = await res.json();
      setVeterinariosComercio(data.veterinarios || []);
    } catch (err) {
      console.error("Error al cargar veterinarios del comercio:", err);
      setVeterinariosComercio([]);
    }
  };

  const abrirNuevo = () => {
    setForm({
      ...FORM_VACIO,
      idTipoServicio: tiposServicio.find((t) => t.activo)?.idTipoServicio || "",
      idVeterinario: veterinariosComercio[0]?.idVeterinario || "",
    });
    setEditando(false);
    setErrorForm("");
    setModalAbierto(true);
  };

  const abrirEdicion = (servicio) => {
    setForm({
      idServicio: servicio.idServicio,
      nombre: servicio.nombre,
      descripcion: servicio.descripcion || "",
      duracionMinutos: servicio.duracionMinutos,
      precio: servicio.precio,
      idTipoServicio: servicio.idTipoServicio,
      idVeterinario: servicio.idVeterinario || "",
      activo: servicio.activo,
    });
    setEditando(true);
    setErrorForm("");
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setForm(FORM_VACIO);
    setErrorForm("");
  };

  const handleChange = (campo, valor) => {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  };

  const validarForm = () => {
    if (!form.nombre.trim()) return "El nombre del servicio es obligatorio.";
    if (!form.idTipoServicio) return "Seleccioná un tipo de servicio.";
    if (!form.duracionMinutos || Number(form.duracionMinutos) <= 0)
      return "La duración debe ser mayor a 0 minutos.";
    if (form.precio === "" || Number(form.precio) <= 0)
      return "Ingresá un precio válido.";
    if (!idComercioSeleccionado) return "Seleccioná una veterinaria.";
    if (!form.idVeterinario)
      return "Asigná un veterinario de esta veterinaria al servicio. Si todavía no tenés ninguno registrado, pedile a un administrador que lo vincule.";
    return "";
  };

  const guardarServicio = async () => {
    const error = validarForm();
    if (error) {
      setErrorForm(error);
      return;
    }
    setGuardando(true);
    setErrorForm("");
    try {
      const url = editando ? `${API_BASE}/servicio/${form.idServicio}` : `${API_BASE}/servicio`;
      const method = editando ? "PUT" : "POST";

      const payload = editando
        ? {
            nombre: form.nombre.trim(),
            descripcion: form.descripcion.trim() || null,
            duracionMinutos: Number(form.duracionMinutos),
            precio: Number(form.precio),
            idTipoServicio: Number(form.idTipoServicio),
            idVeterinario: Number(form.idVeterinario),
            activo: form.activo,
          }
        : {
            idComercio: Number(idComercioSeleccionado),
            nombre: form.nombre.trim(),
            descripcion: form.descripcion.trim() || null,
            duracionMinutos: Number(form.duracionMinutos),
            precio: Number(form.precio),
            idTipoServicio: Number(form.idTipoServicio),
            idVeterinario: Number(form.idVeterinario),
          };

      const res = await fetch(url, {
        method,
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.mensaje || "No se pudo guardar el servicio");

      cerrarModal();
      cargarServicios(idComercioSeleccionado);
    } catch (err) {
      console.error(err);
      setErrorForm(err.message || "Ocurrió un error al guardar. Intentá de nuevo.");
    } finally {
      setGuardando(false);
    }
  };

  const desactivarServicio = async (servicio) => {
    const confirmar = window.confirm(
      `¿Seguro que querés desactivar "${servicio.nombre}"? Ya no aparecerá disponible en el Marketplace.`
    );
    if (!confirmar) return;

    try {
      const res = await fetch(`${API_BASE}/servicio/${servicio.idServicio}`, {
        method: "DELETE",
        headers: getHeaders(),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.mensaje || "No se pudo desactivar el servicio");
      cargarServicios(idComercioSeleccionado);
    } catch (err) {
      console.error(err);
      alert(err.message || "No se pudo desactivar el servicio. Intentá de nuevo.");
    }
  };

  const handleCrearTipo = async (e) => {
    e.preventDefault();
    const nombre = nombreTipoNuevo.trim();
    if (!nombre) return;

    setGuardandoTipo(true);
    setErrorTipo("");
    try {
      const res = await fetch(`${API_BASE}/tiposervicio`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ nombre }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.mensaje || "No se pudo crear el tipo de servicio");

      setNombreTipoNuevo("");
      cargarTiposServicio();
    } catch (err) {
      console.error(err);
      setErrorTipo(err.message || "Ocurrió un error al crear el tipo de servicio.");
    } finally {
      setGuardandoTipo(false);
    }
  };

  const handleToggleTipo = async (tipo) => {
    try {
      const res = await fetch(`${API_BASE}/tiposervicio/${tipo.idTipoServicio}/estado`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify({ activo: !tipo.activo }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.mensaje || "No se pudo actualizar el tipo de servicio");
      cargarTiposServicio();
    } catch (err) {
      console.error(err);
      alert(err.message || "No se pudo actualizar el tipo de servicio.");
    }
  };

  // ─── Solicitudes de tipo de servicio (Funcionario pide, Admin resuelve) ───
  const cargarSolicitudesPendientes = async () => {
    try {
      const res = await fetch(`${API_BASE}/tiposervicio/solicitudes/pendientes`, { headers: getHeaders() });
      const data = await res.json();
      setSolicitudesPendientes(data.solicitudes || []);
    } catch (err) {
      console.error("Error al cargar solicitudes pendientes:", err);
    }
  };

  const cargarMisSolicitudes = async () => {
    try {
      const res = await fetch(`${API_BASE}/tiposervicio/solicitudes/mias`, { headers: getHeaders() });
      const data = await res.json();
      setMisSolicitudes(data.solicitudes || []);
    } catch (err) {
      console.error("Error al cargar mis solicitudes:", err);
    }
  };

  const handleSolicitarTipo = async (e) => {
    e.preventDefault();
    const nombre = nombreTipoNuevo.trim();
    if (!nombre || !idComercioSeleccionado) return;

    setGuardandoTipo(true);
    setErrorTipo("");
    try {
      const res = await fetch(`${API_BASE}/tiposervicio/solicitar`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ nombre, idComercio: Number(idComercioSeleccionado) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.mensaje || "No se pudo enviar la solicitud");

      setNombreTipoNuevo("");
      cargarMisSolicitudes();
    } catch (err) {
      console.error(err);
      setErrorTipo(err.message || "Ocurrió un error al enviar la solicitud.");
    } finally {
      setGuardandoTipo(false);
    }
  };

  const resolverSolicitud = async (idSolicitud, accion) => {
    setProcesandoSolicitudId(idSolicitud);
    try {
      const res = await fetch(`${API_BASE}/tiposervicio/solicitudes/${idSolicitud}/${accion}`, {
        method: "PUT",
        headers: getHeaders(),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.mensaje || "No se pudo resolver la solicitud");

      cargarSolicitudesPendientes();
      if (accion === "aprobar") cargarTiposServicio();
    } catch (err) {
      console.error(err);
      alert(err.message || "No se pudo resolver la solicitud.");
    } finally {
      setProcesandoSolicitudId(null);
    }
  };

  const tipoInfo = (idTipo) =>
    tiposServicio.find((t) => t.idTipoServicio === idTipo) || { nombre: "Servicio" };

  return (
    <div className={styles.panel}>
      <div className={styles.headerRow}>
        <div>
          <h2 className={styles.titulo}>Servicios</h2>
          <p className={styles.subtitulo}>Gestioná las consultas, groomings y procedimientos que ofrecés.</p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {veterinarias.length > 1 && (
            <select
              value={idComercioSeleccionado}
              onChange={(e) => setIdComercioSeleccionado(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #ced4da' }}
            >
              {veterinarias.map((v) => (
                <option key={v.idComercio} value={v.idComercio}>{v.nombreComercial}</option>
              ))}
            </select>
          )}

          {puedeVerTipos && (
            <button
              className={styles.btnSecundario || styles.btnNuevo}
              onClick={() => setModalTiposAbierto(true)}
              style={{ backgroundColor: '#e9ecef', color: '#1b4332', border: '1px solid #ced4da', position: 'relative' }}
            >
              <Tags size={18} />
              Tipos de servicio
              {esAdmin && solicitudesPendientes.length > 0 && (
                <span className={styles.badgePendientes}>{solicitudesPendientes.length}</span>
              )}
            </button>
          )}

          {idComercioSeleccionado && (
            <button className={styles.btnNuevo} onClick={abrirNuevo}>
              <Plus size={18} />
              Nuevo servicio
            </button>
          )}
        </div>
      </div>

      {estado === ESTADO.CARGANDO && (
        <div className={styles.estadoBox}>Cargando servicios...</div>
      )}

      {estado === ESTADO.SIN_COMERCIO && (
        <div className={styles.estadoBox}>
          <Store size={32} />
          <h3>No tenés una veterinaria afiliada</h3>
          <p>Tu cuenta todavía no está vinculada a un comercio de tipo Clínica Veterinaria aprobado.</p>
        </div>
      )}

      {estado === ESTADO.ERROR && (
        <div className={styles.estadoBox}>
          No pudimos cargar tus servicios.{" "}
          <button onClick={() => cargarServicios(idComercioSeleccionado)} className={styles.linkBtn}>
            Reintentar
          </button>
        </div>
      )}

      {estado === ESTADO.VACIO && (
        <div className={styles.estadoBox}>
          <h3>Todavía no tenés servicios cargados</h3>
          <p>Agregá tu primera consulta, grooming o procedimiento para que aparezca en el Marketplace.</p>
          <button className={styles.btnNuevo} onClick={abrirNuevo}>
            <Plus size={18} />
            Crear el primero
          </button>
        </div>
      )}

      {estado === ESTADO.OK && (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Servicio</th>
                <th>Tipo</th>
                <th>Veterinario</th>
                <th>Duración</th>
                <th>Precio</th>
                <th>Estado</th>
                <th aria-label="Acciones"></th>
              </tr>
            </thead>
            <tbody>
              {servicios.map((s) => {
                const tipo = tipoInfo(s.idTipoServicio);
                const nombreTipo = s.nombreTipoServicio || tipo.nombre;
                const TipoIcon = iconoParaTipo(nombreTipo);
                return (
                  <tr key={s.idServicio}>
                    <td>
                      <div className={styles.nombreCell}>
                        <span className={styles.nombreServicio}>{s.nombre}</span>
                        {s.descripcion && (
                          <span className={styles.descripcionServicio}>{s.descripcion}</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={styles.tipoBadge}>
                        <TipoIcon size={14} />
                        {nombreTipo}
                      </span>
                    </td>
                    <td>
                      <span className={styles.metaCell}>
                        {s.nombreVeterinario || "Sin asignar"}
                      </span>
                    </td>
                    <td>
                      <span className={styles.metaCell}>
                        <Clock size={14} />
                        {s.duracionMinutos} min
                      </span>
                    </td>
                    <td>
                      <span className={styles.metaCell}>
                        <DollarSign size={14} />
                        {Number(s.precio).toLocaleString("es-CR", { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td>
                      <span className={s.activo ? styles.estadoOk : styles.estadoOff}>
                        {s.activo ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td>
                      <div className={styles.acciones}>
                        <button
                          className={styles.iconBtn}
                          onClick={() => abrirEdicion(s)}
                          aria-label={`Editar ${s.nombre}`}
                        >
                          <Pencil size={16} />
                        </button>
                        {s.activo && (
                          <button
                            className={styles.iconBtnDanger}
                            onClick={() => desactivarServicio(s)}
                            aria-label={`Desactivar ${s.nombre}`}
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {modalAbierto && (
        <div className={styles.overlay} onClick={cerrarModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>{editando ? "Editar servicio" : "Nuevo servicio"}</h3>
              <button className={styles.closeBtn} onClick={cerrarModal} aria-label="Cerrar">
                <X size={20} />
              </button>
            </div>

            <div className={styles.modalBody}>
              {esAdmin && !editando && veterinarias.length > 1 && (
                <label className={styles.campo}>
                  <span>Veterinaria</span>
                  <select
                    value={idComercioSeleccionado}
                    onChange={(e) => setIdComercioSeleccionado(e.target.value)}
                  >
                    {veterinarias.map((v) => (
                      <option key={v.idComercio} value={v.idComercio}>{v.nombreComercial}</option>
                    ))}
                  </select>
                </label>
              )}

              <label className={styles.campo}>
                <span>Nombre del servicio</span>
                <input
                  type="text"
                  value={form.nombre}
                  onChange={(e) => handleChange("nombre", e.target.value)}
                  placeholder="Ej: Consulta general"
                  maxLength={150}
                />
              </label>

              <label className={styles.campo}>
                <span>Descripción (opcional)</span>
                <textarea
                  value={form.descripcion}
                  onChange={(e) => handleChange("descripcion", e.target.value)}
                  placeholder="Detalles que verá el cliente en el Marketplace"
                  maxLength={500}
                  rows={3}
                />
              </label>

              <div className={styles.campoFila}>
                <label className={styles.campo}>
                  <span>Tipo de servicio</span>
                  <select
                    value={form.idTipoServicio}
                    onChange={(e) => handleChange("idTipoServicio", e.target.value)}
                  >
                    <option value="">Seleccioná un tipo</option>
                    {tiposServicio.filter((t) => t.activo).map((t) => (
                      <option key={t.idTipoServicio} value={t.idTipoServicio}>{t.nombre}</option>
                    ))}
                  </select>
                </label>

                <label className={styles.campo}>
                  <span>Duración (minutos)</span>
                  <input
                    type="number"
                    min="1"
                    value={form.duracionMinutos}
                    onChange={(e) => handleChange("duracionMinutos", e.target.value)}
                    placeholder="30"
                  />
                </label>
              </div>

              <label className={styles.campo}>
                <span>Veterinario que atiende</span>
                <select
                  value={form.idVeterinario}
                  onChange={(e) => handleChange("idVeterinario", e.target.value)}
                >
                  <option value="">Seleccioná un veterinario</option>
                  {veterinariosComercio.map((v) => (
                    <option key={v.idVeterinario} value={v.idVeterinario}>
                      {v.nombre}{v.especialidad ? ` — ${v.especialidad}` : ""}
                    </option>
                  ))}
                </select>
                {veterinariosComercio.length === 0 && (
                  <span className={styles.descripcionServicio}>
                    Esta veterinaria todavía no tiene veterinarios registrados. Pedile a un administrador que lo vincule.
                  </span>
                )}
              </label>

              <label className={styles.campo}>
                <span>Precio (₡)</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.precio}
                  onChange={(e) => handleChange("precio", e.target.value)}
                  placeholder="0.00"
                />
              </label>

              {editando && (
                <label className={styles.checkboxCampo}>
                  <input
                    type="checkbox"
                    checked={form.activo}
                    onChange={(e) => handleChange("activo", e.target.checked)}
                  />
                  <span>Servicio activo (visible en el Marketplace)</span>
                </label>
              )}

              {errorForm && <p className={styles.errorMsg}>{errorForm}</p>}
            </div>

            <div className={styles.modalFooter}>
              <button className={styles.btnSecundario} onClick={cerrarModal} disabled={guardando}>
                Cancelar
              </button>
              <button className={styles.btnPrimario} onClick={guardarServicio} disabled={guardando}>
                {guardando ? "Guardando..." : editando ? "Guardar cambios" : "Crear servicio"}
              </button>
            </div>
          </div>
        </div>
      )}

      {modalTiposAbierto && (
        <div className={styles.overlay} onClick={() => setModalTiposAbierto(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className={styles.modalHeader}>
              <h3><Tags size={20} style={{ marginRight: '8px', verticalAlign: 'middle' }} /> {esAdmin ? "Tipos de servicio" : "Solicitar tipo de servicio"}</h3>
              <button className={styles.closeBtn} onClick={() => setModalTiposAbierto(false)} aria-label="Cerrar">
                <X size={20} />
              </button>
            </div>

            <div className={styles.modalBody}>
              {esAdmin ? (
                <>
                  {/* ─── ADMIN: crea directo, ya aprobado ─── */}
                  <form onSubmit={handleCrearTipo} style={{ display: 'flex', gap: '10px' }}>
                    <input
                      type="text"
                      placeholder="Nuevo tipo (ej. Odontología)"
                      value={nombreTipoNuevo}
                      onChange={(e) => setNombreTipoNuevo(e.target.value)}
                      style={{ flex: 1, padding: '8px 12px', borderRadius: '6px', border: '1px solid #ced4da' }}
                      required
                    />
                    <button type="submit" className={styles.btnPrimario} style={{ padding: '8px 16px' }} disabled={guardandoTipo}>
                      {guardandoTipo ? "Agregando..." : "Agregar"}
                    </button>
                  </form>

                  {errorTipo && <p className={styles.errorMsg}>{errorTipo}</p>}

                  {solicitudesPendientes.length > 0 && (
                    <>
                      <p className={styles.seccionTitulo}>
                        <Inbox size={13} style={{ verticalAlign: '-2px', marginRight: '4px' }} />
                        Solicitudes pendientes ({solicitudesPendientes.length})
                      </p>
                      <div className={styles.solicitudesLista}>
                        {solicitudesPendientes.map((s) => (
                          <div className={styles.solicitudCard} key={s.idSolicitudTipoServicio}>
                            <div className={styles.solicitudInfo}>
                              <span className={styles.solicitudNombre}>{s.nombre}</span>
                              <span className={styles.solicitudMeta}>
                                {s.nombreSolicitante}{s.nombreComercio ? ` · ${s.nombreComercio}` : ""}
                              </span>
                            </div>
                            <div className={styles.solicitudAcciones}>
                              <button
                                className={styles.btnAprobar}
                                onClick={() => resolverSolicitud(s.idSolicitudTipoServicio, "aprobar")}
                                disabled={procesandoSolicitudId === s.idSolicitudTipoServicio}
                                title="Aprobar"
                                aria-label={`Aprobar solicitud de ${s.nombre}`}
                              >
                                <Check size={16} />
                              </button>
                              <button
                                className={styles.btnRechazar}
                                onClick={() => resolverSolicitud(s.idSolicitudTipoServicio, "rechazar")}
                                disabled={procesandoSolicitudId === s.idSolicitudTipoServicio}
                                title="Rechazar"
                                aria-label={`Rechazar solicitud de ${s.nombre}`}
                              >
                                <X size={16} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  <p className={styles.seccionTitulo}>Catálogo actual</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                    {tiposServicio.map((t) => (
                      <div
                        key={t.idTipoServicio}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '10px 14px',
                          background: '#f8f9fa',
                          borderRadius: '8px',
                          border: '1px solid #e9ecef',
                          opacity: t.activo ? 1 : 0.6
                        }}
                      >
                        <span style={{ fontWeight: 600, color: '#1b4332' }}>{t.nombre}</span>
                        <button
                          onClick={() => handleToggleTipo(t)}
                          style={{
                            background: t.activo ? '#e8f5e9' : '#ffebee',
                            color: t.activo ? '#2e7d32' : '#c62828',
                            border: 'none',
                            padding: '5px 10px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontWeight: 600
                          }}
                        >
                          {t.activo ? <CheckCircle size={14} /> : <XCircle size={14} />}
                          {t.activo ? "Activo" : "Inactivo"}
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  {/* ─── FUNCIONARIO: solicita, queda pendiente de aprobación ─── */}
                  <p className={styles.ayudaModal || styles.descripcionServicio}>
                    ¿Necesitás un tipo de servicio que no está en la lista (ej. Odontología)?
                    Solicitalo y un administrador la va a revisar.
                  </p>

                  <form onSubmit={handleSolicitarTipo} style={{ display: 'flex', gap: '10px' }}>
                    <input
                      type="text"
                      placeholder="Ej: Odontología"
                      value={nombreTipoNuevo}
                      onChange={(e) => setNombreTipoNuevo(e.target.value)}
                      style={{ flex: 1, padding: '8px 12px', borderRadius: '6px', border: '1px solid #ced4da' }}
                      required
                    />
                    <button type="submit" className={styles.btnPrimario} style={{ padding: '8px 16px', display: 'inline-flex', alignItems: 'center', gap: '6px' }} disabled={guardandoTipo || !idComercioSeleccionado}>
                      <Send size={14} />
                      {guardandoTipo ? "Enviando..." : "Solicitar"}
                    </button>
                  </form>

                  {errorTipo && <p className={styles.errorMsg}>{errorTipo}</p>}

                  <p className={styles.seccionTitulo}>Tus solicitudes</p>
                  {misSolicitudes.length === 0 ? (
                    <p className={styles.vacioSolicitudes}>Todavía no enviaste ninguna solicitud.</p>
                  ) : (
                    <div className={styles.solicitudesLista}>
                      {misSolicitudes.map((s) => {
                        const info = ESTADO_SOLICITUD[s.idEstadoSolicitud] || ESTADO_SOLICITUD[1];
                        const IconoEstado = s.idEstadoSolicitud === 2 ? CheckCircle : s.idEstadoSolicitud === 3 ? XCircle : Hourglass;
                        return (
                          <div className={styles.solicitudCard} key={s.idSolicitudTipoServicio}>
                            <div className={styles.solicitudInfo}>
                              <span className={styles.solicitudNombre}>{s.nombre}</span>
                              <span className={styles.solicitudMeta}>
                                {new Date(s.fechaSolicitud).toLocaleDateString("es-CR")}
                              </span>
                            </div>
                            <span className={`${styles.estadoBadge} ${styles[`estadoBadge${info.clase.charAt(0).toUpperCase()}${info.clase.slice(1)}`]}`}>
                              <IconoEstado size={13} />
                              {info.texto}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <p className={styles.seccionTitulo}>Catálogo disponible</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {tiposServicio.filter((t) => t.activo).map((t) => (
                      <span key={t.idTipoServicio} className={styles.tipoBadge}>{t.nombre}</span>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className={styles.modalFooter}>
              <button className={styles.btnSecundario} onClick={() => setModalTiposAbierto(false)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PanelServicios;
