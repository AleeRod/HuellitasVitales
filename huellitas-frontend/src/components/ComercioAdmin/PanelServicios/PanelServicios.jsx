import React, { useEffect, useState } from "react";
import { X, Plus, Pencil, Trash2, Clock, DollarSign, Stethoscope, Scissors, Syringe, Tags, CheckCircle, XCircle } from "lucide-react";
import { API_BASE } from "../../../api/config";
import styles from "./PanelServicios.module.css";

const TIPOS_SERVICIO_INICIALES = [
  { id: 1, nombre: "Consulta", icon: Stethoscope, activo: true },
  { id: 2, nombre: "Grooming", icon: Scissors, activo: true },
  { id: 3, nombre: "Procedimiento", icon: Syringe, activo: true },
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
  
  const [modalTiposAbierto, setModalTiposAbierto] = useState(false);
  const [tiposServicio, setTiposServicio] = useState(TIPOS_SERVICIO_INICIALES);
  const [nombreTipoNuevo, setNombreTipoNuevo] = useState("");

  const [form, setForm] = useState(FORM_VACIO);
  const [editando, setEditando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [errorForm, setErrorForm] = useState("");

  const [user, setUser] = useState(null);

  useEffect(() => {
    // Lectura correcta según las llaves que se ven en tu local_storage
    const usuarioGuardado = localStorage.getItem("usuario_huellitas") || localStorage.getItem("usuario") || localStorage.getItem("user");
    if (usuarioGuardado) {
      try {
        setUser(JSON.parse(usuarioGuardado));
      } catch (e) {
        console.error("Error al parsear el usuario:", e);
      }
    }
    
    cargarServicios();
  }, []);

  // Función robusta para obtener el token correcto sin importar cómo se guardó
  const obtenerToken = () => {
    return (
      localStorage.getItem("token_huellitas") ||
      localStorage.getItem("token") ||
      localStorage.getItem("huellitas_token") ||
      localStorage.getItem("jwt") ||
      ""
    );
  };

  const cargarServicios = async () => {
    setEstado(ESTADO.CARGANDO);
    try {
      const token = obtenerToken();
      
      // Se quita /api extra si API_BASE ya lo trae, o se ajusta de forma limpia
      const baseClean = API_BASE.endsWith('/api') ? API_BASE.slice(0, -4) : API_BASE;
      const res = await fetch(`${baseClean}/api/comercio/servicios`, {
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
      const token = obtenerToken();
      const payload = {
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim() || null,
        duracionMinutos: Number(form.duracionMinutos),
        precio: Number(form.precio),
        idTipoServicio: Number(form.idTipoServicio),
        activo: form.activo,
      };

      const baseClean = API_BASE.endsWith('/api') ? API_BASE.slice(0, -4) : API_BASE;
      const url = editando
        ? `${baseClean}/api/comercio/servicios/${form.idServicio}`
        : `${baseClean}/api/comercio/servicios`;
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
      const token = obtenerToken();
      const baseClean = API_BASE.endsWith('/api') ? API_BASE.slice(0, -4) : API_BASE;
      const res = await fetch(`${baseClean}/api/comercio/servicios/${servicio.idServicio}`, {
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

  const handleCrearTipo = (e) => {
    e.preventDefault();
    const nombre = nombreTipoNuevo.trim();
    if (!nombre) return;
    if (tiposServicio.some((t) => t.nombre.toLowerCase() === nombre.toLowerCase())) {
      alert("Ese tipo de servicio ya existe");
      return;
    }
    const nuevoId = tiposServicio.length ? Math.max(...tiposServicio.map((t) => t.id)) + 1 : 1;
    setTiposServicio([...tiposServicio, { id: nuevoId, nombre, icon: Stethoscope, activo: true }]);
    setNombreTipoNuevo("");
  };

  const handleToggleTipo = (id) => {
    setTiposServicio(
      tiposServicio.map((t) => (t.id === id ? { ...t, activo: !t.activo } : t))
    );
  };

  const tipoInfo = (idTipo) => tiposServicio.find((t) => t.id === idTipo) || tiposServicio[0];

  // Verificación flexible del rol de administrador (soporta idRol === 1 o texto Administrador/Admin)
  const esAdmin = 
    Number(user?.idRol) === 1 || 
    user?.rol === "Administrador" || 
    user?.rol === "Admin" || 
    user?.rol?.nombre === "Administrador";

  return (
    <div className={styles.panel}>
      <div className={styles.headerRow}>
        <div>
          <h2 className={styles.titulo}>Servicios</h2>
          <p className={styles.subtitulo}>Gestioná las consultas, groomings y procedimientos que ofrecés.</p>
        </div>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          {/* El botón se muestra si es Admin por ID o por texto */}
          {esAdmin && (
            <button 
              className={styles.btnSecundario || styles.btnNuevo} 
              onClick={() => setModalTiposAbierto(true)}
              style={{ backgroundColor: '#e9ecef', color: '#1b4332', border: '1px solid #ced4da' }}
            >
              <Tags size={18} />
              Tipos de servicio
            </button>
          )}
          
          <button className={styles.btnNuevo} onClick={abrirNuevo}>
            <Plus size={18} />
            Nuevo servicio
          </button>
        </div>
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
                const TipoIcon = tipo.icon || Stethoscope;
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
                    {tiposServicio.filter(t => t.activo).map((t) => (
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

      {modalTiposAbierto && (
        <div className={styles.overlay} onClick={() => setModalTiposAbierto(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className={styles.modalHeader}>
              <h3><Tags size={20} style={{ marginRight: '8px', verticalAlign: 'middle' }} /> Administrar Tipos de Servicio</h3>
              <button className={styles.closeBtn} onClick={() => setModalTiposAbierto(false)} aria-label="Cerrar">
                <X size={20} />
              </button>
            </div>

            <div className={styles.modalBody}>
              <form onSubmit={handleCrearTipo} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <input
                  type="text"
                  placeholder="Nuevo tipo (ej. Odontología)"
                  value={nombreTipoNuevo}
                  onChange={(e) => setNombreTipoNuevo(e.target.value)}
                  style={{ flex: 1, padding: '8px 12px', borderRadius: '6px', border: '1px solid #ced4da' }}
                  required
                />
                <button type="submit" className={styles.btnPrimario} style={{ padding: '8px 16px' }}>Agregar</button>
              </form>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '250px', overflowY: 'auto' }}>
                {tiposServicio.map((t) => (
                  <div 
                    key={t.id} 
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
                      onClick={() => handleToggleTipo(t.id)}
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