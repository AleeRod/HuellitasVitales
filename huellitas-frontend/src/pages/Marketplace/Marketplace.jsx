import React, { useEffect, useRef, useState } from 'react';
import DogNav from '../../components/DogNav/DogNav';
import { useDebounce } from '../../hooks/useDebounce';
import { useCarrito } from '../../hooks/useCarrito';
import { ToastContainer } from '../../components/Toast/Toast';
import useToast from '../../components/Toast/useToast';
import CarritoIcono from '../../components/CarritoIcono/CarritoIcono';
import { API_BASE } from '../../api/config';
import { 
    Search, ShoppingCart, Package, Stethoscope, 
    AlertCircle, Loader2, CalendarPlus, XCircle, LayoutGrid,
    ChevronLeft, ChevronRight, DollarSign, Tag, ListFilter // Importé ListFilter para el icono
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
                                            onClick={() => agregarAlCarrito(prod)}
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
        marcasIds: [],
        tiposServicioIds: [] // <-- ¡NUEVO ESTADO PARA SERVICIOS!
    });
    
    const [productosBusqueda, setProductosBusqueda] = useState([]);
    const [serviciosBusqueda, setServiciosBusqueda] = useState([]);
    const [catalogoPorCategoria, setCatalogoPorCategoria] = useState([]);
    
    const [estado, setEstado] = useState(ESTADO.CARGANDO);
    const [reintento, setReintento] = useState(0);

    const terminoDebounced = useDebounce(termino, 400);
    const abortRef = useRef(null);

    const { agregar } = useCarrito();
    const { toasts, showToast, removeToast } = useToast();

    useEffect(() => {
        const q = terminoDebounced.trim();

        if (abortRef.current) abortRef.current.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        const cargarDatosBD = async () => {
            setEstado(ESTADO.CARGANDO);
            try {
                if (q === '') {
                    const res = await fetch(`${API_BASE}/marketplace/catalogo`, { signal: controller.signal });
                    if (!res.ok) throw new Error('Error al conectar con la base de datos');
                    
                    const data = await res.json();
                    const categorias = data.categorias || data || [];
                    const servicios = data.servicios || [];
                    
                    setCatalogoPorCategoria(categorias);
                    setProductosBusqueda(categorias.flatMap(c => c.productos || []));
                    setServiciosBusqueda(servicios);
                    
                    const total = categorias.flatMap(c => c.productos || []).length + servicios.length;
                    setEstado(total === 0 ? ESTADO.VACIO : ESTADO.OK);

                } else {
                    const res = await fetch(`${API_BASE}/marketplace/buscar?q=${encodeURIComponent(q)}`, { signal: controller.signal });
                    
                    if (!res.ok) {
                        if (res.status === 400) {
                            setEstado(ESTADO.VACIO);
                            setProductosBusqueda([]);
                            setServiciosBusqueda([]);
                            return;
                        }
                        throw new Error('Error en la búsqueda');
                    }
                    
                    const data = await res.json();
                    const prods = data.productos || data.data || [];
                    const servs = data.servicios || [];
                    
                    setProductosBusqueda(prods);
                    setServiciosBusqueda(servs);
                    setCatalogoPorCategoria([]);
                    
                    const sinRes = prods.length === 0 && servs.length === 0;
                    setEstado(sinRes ? ESTADO.VACIO : ESTADO.OK);
                }
            } catch (error) {
                if (error.name === 'AbortError') return;
                setEstado(ESTADO.ERROR);
            }
        };

        cargarDatosBD();
        return () => controller.abort();
    }, [terminoDebounced, reintento]);

    // EXTRACCIÓN DE FILTROS ÚNICOS
    const marcasDisponibles = [...new Map(catalogoPorCategoria.flatMap(c => c.productos || []).map(p => [p.idMarca, { id: p.idMarca, nombre: p.nombreMarca }])).values()].filter(m => m.id);
    const categoriasDisponibles = catalogoPorCategoria.map(c => ({ id: c.idCategoriaProducto, nombre: c.nombreCategoria }));
    
    // <-- ¡NUEVA LÓGICA DE EXTRACCIÓN DE TIPOS DE SERVICIO! -->
    const tiposServicioDisponibles = [...new Map(
        serviciosBusqueda.map(s => [s.idTipoServicio, { id: s.idTipoServicio, nombre: s.tipoServicio }])
    ).values()].filter(t => t.id);

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

    // <-- ¡NUEVA FUNCIÓN PARA TOGGLE DEL SERVICIO! -->
    const toggleTipoServicio = (id) => {
        setFiltrosAvanzados(prev => ({
            ...prev,
            tiposServicioIds: prev.tiposServicioIds.includes(id) ? prev.tiposServicioIds.filter(t => t !== id) : [...prev.tiposServicioIds, id]
        }));
    };

    const limpiarFiltrosAvanzados = () => {
        // Limpiamos también el nuevo estado
        setFiltrosAvanzados({ precioMin: '', precioMax: '', categoriasIds: [], marcasIds: [], tiposServicioIds: [] });
    };

    const limpiarBusqueda = () => {
        setTermino('');
        setFiltroActivo('todos');
        limpiarFiltrosAvanzados();
    };

    // El carrito se guarda en el navegador, así que no hace falta tener sesión
    // para armarlo. La cuenta se pide recién al momento de pagar.
    const agregarAlCarrito = (prod) => {
        const resultado = agregar({
            idProducto: prod.idProducto,
            nombre: prod.nombreProducto ?? prod.nombre,
            precio: prod.precio,
            precioDescuento: prod.precioDescuento ?? null,
            imagenUrl: prod.imagenUrl || null,
            stock: prod.stock ?? null,
            idComercio: prod.idComercio ?? null,
            nombreComercio: prod.nombreComercio ?? ''
        });

        if (resultado.ok) {
            showToast(`Agregamos ${prod.nombreProducto ?? 'el producto'} a tu carrito.`, 'success');
        } else {
            showToast(resultado.mensaje ?? 'No pudimos agregar el producto.', 'warning');
        }
    };

    const agendarServicio = (idServicio) => {
        alert(`Redirigiendo al agendamiento de cita para el servicio ID: ${idServicio}`);
    };

    const aplicarFiltrosProductos = (listaProductos) => {
        return listaProductos.filter(prod => {
            const precioEfectivo = prod.precioDescuento ?? prod.precio;
            const matchMin = filtrosAvanzados.precioMin === '' || precioEfectivo >= Number(filtrosAvanzados.precioMin);
            const matchMax = filtrosAvanzados.precioMax === '' || precioEfectivo <= Number(filtrosAvanzados.precioMax);
            const matchCat = filtrosAvanzados.categoriasIds.length === 0 || filtrosAvanzados.categoriasIds.includes(prod.idCategoriaProducto);
            const matchMarca = filtrosAvanzados.marcasIds.length === 0 || filtrosAvanzados.marcasIds.includes(prod.idMarca);
            
            // 👇 NUEVO: Si hay algún tipo de servicio marcado, los productos NO deben mostrarse
            const matchTipoServicio = filtrosAvanzados.tiposServicioIds.length === 0;
            
            return matchMin && matchMax && matchCat && matchMarca && matchTipoServicio;
        });
    };

    const aplicarFiltrosServicios = (listaServicios) => {
        return listaServicios.filter(serv => {
            const precioEfectivo = serv.precio;
            const matchMin = filtrosAvanzados.precioMin === '' || precioEfectivo >= Number(filtrosAvanzados.precioMin);
            const matchMax = filtrosAvanzados.precioMax === '' || precioEfectivo <= Number(filtrosAvanzados.precioMax);
            
            // 👇 CORRECCIÓN: Si hay alguna categoría o marca marcada, los servicios NO deben mostrarse
            const matchCat = filtrosAvanzados.categoriasIds.length === 0;
            const matchMarca = filtrosAvanzados.marcasIds.length === 0;
            
            const matchTipoServicio = filtrosAvanzados.tiposServicioIds.length === 0 || filtrosAvanzados.tiposServicioIds.includes(serv.idTipoServicio);
            
            return matchMin && matchMax && matchCat && matchMarca && matchTipoServicio;
        });
    };

    const esModoBusqueda = terminoDebounced.trim() !== '';
    
    // Verificamos si hay cualquier filtro activo para cambiar a formato lista vertical
    const tieneFiltrosAplicados = filtrosAvanzados.categoriasIds.length > 0 || filtrosAvanzados.marcasIds.length > 0 || filtrosAvanzados.tiposServicioIds.length > 0 || filtrosAvanzados.precioMin !== '' || filtrosAvanzados.precioMax !== '';
    
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

    const sinResultadosTrastFiltros = 
        (mostrarProductos && productosTotalesFiltrados.length === 0) && 
        (mostrarServicios && serviciosTotalesFiltrados.length === 0);

    return (
        <>
            <DogNav />
            <ToastContainer toasts={toasts} removeToast={removeToast} />
            <main className={styles.layout}>
                <div className={styles.container}>
                    <header className={styles.head}>
                        <div className={styles.badgeContainer}>
                            <ShoppingCart className={styles.badgeIcon} size={18} />
                            <span className={styles.badge}>Marketplace</span>
                            {/* Acceso al carrito desde la misma pantalla donde se agrega. */}
                            <CarritoIcono />
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

                            {/* <-- ¡NUEVA SECCIÓN DE UI PARA TIPOS DE SERVICIO! --> */}
                            {tiposServicioDisponibles.length > 0 && (
                                <div className={styles.filterGroup}>
                                    <label className={styles.filterLabel}><ListFilter size={16}/> Tipos de Servicio</label>
                                    <div className={styles.checkboxList}>
                                        {tiposServicioDisponibles.map(tipo => (
                                            <label key={tipo.id} className={styles.checkboxItem}>
                                                <input 
                                                    type="checkbox" 
                                                    checked={filtrosAvanzados.tiposServicioIds.includes(tipo.id)}
                                                    onChange={() => toggleTipoServicio(tipo.id)}
                                                />
                                                <span>{tipo.nombre}</span>
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
                                    <p>No pudimos conectar con la base de datos o el servidor.</p>
                                    <button className={styles.retryBtn} onClick={() => setReintento((n) => n + 1)}>Reintentar</button>
                                </div>
                            )}

                            {(estado === ESTADO.VACIO || (estado === ESTADO.OK && sinResultadosTrastFiltros)) && (
                                <div className={styles.stateBox}>
                                    <Search className={styles.stateIcon} size={40} />
                                    <h3>Sin resultados</h3>
                                    <p>No hay elementos en la base de datos que coincidan con los filtros aplicados.</p>
                                </div>
                            )}

                            {estado === ESTADO.OK && !sinResultadosTrastFiltros && (
                                <>
                                    {!mostrarComoGridVertical && mostrarProductos && catalogoFiltradoCarrusel.map((catItem) => (
                                        <CategoriaCarrusel key={catItem.idCategoriaProducto} categoriaItem={catItem} agregarAlCarrito={agregarAlCarrito} />
                                    ))}

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
                                                                    <button className={styles.addBtn} onClick={() => agregarAlCarrito(prod)}>
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