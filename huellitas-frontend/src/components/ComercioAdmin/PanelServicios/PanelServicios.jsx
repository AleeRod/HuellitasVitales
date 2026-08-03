import React, { useEffect, useState } from "react";
import { X, Plus, Pencil, Trash2, Clock, DollarSign, Stethoscope, Scissors, Syringe } from "lucide-react";
import { API_BASE } from "../../../api/config";
import styles from "./PanelServicios.module.css";

// Catálogo de tipos de servicio (coincide con TIPO_SERVICIO_CAT)
const TIPOS_SERVICIO = [
  { id: 1, nombre: "Consulta", icon: Stethoscope },
  { id: 2, nombre: "Grooming", icon: Scissors },
  { id: 3, nombre: "Procedimiento", icon: Syringe },
];

const FORM_VACIO = {
  idServicio: null,
  nombre: "",
  descripcion: "",
  duracionMinutos: "",
  precio: "",
  idTipoServicio: 1,
  activo: true,
};

const ESTADO = {
  CARGANDO: "cargando",
  OK: "ok",
  VACIO: "vacio",
  ERROR: "error",
};

const PanelServicios = () => {
  const [servicios, setServicios] = useState([]);
  const [estado, setEstado] = useState(ESTADO.CARGANDO);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [form, setForm] = useState(FORM_VACIO);
  const [editando, setEditando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [errorForm, setErrorForm] = useState("");

  useEffect(() => {
    cargarServicios();
  }, []);

  const cargarServicios = async () => {
    setEstado(ESTADO.CARGANDO);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/comercio/servicios`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("No se pudo cargar la lista de servicios");
      const data = await res.json();
      setServicios(data);
      setEstado(data.length === 0 ? ESTADO.VACIO : ESTADO.OK);
    } catch (err) {
      console.error(err);
      setEstado(ESTADO.ERROR);
    }
  };

  const abrirNuevo = () => {
    setForm(FORM_VACIO);
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
    if (!form.duracionMinutos || Number(form.duracionMinutos) <= 0)
      return "La duración debe ser mayor a 0 minutos.";
    if (form.precio === "" || Number(form.precio) < 0)
      return "Ingresá un precio válido.";
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
      const token = localStorage.getItem("huellitas_token");
      const payload = {
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim() || null,
        duracionMinutos: Number(form.duracionMinutos),
        precio: Number(form.precio),
        idTipoServicio: Number(form.idTipoServicio),
        activo: form.activo,
      };

      const url = editando
        ? `${API_BASE}/api/comercio/servicios/${form.idServicio}`
        : `${API_BASE}/api/comercio/servicios`;
      const method = editando ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("No se pudo guardar el servicio");

      cerrarModal();
      cargarServicios();
    } catch (err) {
      console.error(err);
      setErrorForm("Ocurrió un error al guardar. Intentá de nuevo.");
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
      const token = localStorage.getItem("huellitas_token");
      const res = await fetch(`${API_BASE}/api/comercio/servicios/${servicio.idServicio}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("No se pudo desactivar el servicio");
      cargarServicios();
    } catch (err) {
      console.error(err);
      alert("No se pudo desactivar el servicio. Intentá de nuevo.");
    }
  };

  const tipoInfo = (idTipo) => TIPOS_SERVICIO.find((t) => t.id === idTipo) || TIPOS_SERVICIO[0];

  return (
    <div className={styles.panel}>
      <div className={styles.headerRow}>
        <div>
          <h2 className={styles.titulo}>Servicios</h2>
          <p className={styles.subtitulo}>Gestioná las consultas, groomings y procedimientos que ofrecés.</p>
        </div>
        <button className={styles.btnNuevo} onClick={abrirNuevo}>
          <Plus size={18} />
          Nuevo servicio
        </button>
      </div>

      {estado === ESTADO.CARGANDO && (
        <div className={styles.estadoBox}>Cargando servicios...</div>
      )}

      {estado === ESTADO.ERROR && (
        <div className={styles.estadoBox}>
          No pudimos cargar tus servicios. <button onClick={cargarServicios} className={styles.linkBtn}>Reintentar</button>
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
                <th>Duración</th>
                <th>Precio</th>
                <th>Estado</th>
                <th aria-label="Acciones"></th>
              </tr>
            </thead>
            <tbody>
              {servicios.map((s) => {
                const tipo = tipoInfo(s.idTipoServicio);
                const TipoIcon = tipo.icon;
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
                        {tipo.nombre}
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
                        <button
                          className={styles.iconBtnDanger}
                          onClick={() => desactivarServicio(s)}
                          aria-label={`Desactivar ${s.nombre}`}
                        >
                          <Trash2 size={16} />
                        </button>
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
                    {TIPOS_SERVICIO.map((t) => (
                      <option key={t.id} value={t.id}>{t.nombre}</option>
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
    </div>
  );
};

export default PanelServicios;