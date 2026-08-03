import React, { useEffect, useRef, useState } from 'react';
import DogNav from '../../components/DogNav/DogNav';
import { useDebounce } from '../../hooks/useDebounce';
import { API_BASE } from '../../api/config';
import { 
    Search, ShoppingCart, Package, Stethoscope, 
    AlertCircle, Loader2, CalendarPlus, XCircle, LayoutGrid,
    ChevronLeft, ChevronRight, DollarSign, Tag
} from 'lucide-react';
import styles from './Marketplace.module.css';

const ESTADO = {
    INACTIVO: 'inactivo',
    CARGANDO: 'cargando',
    OK: 'ok',
    VACIO: 'vacio',
    ERROR: 'error'
};

const CategoriaCarrusel = ({ categoriaItem, agregarAlCarrito }) => {
    const carruselRef = useRef(null);

    const scroll = (direction) => {
        if (carruselRef.current) {
            const scrollAmount = direction === 'left' ? -320 : 320;
            carruselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    if (!categoriaItem.productos || categoriaItem.productos.length === 0) return null;

    return (
        <div className={styles.seccion}>
            <div className={styles.seccionHeader}>
                <Package className={styles.seccionIcon} size={22} />
                <h2 className={styles.seccionTitulo}>{categoriaItem.nombreCategoria}</h2>
            </div>

            <div className={styles.carouselWrapper}>
                {categoriaItem.productos.length > 2 && (
                    <button 
                        className={`${styles.navArrow} ${styles.arrowLeft}`} 
                        onClick={() => scroll('left')}
                        aria-label="Anterior"
                    >
                        <ChevronLeft size={20} />
                    </button>
                )}

                <ul ref={carruselRef} className={styles.gridCarousel}>
                    {categoriaItem.productos.map((prod) => (
                        <li key={prod.idProducto} className={styles.card}>
                            {prod.imagenUrl ? (
                                <img src={prod.imagenUrl} alt={prod.nombreProducto} className={styles.cardImg} loading="lazy" />
                            ) : (
                                <div className={styles.cardImgPlaceholder}>
                                    <Package size={36} />
                                </div>
                            )}
                            <div className={styles.cardBody}>
                                <h3 className={styles.cardTitle}>{prod.nombreProducto}</h3>
                                <span className={styles.cardTag}>{prod.nombreMarca || prod.nombreComercio}</span>
                                <div className={styles.cardFooter}>
                                    <p className={styles.cardPrecio}>₡{prod.precioDescuento ?? prod.precio}</p>
                                    {prod.agotado ? (
                                        <span className={styles.agotado}>Agotado</span>
                                    ) : (
                                        <button
                                            className={styles.addBtn}
                                            onClick={() => agregarAlCarrito(prod.idProducto)}
                                            title="Agregar al carrito"
                                        >
                                            <ShoppingCart size={16} />
                                            <span>Agregar</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>

                {categoriaItem.productos.length > 2 && (
                    <button 
                        className={`${styles.navArrow} ${styles.arrowRight}`} 
                        onClick={() => scroll('right')}
                        aria-label="Siguiente"
                    >
                        <ChevronRight size={20} />
                    </button>
                )}
            </div>
        </div>
    );
};

const Marketplace = () => {
    const [termino, setTermino] = useState('');
    const [filtroActivo, setFiltroActivo] = useState('todos');
    
    const [filtrosAvanzados, setFiltrosAvanzados] = useState({
        precioMin: '',
        precioMax: '',
        categoriasIds: [],
        marcasIds: []
    });
    
    const [productosBusqueda, setProductosBusqueda] = useState([]);
    const [serviciosBusqueda, setServiciosBusqueda] = useState([]);
    const [catalogoPorCategoria, setCatalogoPorCategoria] = useState([]);
    
    const [estado, setEstado] = useState(ESTADO.CARGANDO);
    const [reintento, setReintento] = useState(0);

    const terminoDebounced = useDebounce(termino, 400);
    const abortRef = useRef(null);

    useEffect(() => {
        const q = terminoDebounced.trim();

        if (abortRef.current) abortRef.current.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        const cargarDatosHibridos = async () => {
            setEstado(ESTADO.CARGANDO);
            try {
                if (q === '') {
                    try {
                        const res = await fetch(`${API_BASE}/marketplace/catalogo`, { signal: controller.signal });
                        if (res.ok) {
                            const data = await res.json();
                            const categorias = data.categorias || data || [];
                            const servicios = data.servicios || [];
                            setCatalogoPorCategoria(categorias);
                            setProductosBusqueda(categorias.flatMap(c => c.productos || []));
                            setServiciosBusqueda(servicios);
                            const total = categorias.flatMap(c => c.productos || []).length + servicios.length;
                            setEstado(total === 0 ? ESTADO.VACIO : ESTADO.OK);
                            return;
                        }
                    } catch {
                        // Fallback temporal si el backend aún da 404
                    }

                    // MOCK DE RESPALDO TEMPORAL
                    const mockCategorias = [
                        {
                            idCategoriaProducto: 1,
                            nombreCategoria: "Alimentos y Nutrición",
                            productos: [
                                { idProducto: 101, nombreProducto: "Croquetas Pro Plan Adulto 15kg", idComercio: 1, nombreComercio: "Veterinaria San Rafael", idCategoriaProducto: 1, idMarca: 1, nombreMarca: "ProPlan", precio: 25000, precioDescuento: null, imagenUrl: null, agotado: false },
                                { idProducto: 102, nombreProducto: "Snacks Dentales Higiene Oral", idComercio: 2, nombreComercio: "PetShop San José", idCategoriaProducto: 1, idMarca: 2, nombreMarca: "Pedigree", precio: 4200, precioDescuento: null, imagenUrl: null, agotado: false }
                            ]
                        },
                        {
                            idCategoriaProducto: 2,
                            nombreCategoria: "Accesorios y Camas",
                            productos: [
                                { idProducto: 103, nombreProducto: "Cama Ortopédica Impermeable", idComercio: 2, nombreComercio: "PetShop San José", idCategoriaProducto: 2, idMarca: 3, nombreMarca: "Kong", precio: 25000, precioDescuento: null, imagenUrl: null, agotado: true }
                            ]
                        }
                    ];
                    const mockServicios = [
                        { idServicio: 201, nombreServicio: "Consulta Médica General", idTipoServicio: 1, tipoServicio: "Medicina Preventiva", idComercio: 1, nombreComercio: "Veterinaria Huellitas", precio: 15000, duracionMinutos: 30 },
                        { idServicio: 202, nombreServicio: "Baño y Peluquería Canina", idTipoServicio: 2, tipoServicio: "Estética", idComercio: 2, nombreComercio: "PetShop San José", precio: 12000, duracionMinutos: 45 }
                    ];

                    setCatalogoPorCategoria(mockCategorias);
                    setProductosBusqueda(mockCategorias.flatMap(c => c.productos));
                    setServiciosBusqueda(mockServicios);
                    setEstado(ESTADO.OK);

                } else {
                    try {
                        const res = await fetch(`${API_BASE}/marketplace/buscar?q=${encodeURIComponent(q)}`, { signal: controller.signal });
                        if (res.ok) {
                            const data = await res.json();
                            setProductosBusqueda(data.productos || []);
                            setServiciosBusqueda(data.servicios || []);
                            setCatalogoPorCategoria([]);
                            const sinRes = (data.productos || []).length === 0 && (data.servicios || []).length === 0;
                            setEstado(sinRes ? ESTADO.VACIO : ESTADO.OK);
                            return;
                        }
                    } catch {}

                    const queryLower = q.toLowerCase();
                    const todosProds = [
                        { idProducto: 101, nombreProducto: "Croquetas Pro Plan Adulto 15kg", idComercio: 1, nombreComercio: "Veterinaria San Rafael", idCategoriaProducto: 1, idMarca: 1, nombreMarca: "ProPlan", precio: 25000, precioDescuento: null, imagenUrl: null, agotado: false },
                        { idProducto: 102, nombreProducto: "Snacks Dentales Higiene Oral", idComercio: 2, nombreComercio: "PetShop San José", idCategoriaProducto: 1, idMarca: 2, nombreMarca: "Pedigree", precio: 4200, precioDescuento: null, imagenUrl: null, agotado: false },
                        { idProducto: 103, nombreProducto: "Cama Ortopédica Impermeable", idComercio: 2, nombreComercio: "PetShop San José", idCategoriaProducto: 2, idMarca: 3, nombreMarca: "Kong", precio: 25000, precioDescuento: null, imagenUrl: null, agotado: true }
                    ];
                    const todosServs = [
                        { idServicio: 201, nombreServicio: "Consulta Médica General", idTipoServicio: 1, tipoServicio: "Medicina Preventiva", idComercio: 1, nombreComercio: "Veterinaria Huellitas", precio: 15000, duracionMinutos: 30 },
                        { idServicio: 202, nombreServicio: "Baño y Peluquería Canina", idTipoServicio: 2, tipoServicio: "Estética", idComercio: 2, nombreComercio: "PetShop San José", precio: 12000, duracionMinutos: 45 }
                    ];

                    const prodsFilt = todosProds.filter(p => p.nombreProducto.toLowerCase().includes(queryLower) || p.nombreMarca.toLowerCase().includes(queryLower));
                    const servsFilt = todosServs.filter(s => s.nombreServicio.toLowerCase().includes(queryLower) || s.tipoServicio.toLowerCase().includes(queryLower));

                    setProductosBusqueda(prodsFilt);
                    setServiciosBusqueda(servsFilt);
                    setCatalogoPorCategoria([]);
                    setEstado(prodsFilt.length === 0 && servsFilt.length === 0 ? ESTADO.VACIO : ESTADO.OK);
                }
            } catch (error) {
                if (error.name === 'AbortError') return;
                setEstado(ESTADO.ERROR);
            }
        };

        cargarDatosHibridos();
        return () => controller.abort();
    }, [terminoDebounced, reintento]);

    const marcasDisponibles = [...new Map(catalogoPorCategoria.flatMap(c => c.productos || []).map(p => [p.idMarca, { id: p.idMarca, nombre: p.nombreMarca }])).values()].filter(m => m.id);
    const categoriasDisponibles = catalogoPorCategoria.map(c => ({ id: c.idCategoriaProducto, nombre: c.nombreCategoria }));

    const toggleCategoria = (id) => {
        setFiltrosAvanzados(prev => ({
            ...prev,
            categoriasIds: prev.categoriasIds.includes(id) ? prev.categoriasIds.filter(c => c !== id) : [...prev.categoriasIds, id]
        }));
    };

    const toggleMarca = (id) => {
        setFiltrosAvanzados(prev => ({
            ...prev,
            marcasIds: prev.marcasIds.includes(id) ? prev.marcasIds.filter(m => m !== id) : [...prev.marcasIds, id]
        }));
    };

    const limpiarFiltrosAvanzados = () => {
        setFiltrosAvanzados({ precioMin: '', precioMax: '', categoriasIds: [], marcasIds: [] });
    };

    const limpiarBusqueda = () => {
        setTermino('');
        setFiltroActivo('todos');
        limpiarFiltrosAvanzados();
    };

    const agregarAlCarrito = async (idProducto) => {
        const token = localStorage.getItem('token_huellitas');
        if (!token) {
            alert('Debes iniciar sesión para agregar productos al carrito.');
            return;
        }
        try {
            const res = await fetch(`${API_BASE}/carrito/agregar`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ idProducto, cantidad: 1 })
            });
            if (!res.ok) throw new Error('No se pudo agregar al carrito');
            alert('Producto agregado al carrito exitosamente.');
        } catch {
            alert('Ocurrió un error al agregar el producto al carrito.');
        }
    };

    const agendarServicio = (idServicio) => {
        alert(`Redirigiendo al agendamiento de cita para el servicio ID: ${idServicio}`);
    };

    // --- FILTRADO DE PRODUCTOS ---
    const aplicarFiltrosProductos = (listaProductos) => {
        return listaProductos.filter(prod => {
            const precioEfectivo = prod.precioDescuento ?? prod.precio;
            const matchMin = filtrosAvanzados.precioMin === '' || precioEfectivo >= Number(filtrosAvanzados.precioMin);
            const matchMax = filtrosAvanzados.precioMax === '' || precioEfectivo <= Number(filtrosAvanzados.precioMax);
            const matchCat = filtrosAvanzados.categoriasIds.length === 0 || filtrosAvanzados.categoriasIds.includes(prod.idCategoriaProducto);
            const matchMarca = filtrosAvanzados.marcasIds.length === 0 || filtrosAvanzados.marcasIds.includes(prod.idMarca);
            return matchMin && matchMax && matchCat && matchMarca;
        });
    };

    // --- NUEVO: FILTRADO DE SERVICIOS (Segundo Nivel de Filtros) ---
    const aplicarFiltrosServicios = (listaServicios) => {
        return listaServicios.filter(serv => {
            const precioEfectivo = serv.precio;
            const matchMin = filtrosAvanzados.precioMin === '' || precioEfectivo >= Number(filtrosAvanzados.precioMin);
            const matchMax = filtrosAvanzados.precioMax === '' || precioEfectivo <= Number(filtrosAvanzados.precioMax);
            
            // Si el usuario marcó una categoría o marca específica de productos, los servicios no aplican a menos que no haya filtro seleccionado
            const matchCat = filtrosAvanzados.categoriasIds.length === 0;
            const matchMarca = filtrosAvanzados.marcasIds.length === 0;

            return matchMin && matchMax && matchCat && matchMarca;
        });
    };

    const esModoBusqueda = terminoDebounced.trim() !== '';
    const tieneFiltrosAplicados = filtrosAvanzados.categoriasIds.length > 0 || filtrosAvanzados.marcasIds.length > 0 || filtrosAvanzados.precioMin !== '' || filtrosAvanzados.precioMax !== '';
    const mostrarComoGridVertical = esModoBusqueda || tieneFiltrosAplicados;

    const productosTotalesFiltrados = aplicarFiltrosProductos(
        esModoBusqueda ? productosBusqueda : catalogoPorCategoria.flatMap(c => c.productos || [])
    );

    const serviciosTotalesFiltrados = aplicarFiltrosServicios(
        serviciosBusqueda
    );

    const catalogoFiltradoCarrusel = catalogoPorCategoria.map(cat => ({
        ...cat,
        productos: aplicarFiltrosProductos(cat.productos || [])
    })).filter(cat => cat.productos.length > 0);

    const mostrarProductos = (filtroActivo === 'todos' || filtroActivo === 'productos');
    const mostrarServicios = (filtroActivo === 'todos' || filtroActivo === 'servicios');

    // Verificar si no hay resultados ni de productos ni de servicios tras los filtros
    const sinResultadosTrastFiltros = 
        (mostrarProductos && productosTotalesFiltrados.length === 0) && 
        (mostrarServicios && serviciosTotalesFiltrados.length === 0);

    return (
        <>
            <DogNav />
            <main className={styles.layout}>
                <div className={styles.container}>
                    <header className={styles.head}>
                        <div className={styles.badgeContainer}>
                            <ShoppingCart className={styles.badgeIcon} size={18} />
                            <span className={styles.badge}>Marketplace</span>
                        </div>
                        <h1 className={styles.title}>Explora productos y servicios</h1>
                        <p className={styles.subtitle}>Todo lo que tu mascota necesita, centralizado en un solo lugar.</p>
                    </header>

                    <div className={styles.searchContainer}>
                        <div className={styles.searchBar}>
                            <Search className={styles.searchIcon} size={20} />
                            <input
                                type="text"
                                className={styles.searchInput}
                                placeholder="Busca alimentos, accesorios, consultas..."
                                value={termino}
                                onChange={(e) => setTermino(e.target.value)}
                            />
                            {termino && estado !== ESTADO.CARGANDO && (
                                <button onClick={limpiarBusqueda} className={styles.clearBtn}><XCircle size={18} /></button>
                            )}
                            {estado === ESTADO.CARGANDO && <Loader2 className={styles.spinner} size={20} />}
                        </div>

                        <div className={styles.filterBar}>
                            <button className={`${styles.filterPill} ${filtroActivo === 'todos' ? styles.activePill : ''}`} onClick={() => setFiltroActivo('todos')}>
                                <LayoutGrid size={16} /> Todos
                            </button>
                            <button className={`${styles.filterPill} ${filtroActivo === 'productos' ? styles.activePill : ''}`} onClick={() => setFiltroActivo('productos')}>
                                <Package size={16} /> Productos
                            </button>
                            <button className={`${styles.filterPill} ${filtroActivo === 'servicios' ? styles.activePill : ''}`} onClick={() => setFiltroActivo('servicios')}>
                                <Stethoscope size={16} /> Servicios
                            </button>
                        </div>
                    </div>

                    <div className={styles.marketplaceLayout}>
                        <aside className={styles.sidebarFilters}>
                            <div className={styles.sidebarHeader}>
                                <h3>Filtros</h3>
                                <button onClick={limpiarFiltrosAvanzados} className={styles.clearAllText}>Limpiar</button>
                            </div>

                            <div className={styles.filterGroup}>
                                <label className={styles.filterLabel}><DollarSign size={16}/> Rango de Precio</label>
                                <div className={styles.priceInputs}>
                                    <input 
                                        type="number" 
                                        placeholder="Mín ₡" 
                                        className={styles.filterInput}
                                        value={filtrosAvanzados.precioMin}
                                        onChange={(e) => setFiltrosAvanzados({...filtrosAvanzados, precioMin: e.target.value})}
                                    />
                                    <span>-</span>
                                    <input 
                                        type="number" 
                                        placeholder="Máx ₡" 
                                        className={styles.filterInput}
                                        value={filtrosAvanzados.precioMax}
                                        onChange={(e) => setFiltrosAvanzados({...filtrosAvanzados, precioMax: e.target.value})}
                                    />
                                </div>
                            </div>

                            {categoriasDisponibles.length > 0 && (
                                <div className={styles.filterGroup}>
                                    <label className={styles.filterLabel}><Package size={16}/> Categorías</label>
                                    <div className={styles.checkboxList}>
                                        {categoriasDisponibles.map(cat => (
                                            <label key={cat.id} className={styles.checkboxItem}>
                                                <input 
                                                    type="checkbox" 
                                                    checked={filtrosAvanzados.categoriasIds.includes(cat.id)}
                                                    onChange={() => toggleCategoria(cat.id)}
                                                />
                                                <span>{cat.nombre}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {marcasDisponibles.length > 0 && (
                                <div className={styles.filterGroup}>
                                    <label className={styles.filterLabel}><Tag size={16}/> Marcas</label>
                                    <div className={styles.checkboxList}>
                                        {marcasDisponibles.map(marca => (
                                            <label key={marca.id} className={styles.checkboxItem}>
                                                <input 
                                                    type="checkbox" 
                                                    checked={filtrosAvanzados.marcasIds.includes(marca.id)}
                                                    onChange={() => toggleMarca(marca.id)}
                                                />
                                                <span>{marca.nombre}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </aside>

                        <section className={styles.resultsArea} aria-live="polite">
                            {estado === ESTADO.ERROR && (
                                <div className={`${styles.stateBox} ${styles.stateError}`}>
                                    <AlertCircle className={styles.stateIcon} size={40} />
                                    <h3>Error de conexión</h3>
                                    <p>No pudimos cargar los datos del servidor.</p>
                                    <button className={styles.retryBtn} onClick={() => setReintento((n) => n + 1)}>Reintentar</button>
                                </div>
                            )}

                            {(estado === ESTADO.VACIO || (estado === ESTADO.OK && sinResultadosTrastFiltros)) && (
                                <div className={styles.stateBox}>
                                    <Search className={styles.stateIcon} size={40} />
                                    <h3>Sin resultados</h3>
                                    <p>No encontramos elementos disponibles con los filtros aplicados.</p>
                                </div>
                            )}

                            {estado === ESTADO.OK && !sinResultadosTrastFiltros && (
                                <>
                                    {/* CARRUSELES EN VISTA INICIAL (Sin filtros de sidebar activos) */}
                                    {!mostrarComoGridVertical && mostrarProductos && catalogoFiltradoCarrusel.map((catItem) => (
                                        <CategoriaCarrusel key={catItem.idCategoriaProducto} categoriaItem={catItem} agregarAlCarrito={agregarAlCarrito} />
                                    ))}

                                    {/* SERVICIOS EN VISTA INICIAL / SIN BÚSQUEDA */}
                                    {!esModoBusqueda && mostrarServicios && serviciosTotalesFiltrados.length > 0 && (
                                        <div className={styles.seccion}>
                                            <div className={styles.seccionHeader}>
                                                <Stethoscope className={styles.seccionIcon} size={22} />
                                                <h2 className={styles.seccionTitulo}>Servicios Veterinarios</h2>
                                            </div>
                                            <ul className={styles.grid}>
                                                {serviciosTotalesFiltrados.map((serv) => (
                                                    <li key={serv.idServicio} className={styles.card}>
                                                        <div className={styles.cardBody}>
                                                            <h3 className={styles.cardTitle}>{serv.nombreServicio}</h3>
                                                            <span className={styles.cardTag}>{serv.tipoServicio} · {serv.nombreComercio}</span>
                                                            <div className={styles.serviceInfo}>
                                                                <p className={styles.cardPrecio}>₡{serv.precio}</p>
                                                                <p className={styles.cardMeta}><span>⏱</span> {serv.duracionMinutos} min</p>
                                                            </div>
                                                            <button className={styles.scheduleBtn} onClick={() => agendarServicio(serv.idServicio)}>
                                                                <CalendarPlus size={16} /><span>Agendar Cita</span>
                                                            </button>
                                                        </div>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* PRODUCTOS EN GRID (Búsqueda o Filtros Aplicados) */}
                                    {mostrarComoGridVertical && mostrarProductos && productosTotalesFiltrados.length > 0 && (
                                        <div className={styles.seccion}>
                                            <div className={styles.seccionHeader}>
                                                <Package className={styles.seccionIcon} size={22} />
                                                <h2 className={styles.seccionTitulo}>{esModoBusqueda ? "Productos Encontrados" : "Resultados Filtrados"}</h2>
                                            </div>
                                            <ul className={styles.grid}>
                                                {productosTotalesFiltrados.map((prod) => (
                                                    <li key={prod.idProducto} className={styles.card}>
                                                        {prod.imagenUrl ? (
                                                            <img src={prod.imagenUrl} alt={prod.nombreProducto} className={styles.cardImg} loading="lazy" />
                                                        ) : (
                                                            <div className={styles.cardImgPlaceholder}><Package size={36} /></div>
                                                        )}
                                                        <div className={styles.cardBody}>
                                                            <h3 className={styles.cardTitle}>{prod.nombreProducto}</h3>
                                                            <span className={styles.cardTag}>{prod.nombreMarca || prod.nombreComercio}</span>
                                                            <div className={styles.cardFooter}>
                                                                <p className={styles.cardPrecio}>₡{prod.precioDescuento ?? prod.precio}</p>
                                                                {prod.agotado ? (
                                                                    <span className={styles.agotado}>Agotado</span>
                                                                ) : (
                                                                    <button className={styles.addBtn} onClick={() => agregarAlCarrito(prod.idProducto)}>
                                                                        <ShoppingCart size={16} /><span>Agregar</span>
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* SERVICIOS EN MODO BÚSQUEDA O CON FILTROS DE PRECIO */}
                                    {esModoBusqueda && mostrarServicios && serviciosTotalesFiltrados.length > 0 && (
                                        <div className={styles.seccion}>
                                            <div className={styles.seccionHeader}>
                                                <Stethoscope className={styles.seccionIcon} size={22} />
                                                <h2 className={styles.seccionTitulo}>Servicios Encontrados</h2>
                                            </div>
                                            <ul className={styles.grid}>
                                                {serviciosTotalesFiltrados.map((serv) => (
                                                    <li key={serv.idServicio} className={styles.card}>
                                                        <div className={styles.cardBody}>
                                                            <h3 className={styles.cardTitle}>{serv.nombreServicio}</h3>
                                                            <span className={styles.cardTag}>{serv.tipoServicio} · {serv.nombreComercio}</span>
                                                            <div className={styles.serviceInfo}>
                                                                <p className={styles.cardPrecio}>₡{serv.precio}</p>
                                                                <p className={styles.cardMeta}><span>⏱</span> {serv.duracionMinutos} min</p>
                                                            </div>
                                                            <button className={styles.scheduleBtn} onClick={() => agendarServicio(serv.idServicio)}>
                                                                <CalendarPlus size={16} /><span>Agendar Cita</span>
                                                            </button>
                                                        </div>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </>
                            )}
                        </section>
                    </div>
                </div>
            </main>
        </>
    );
};

export default Marketplace;