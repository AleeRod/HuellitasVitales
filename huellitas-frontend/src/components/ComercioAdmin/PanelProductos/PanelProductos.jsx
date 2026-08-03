import React, { useState, useEffect } from "react";
import { X, Plus, Pencil, Trash2, Package, Search, DollarSign, Tag, UploadCloud } from "lucide-react";
import styles from "./PanelProductos.module.css";

// ==========================================
// 1. DATOS MOCK (Para pruebas del Frontend)
// ==========================================
const MOCK_CATEGORIAS = [
  { idCategoria: 1, nombre: "Alimentos" },
  { idCategoria: 2, nombre: "Farmacia" },
  { idCategoria: 3, nombre: "Higiene y Belleza" },
  { idCategoria: 4, nombre: "Accesorios" }
];

const MOCK_ESPECIES = [
  { idEspecie: 1, nombre: "Perro" },
  { idEspecie: 2, nombre: "Gato" },
  { idEspecie: 3, nombre: "Aves" }
];

const MOCK_MARCAS = [
  { idMarca: 1, nombre: "Pro Plan" },
  { idMarca: 2, nombre: "NexGard" },
  { idMarca: 3, nombre: "Bravecto" },
  { idMarca: 4, nombre: "Royal Canin" }
];

const PRODUCTOS_INICIALES = [
  { idProducto: 1, nombre: "Alimento Pro Plan Adulto 15kg", sku: "PP-AD-15", idCategoria: 1, idEspecie: 1, idMarca: 1, precio: 35000, precioDescuento: null, stock: 12, activo: true, descripcion: "Alimento premium para perros adultos.", imagenUrl: "" },
  { idProducto: 2, nombre: "Antipulgas NexGard Spectra", sku: "NEX-SP-M", idCategoria: 2, idEspecie: 1, idMarca: 2, precio: 12500, precioDescuento: 11000, stock: 0, activo: true, descripcion: "Tableta masticable para perros.", imagenUrl: "" },
];

const FORM_VACIO = {
  idProducto: null,
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

const PanelProductos = () => {
  // Estados principales
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [especies, setEspecies] = useState([]);
  const [marcas, setMarcas] = useState([]);
  
  // Estados de la UI
  const [cargando, setCargando] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [form, setForm] = useState(FORM_VACIO);
  const [editando, setEditando] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [errorForm, setErrorForm] = useState("");

  // Estados para Drag & Drop de imagen
  const [imagenArchivo, setImagenArchivo] = useState(null);
  const [imagenPreview, setImagenPreview] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  // ==========================================
  // 2. SIMULACIÓN DE LLAMADAS AL BACKEND
  // ==========================================
  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setCargando(true);
    try {
      setTimeout(() => {
        setProductos(PRODUCTOS_INICIALES);
        setCategorias(MOCK_CATEGORIAS);
        setEspecies(MOCK_ESPECIES);
        setMarcas(MOCK_MARCAS);
        setCargando(false);
      }, 500);
    } catch (error) {
      console.error("Error al cargar datos", error);
      setCargando(false);
    }
  };

  // ==========================================
  // 3. LÓGICA DE LA INTERFAZ Y FORMULARIO
  // ==========================================
  const abrirNuevo = () => {
    setForm(FORM_VACIO);
    setImagenArchivo(null);
    setImagenPreview("");
    setEditando(false);
    setErrorForm("");
    setModalAbierto(true);
  };

  const abrirEdicion = (prod) => {
    setForm({
      ...prod,
      sku: prod.sku || "",
      precioDescuento: prod.precioDescuento || "",
      stock: prod.stock === null ? "" : prod.stock,
      idEspecie: prod.idEspecie || "",
      idMarca: prod.idMarca || "",
    });
    
    // Si ya existe una imagen registrada, mostrarla
    setImagenArchivo(null);
    setImagenPreview(prod.imagenUrl || "");
    setEditando(true);
    setErrorForm("");
    setModalAbierto(true);
  };

  // --- Funciones para Drag & Drop de Imagen ---
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) procesarArchivoImagen(files[0]);
  };

  const handleFileSelect = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) procesarArchivoImagen(files[0]);
  };

  const procesarArchivoImagen = (file) => {
    if (file.type.startsWith("image/")) {
      setImagenArchivo(file);
      setImagenPreview(URL.createObjectURL(file));
      setErrorForm("");
    } else {
      setErrorForm("Por favor, selecciona un archivo de imagen válido (JPG, PNG).");
    }
  };

  const removerImagen = (e) => {
    e.stopPropagation();
    setImagenArchivo(null);
    setImagenPreview("");
  };

  const guardarProducto = async (e) => {
    e.preventDefault();
    if (!form.nombre.trim() || form.precio === "" || form.idCategoria === "") {
      setErrorForm("Completá los campos obligatorios: Nombre, Precio y Categoría.");
      return;
    }

    // Preparar objeto
    const payload = {
      ...form,
      idProducto: editando ? form.idProducto : Date.now(), 
      precio: Number(form.precio),
      precioDescuento: form.precioDescuento ? Number(form.precioDescuento) : null,
      stock: form.stock !== "" ? Number(form.stock) : null,
      idCategoria: Number(form.idCategoria),
      idEspecie: form.idEspecie ? Number(form.idEspecie) : null,
      idMarca: form.idMarca ? Number(form.idMarca) : null,
      // En un caso real subirías `imagenArchivo` por FormData al backend aquí
      imagenUrl: imagenPreview 
    };

    if (editando) {
      setProductos(productos.map(p => p.idProducto === payload.idProducto ? payload : p));
    } else {
      setProductos([payload, ...productos]);
    }
    setModalAbierto(false);
  };

  const eliminarProducto = async (id) => {
    if (window.confirm("¿Estás seguro de desactivar este producto del inventario?")) {
      setProductos(productos.map(p => p.idProducto === id ? { ...p, activo: false } : p));
    }
  };

  const productosFiltrados = productos.filter(p => 
    p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    (p.sku && p.sku.toLowerCase().includes(busqueda.toLowerCase()))
  );

  return (
    <div className={styles.panel}>
      <div className={styles.headerRow}>
        <div>
          <span className={styles.badgeGestion}>Gestión de Comercio</span>
          <h2 className={styles.titulo}>Inventario de Productos</h2>
          <p className={styles.subtitulo}>Administrá el stock, catálogo y precios.</p>
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
            placeholder="Buscar por nombre o SKU..." 
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Producto & SKU</th>
              <th>Cat / Esp / Marca</th>
              <th>Precio</th>
              <th>Stock</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr><td colSpan="6" className={styles.emptyState}>Cargando inventario...</td></tr>
            ) : productosFiltrados.length === 0 ? (
              <tr><td colSpan="6" className={styles.emptyState}>No se encontraron productos.</td></tr>
            ) : (
              productosFiltrados.map((p) => {
                const esAgotado = p.stock !== null && p.stock <= 0;
                
                const catNombre = categorias.find(c => c.idCategoria === p.idCategoria)?.nombre || "N/A";
                const espNombre = especies.find(e => e.idEspecie === p.idEspecie)?.nombre || "General";
                const marNombre = marcas.find(m => m.idMarca === p.idMarca)?.nombre || "S/M";

                return (
                  <tr key={p.idProducto} style={{ opacity: p.activo ? 1 : 0.5 }}>
                    <td>
                      <div className={styles.nombreCell}>
                        <span className={styles.nombreProducto}>{p.nombre}</span>
                        {p.sku && <span className={styles.descProducto}>SKU: {p.sku}</span>}
                      </div>
                    </td>
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
              {/* FILA 1 */}
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

              {/* FILA 2: Catálogos */}
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

              {/* FILA 3: Precios y Stock */}
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

              {/* FILA 4: Descripción */}
              <label className={styles.campo}>
                <span>Descripción</span>
                <textarea value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} rows={2} />
              </label>

              {/* ZONA DRAG & DROP DE IMAGEN */}
              <div className={styles.campo}>
                <span>Imagen del producto</span>
                <div 
                  className={`${styles.dropzone} ${isDragging ? styles.dropzoneActive : ""}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById('imagenUpload').click()}
                >
                  <input 
                    type="file" 
                    id="imagenUpload" 
                    accept="image/*" 
                    hidden 
                    onChange={handleFileSelect} 
                  />
                  
                  {imagenPreview ? (
                    <div className={styles.previewContainer}>
                      <img src={imagenPreview} alt="Vista previa" className={styles.previewImg} />
                      <button type="button" className={styles.btnQuitarImagen} onClick={removerImagen}>
                        <X size={14} /> Quitar imagen
                      </button>
                    </div>
                  ) : (
                    <div className={styles.dropzoneText}>
                      <UploadCloud size={32} color="#52B788" />
                      <p>Arrastrá la imagen aquí o <strong>hacé clic para examinar</strong></p>
                      <small>Soporta JPG, PNG, WEBP</small>
                    </div>
                  )}
                </div>
              </div>

              {errorForm && <p className={styles.errorMsg}>{errorForm}</p>}

              <div className={styles.modalFooter}>
                <button type="button" className={styles.btnSecundario} onClick={() => setModalAbierto(false)}>Cancelar</button>
                <button type="submit" className={styles.btnPrimario}>{editando ? "Guardar cambios" : "Crear producto"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PanelProductos;