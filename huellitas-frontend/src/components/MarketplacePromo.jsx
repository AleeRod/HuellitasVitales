import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, ShoppingCart } from 'lucide-react';
import { API_BASE, resolverImagen } from '../api/config';
import { useCarrito } from '../hooks/useCarrito';
import { ToastContainer } from './Toast/Toast';
import { useToast } from './Toast/useToast';

/** Formato de plata de Costa Rica: ₡12.500,00 */
const enColones = (monto) => `₡${Number(monto || 0).toLocaleString('es-CR', { minimumFractionDigits: 2 })}`;

// Antes esta sección mostraba 4 productos inventados a mano (nombres, precios en dólares,
// categorías en inglés que no existen en la base) con una imagen de relleno fija. Ahora consume
// el mismo catálogo real que usa el Marketplace completo (GET /api/marketplace/catalogo):
// categorías reales, precios en colones (con descuento si aplica), imagen real del producto y
// el botón "+" agrega de verdad al carrito compartido (mismo `useCarrito` que usa toda la app).
const MarketplacePromo = () => {
  const navigate = useNavigate();
  const { agregar } = useCarrito();
  const { toasts, showToast, removeToast } = useToast();

  const [categorias, setCategorias] = useState([]);
  const [categoriaActiva, setCategoriaActiva] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let activo = true;
    setCargando(true);
    setError(false);

    fetch(`${API_BASE}/marketplace/catalogo`)
      .then((res) => {
        if (!res.ok) throw new Error('No se pudo cargar el catálogo.');
        return res.json();
      })
      .then((data) => {
        if (!activo) return;
        const lista = (data.categorias || []).filter((c) => (c.productos || []).length > 0);
        setCategorias(lista);
        if (lista.length > 0) setCategoriaActiva(lista[0].idCategoriaProducto);
      })
      .catch((err) => {
        console.error('Catálogo del marketplace:', err);
        if (activo) setError(true);
      })
      .finally(() => {
        if (activo) setCargando(false);
      });

    return () => { activo = false; };
  }, []);

  const categoriaSeleccionada = useMemo(
    () => categorias.find((c) => c.idCategoriaProducto === categoriaActiva),
    [categorias, categoriaActiva]
  );

  // Solo un vistazo (4 productos, misma proporción 2x2 que ya tenía el diseño) — el catálogo
  // completo, con búsqueda y filtros, vive en "Ir al Marketplace Completo".
  const productosVistazo = (categoriaSeleccionada?.productos || []).slice(0, 4);

  const agregarAlCarrito = (prod) => {
    const resultado = agregar({
      idProducto: prod.idProducto,
      nombre: prod.nombreProducto,
      precio: prod.precio,
      precioDescuento: prod.precioDescuento,
      imagenUrl: prod.imagenUrl || null,
      stock: prod.stock ?? null,
      idComercio: prod.idComercio ?? null,
      nombreComercio: prod.nombreComercio ?? ''
    });

    if (resultado.ok) {
      showToast(`Agregamos ${prod.nombreProducto} a tu carrito.`, 'success');
    } else {
      showToast(resultado.mensaje ?? 'No pudimos agregar el producto.', 'warning');
    }
  };

  return (
    <section className="promo-marketplace-section" id="marketplace">
      <div className="promo-container">

        <div className="promo-text-content">
          <div className="badge-clean">Catálogo en línea</div>
          <h2 className="title-clean">Todo lo necesario en un <span>Solo Lugar</span></h2>
          <p className="desc-clean">
            Productos reales de las veterinarias y comercios afiliados a Huellitas Vitales:
            medicamentos, alimentos y accesorios, con disponibilidad y precios actualizados.
          </p>

          {categorias.length > 1 && (
            <div className="marketplace-filters-clean">
              {categorias.map((cat) => (
                <button
                  key={cat.idCategoriaProducto}
                  className={`filter-clean-btn ${categoriaActiva === cat.idCategoriaProducto ? 'active' : ''}`}
                  onClick={() => setCategoriaActiva(cat.idCategoriaProducto)}
                >
                  {cat.nombreCategoria}
                </button>
              ))}
            </div>
          )}

          <button
            onClick={() => navigate('/marketplace')}
            className="btn-solid"
            style={{ marginTop: '2.5rem' }}
          >
            Ir al Marketplace Completo
          </button>
        </div>

        <div className="promo-visual-side">
          <div className="marketplace-grid-preview">
            {cargando && <p style={{ color: 'var(--text-lt, #718096)' }}>Cargando productos…</p>}

            {!cargando && error && (
              <p style={{ color: 'var(--text-lt, #718096)' }}>No pudimos cargar el catálogo en este momento.</p>
            )}

            {!cargando && !error && productosVistazo.length === 0 && (
              <p style={{ color: 'var(--text-lt, #718096)' }}>Todavía no hay productos publicados.</p>
            )}

            {!cargando && !error && productosVistazo.map((product) => (
              <div key={product.idProducto} className="marketplace-product-card">
                {product.agotado ? (
                  <div className="prod-badge">Agotado</div>
                ) : product.precioDescuento ? (
                  <div className="prod-badge">Oferta</div>
                ) : null}

                {product.imagenUrl ? (
                  <img
                    src={resolverImagen(product.imagenUrl)}
                    alt={product.nombreProducto}
                    className="prod-img"
                  />
                ) : (
                  <div className="prod-placeholder-img">
                    <Package size={28} />
                  </div>
                )}

                <h4>{product.nombreProducto}</h4>
                <div className="prod-footer">
                  <span className="prod-price">
                    {enColones(product.precioDescuento ?? product.precio)}
                  </span>
                  <button
                    className="prod-add-btn"
                    onClick={() => agregarAlCarrito(product)}
                    disabled={product.agotado}
                    title={product.agotado ? 'Agotado' : `Agregar ${product.nombreProducto} al carrito`}
                    aria-label={product.agotado ? 'Agotado' : `Agregar ${product.nombreProducto} al carrito`}
                  >
                    <ShoppingCart size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </section>
  );
};

export default MarketplacePromo;
