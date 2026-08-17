import React, { useState, useEffect } from "react";
import { X, Plus, Pencil, Trash2, Package, Search, DollarSign, Tag, UploadCloud, Store, ImageOff } from "lucide-react";
import styles from "./PanelProductos.module.css";
import { resolverImagen } from "../../../api/config";

const API_URL = "http://localhost:5010/api/Producto"; 

const FORM_VACIO = {
  idProducto: null,
  idComercio: "",
  nombre: "",
  sku: "",
  descripcion: "",
  precio: "",
  precioDescuento: "",
  stock: "",
  idCategoria: "",
  idEspecie: "",
  idMarca: "",
  activo: true,
};

const PanelProductos = ({ esAdmin = true }) => {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [especies, setEspecies] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [almacenes, setAlmacenes] = useState([]);
  const [idComercioAutenticado, setIdComercioAutenticado] = useState(null);
  
  const [cargando, setCargando] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [form, setForm] = useState(FORM_VACIO);
  const [editando, setEditando] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [errorForm, setErrorForm] = useState("");

  const [imagenArchivo, setImagenArchivo] = useState(null);
  const [imagenPreview, setImagenPreview] = useState("");
  const [imagenUrlOriginal, setImagenUrlOriginal] = useState(""); // ruta relativa tal cual viene de la BD
  const [isDragging, setIsDragging] = useState(false);
  const [subiendoImagen, setSubiendoImagen] = useState(false);

  const getHeaders = () => {
    const token = localStorage.getItem("token_huellitas");
    return {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    };
  };

  useEffect(() => {
    const inicializar = async () => {
      try {
        const peticiones = [
          fetch(`${API_URL}/categorias`, { headers: getHeaders() }),
          fetch(`${API_URL}/especies`, { headers: getHeaders() }),
          fetch(`${API_URL}/marcas`, { headers: getHeaders() })
        ];

        if (esAdmin) {
          peticiones.push(fetch(`${API_URL}/todos-global`, { headers: getHeaders() }));
          peticiones.push(fetch(`${API_URL}/almacenes-lista`, { headers: getHeaders() }));
        } else {
          peticiones.push(fetch(`${API_URL}/mi-almacen`, { headers: getHeaders() }));
        }

        const respuestas = await Promise.all(peticiones);
        const dataCat = await respuestas[0].json();
        const dataEsp = await respuestas[1].json();
        const dataMar = await respuestas[2].json();

        if (dataCat.success) setCategorias(dataCat.categorias);
        if (dataEsp.success) setEspecies(dataEsp.especies);
        if (dataMar.success) setMarcas(dataMar.marcas);

        if (esAdmin) {
          const dataGlobal = await respuestas[3].json();
          const dataAlmacenes = await respuestas[4].json();

          if (dataGlobal.success) setProductos(dataGlobal.productos);
          if (dataAlmacenes.success) setAlmacenes(dataAlmacenes.almacenes);
        } else {
          const dataAlmacen = await respuestas[3].json();
          if (dataAlmacen.success) {
            setIdComercioAutenticado(dataAlmacen.idComercio);
            const resProd = await fetch(`${API_URL}/comercio/${dataAlmacen.idComercio}`, { headers: getHeaders() });
            const dataProd = await resProd.json();
            if (dataProd.success) setProductos(dataProd.productos);
          }
        }
      } catch (error) {
        console.error("Error al cargar inventario global:", error);
      } finally {
        setCargando(false);
      }
    };

    inicializar();
  }, [esAdmin]);

  const abrirNuevo = () => {
    setForm({
      ...FORM_VACIO,
      idComercio: esAdmin ? (almacenes[0]?.idComercio || "") : idComercioAutenticado
    });
    setImagenArchivo(null);
    setImagenPreview("");
    setImagenUrlOriginal("");
    setEditando(false);
    setErrorForm("");
    setModalAbierto(true);
  };

  const abrirEdicion = (prod) => {
    setForm({
      ...prod,
      idComercio: prod.idComercio,
      sku: prod.sku || "",
      precioDescuento: prod.precioDescuento || "",
      stock: prod.stock === null ? "" : prod.stock,
      idEspecie: prod.idEspecie || "",
      idMarca: prod.idMarca || "",
    });
    
    setImagenArchivo(null);
    setImagenPreview(prod.imagenUrl ? resolverImagen(prod.imagenUrl) : "");
    setImagenUrlOriginal(prod.imagenUrl || "");
    setEditando(true);
    setErrorForm("");
    setModalAbierto(true);
  };

  const recargarProductos = async () => {
    const url = esAdmin ? `${API_URL}/todos-global` : `${API_URL}/comercio/${idComercioAutenticado}`;
    const res = await fetch(url, { headers: getHeaders() });
    const data = await res.json();
    if (data.success) setProductos(data.productos);
  };

  // ==========================================
  // MANEJO DE IMAGEN (dropzone)
  // ==========================================
  const procesarArchivo = (file) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorForm("El archivo debe ser una imagen (PNG, JPG, WEBP).");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorForm("La imagen no puede superar los 5MB.");
      return;
    }

    setErrorForm("");
    setImagenArchivo(file);
    setImagenPreview(URL.createObjectURL(file));
  };

  const handleInputChange = (e) => {
    procesarArchivo(e.target.files[0]);
    e.target.value = "";
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    procesarArchivo(e.dataTransfer.files[0]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const quitarImagen = (e) => {
    e.stopPropagation();
    setImagenArchivo(null);
    setImagenPreview("");
    setImagenUrlOriginal("");
  };

  const guardarProducto = async (e) => {
    e.preventDefault();
    const comercioDestino = esAdmin ? Number(form.idComercio) : idComercioAutenticado;

    if (!comercioDestino || !form.nombre.trim() || form.precio === "" || form.idCategoria === "") {
      setErrorForm("Completá los campos obligatorios: Comercio, Nombre, Precio y Categoría.");
      return;
    }

    let urlImagenFinal = imagenUrlOriginal; // ruta relativa (o "" si no había/se quitó)

    try {
      if (imagenArchivo) {
        setSubiendoImagen(true);
        const formData = new FormData();
        formData.append("imagen", imagenArchivo);

        const resImg = await fetch(`${API_URL}/subir-imagen`, {
          method: "POST",
          headers: { "Authorization": getHeaders().Authorization }, 
          body: formData
        });
        
        const dataImg = await resImg.json();
        setSubiendoImagen(false);

        if (dataImg.success) {
          urlImagenFinal = dataImg.url; // ya viene relativa desde el backend, ej: /uploads/productos/xxx.png
        } else {
          setErrorForm(dataImg.mensaje || "Error al subir la imagen.");
          return;
        }
      }

      const payload = {
        idComercio: comercioDestino,
        nombre: form.nombre,
        sku: form.sku || null,
        descripcion: form.descripcion || null,
        precio: Number(form.precio),
        precioDescuento: form.precioDescuento ? Number(form.precioDescuento) : null,
        stock: form.stock !== "" ? Number(form.stock) : null,
        idCategoria: Number(form.idCategoria),
        idEspecie: form.idEspecie ? Number(form.idEspecie) : null,
        idMarca: form.idMarca ? Number(form.idMarca) : null,
        imagenUrl: urlImagenFinal 
      };

      const url = editando ? `${API_URL}/${form.idProducto}` : API_URL;
      const method = editando ? "PUT" : "POST";

      const res = await fetch(url, {
        method: method,
        headers: getHeaders(),
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setModalAbierto(false);
        recargarProductos();
      } else {
        setErrorForm(data.mensaje || "Error al guardar el producto.");
      }
    } catch (error) {
      setSubiendoImagen(false);
      setErrorForm("Error de conexión con el servidor.");
    }
  };

  const eliminarProducto = async (id) => {
    if (window.confirm("¿Estás seguro de desactivar este producto del inventario?")) {
      try {
        const res = await fetch(`${API_URL}/${id}`, {
          method: "DELETE",
          headers: getHeaders()
        });
        const data = await res.json();

        if (res.ok && data.success) {
          recargarProductos();
        } else {
          alert(data.mensaje || "Error al eliminar producto.");
        }
      } catch (error) {
        alert("Error de conexión con el servidor.");
      }
    }
  };

  const productosFiltrados = productos.filter(p => 
    p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    (p.sku && p.sku.toLowerCase().includes(busqueda.toLowerCase())) ||
    (p.nombreComercio && p.nombreComercio.toLowerCase().includes(busqueda.toLowerCase()))
  );

  return (
    <div className={styles.panel}>
      <div className={styles.headerRow}>
        <div>
          <span className={styles.badgeGestion}>
            {esAdmin ? "Administración Global" : "Gestión de Comercio"}
          </span>
          <h2 className={styles.titulo}>Inventario de Productos</h2>
          <p className={styles.subtitulo}>
            {esAdmin ? "Visualizá y gestioná el inventario completo de todos los almacenes." : "Administrá el stock, catálogo y precios."}
          </p>
        </div>
        <button className={styles.btnNuevo} onClick={abrirNuevo}>
          <Plus size={18} /> Nuevo producto
        </button>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.searchField}>
          <Search size={16} />
          <input 
            type="text" 
            placeholder="Buscar por nombre, SKU o comercio..." 
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Imagen</th>
              <th>Producto & SKU</th>
              {esAdmin && <th>Comercio</th>}
              <th>Cat / Esp / Marca</th>
              <th>Precio</th>
              <th>Stock</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr><td colSpan={esAdmin ? "8" : "7"} className={styles.emptyState}>Cargando inventario global...</td></tr>
            ) : productosFiltrados.length === 0 ? (
              <tr><td colSpan={esAdmin ? "8" : "7"} className={styles.emptyState}>No se encontraron productos registrados.</td></tr>
            ) : (
              productosFiltrados.map((p) => {
                const esAgotado = p.stock !== null && p.stock <= 0;
                const catNombre = categorias.find(c => c.idCategoria === p.idCategoria)?.nombre || "N/A";
                const espNombre = especies.find(e => e.idEspecie === p.idEspecie)?.nombre || "General";
                const marNombre = marcas.find(m => m.idMarca === p.idMarca)?.nombre || "S/M";

                return (
                  <tr key={p.idProducto} style={{ opacity: p.activo ? 1 : 0.5 }}>
                    <td>
                      {p.imagenUrl ? (
                        <img
                          src={resolverImagen(p.imagenUrl)}
                          alt={p.nombre}
                          className={styles.thumbImg}
                        />
                      ) : (
                        <div className={styles.thumbPlaceholder}>
                          <ImageOff size={16} />
                        </div>
                      )}
                    </td>
                    <td>
                      <div className={styles.nombreCell}>
                        <span className={styles.nombreProducto}>{p.nombre}</span>
                        {p.sku && <span className={styles.descProducto}>SKU: {p.sku}</span>}
                      </div>
                    </td>
                    {esAdmin && (
                      <td>
                        <div className={styles.descProducto} style={{ fontWeight: 600, color: "#2d3748" }}>
                          <Store size={12} style={{ marginRight: 4, display: "inline" }} />
                          {p.nombreComercio || `Comercio #${p.idComercio}`}
                        </div>
                      </td>
                    )}
                    <td>
                      <div className={styles.descProducto}>
                        <div><Tag size={10}/> {catNombre}</div>
                        {p.idEspecie && <div>Esp: {espNombre}</div>}
                        {p.idMarca && <div>Mar: {marNombre}</div>}
                      </div>
                    </td>
                    <td>
                      <div className={styles.precioCell}>
                        <DollarSign size={14} /> 
                        {p.precioDescuento ? (
                           <span>
                             <del style={{ color: '#dc3545', fontSize: '0.8em', marginRight: '5px' }}>{p.precio}</del>
                             {p.precioDescuento}
                           </span>
                        ) : p.precio}
                      </div>
                    </td>
                    <td>
                      <span className={esAgotado ? styles.stockAgotado : styles.stockNormal}>
                        <Package size={14} /> {p.stock === null ? "S/D" : esAgotado ? "Agotado" : `${p.stock} disp.`}
                      </span>
                    </td>
                    <td>
                      <span className={p.activo && !esAgotado ? styles.estadoOk : styles.estadoOff}>
                        {p.activo && !esAgotado ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td>
                      <div className={styles.acciones}>
                        <button className={styles.iconBtn} onClick={() => abrirEdicion(p)}><Pencil size={16} /></button>
                        <button className={styles.iconBtnDanger} onClick={() => eliminarProducto(p.idProducto)}><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {modalAbierto && (
        <div className={styles.overlay} onMouseDown={() => setModalAbierto(false)}>
          <div className={styles.modal} onMouseDown={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>{editando ? "Editar producto" : "Registrar nuevo producto"}</h3>
              <button className={styles.closeBtn} onClick={() => setModalAbierto(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={guardarProducto} className={styles.modalBody}>
              {esAdmin && (
                <label className={styles.campo}>
                  <span>Almacén de destino *</span>
                  <select 
                    value={form.idComercio} 
                    onChange={(e) => setForm({ ...form, idComercio: e.target.value })} 
                    disabled={editando}
                    required
                  >
                    <option value="">Seleccione el almacén...</option>
                    {almacenes.map(a => (
                      <option key={a.idComercio} value={a.idComercio}>{a.nombreComercial}</option>
                    ))}
                  </select>
                </label>
              )}

              <div className={styles.campoFila}>
                <label className={styles.campo} style={{ gridColumn: "span 2" }}>
                  <span>Nombre del producto *</span>
                  <input type="text" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required />
                </label>
                <label className={styles.campo}>
                  <span>SKU (Opcional)</span>
                  <input type="text" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} placeholder="Ej: PROD-001" />
                </label>
              </div>

              <div className={styles.campoFila3}>
                <label className={styles.campo}>
                  <span>Categoría *</span>
                  <select value={form.idCategoria} onChange={(e) => setForm({ ...form, idCategoria: e.target.value })} required>
                    <option value="">Seleccione...</option>
                    {categorias.map(c => <option key={c.idCategoria} value={c.idCategoria}>{c.nombre}</option>)}
                  </select>
                </label>
                <label className={styles.campo}>
                  <span>Especie (Opcional)</span>
                  <select value={form.idEspecie} onChange={(e) => setForm({ ...form, idEspecie: e.target.value })}>
                    <option value="">Todas / N/A</option>
                    {especies.map(e => <option key={e.idEspecie} value={e.idEspecie}>{e.nombre}</option>)}
                  </select>
                </label>
                <label className={styles.campo}>
                  <span>Marca (Opcional)</span>
                  <select value={form.idMarca} onChange={(e) => setForm({ ...form, idMarca: e.target.value })}>
                    <option value="">Genérico / N/A</option>
                    {marcas.map(m => <option key={m.idMarca} value={m.idMarca}>{m.nombre}</option>)}
                  </select>
                </label>
              </div>

              <div className={styles.campoFila3}>
                <label className={styles.campo}>
                  <span>Precio Base *</span>
                  <input type="number" step="0.01" value={form.precio} onChange={(e) => setForm({ ...form, precio: e.target.value })} required />
                </label>
                <label className={styles.campo}>
                  <span>Precio Descuento</span>
                  <input type="number" step="0.01" value={form.precioDescuento} onChange={(e) => setForm({ ...form, precioDescuento: e.target.value })} placeholder="Si aplica" />
                </label>
                <label className={styles.campo}>
                  <span>Stock actual</span>
                  <input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} placeholder="Ilimitado si está vacío" />
                </label>
              </div>

              <label className={styles.campo}>
                <span>Descripción</span>
                <textarea value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} rows={2} />
              </label>

              {/* ========================================== */}
              {/* IMAGEN DEL PRODUCTO (Dropzone)              */}
              {/* ========================================== */}
              <label className={styles.campo}>
                <span>Imagen del producto</span>
                <div
                  className={`${styles.dropzone} ${isDragging ? styles.dropzoneActive : ""}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById("inputImagenProducto").click()}
                >
                  <input
                    id="inputImagenProducto"
                    type="file"
                    accept="image/*"
                    onChange={handleInputChange}
                    hidden
                  />

                  {imagenPreview ? (
                    <div className={styles.previewContainer}>
                      <img src={imagenPreview} alt="Vista previa del producto" className={styles.previewImg} />
                      <button
                        type="button"
                        className={styles.btnQuitarImagen}
                        onClick={quitarImagen}
                      >
                        <X size={13} /> Quitar imagen
                      </button>
                    </div>
                  ) : (
                    <div className={styles.dropzoneText}>
                      <UploadCloud size={26} />
                      <p><strong>Hacé clic</strong> o arrastrá una imagen aquí</p>
                      <small>PNG, JPG o WEBP — hasta 5MB</small>
                    </div>
                  )}
                </div>
              </label>

              {errorForm && <p className={styles.errorMsg}>{errorForm}</p>}

              <div className={styles.modalFooter}>
                <button type="button" className={styles.btnSecundario} onClick={() => setModalAbierto(false)}>Cancelar</button>
                <button type="submit" className={styles.btnPrimario} disabled={subiendoImagen}>
                  {subiendoImagen ? "Subiendo imagen..." : editando ? "Guardar cambios" : "Crear producto"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PanelProductos;