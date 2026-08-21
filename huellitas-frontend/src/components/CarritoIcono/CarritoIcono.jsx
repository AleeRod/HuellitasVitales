import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Minus, Plus, Trash2 } from 'lucide-react';
import { useCarrito } from '../../hooks/useCarrito';
import { precioVigente } from '../../lib/carritoLocal';
import { resolverImagen } from '../../api/config';
import styles from './CarritoIcono.module.css';

/** Formato de plata de Costa Rica: ₡12.500,00 */
const enColones = (monto) => `₡${Number(monto || 0).toLocaleString('es-CR', { minimumFractionDigits: 2 })}`;

/**
 * Ícono del carrito con el contador de unidades y un mini-carrito desplegable.
 *
 * El número es la suma de unidades, no la cantidad de líneas: tres frascos del
 * mismo alimento se muestran como 3. Cuando el carrito está vacío el número
 * desaparece y queda solo el ícono.
 *
 * Al hacer clic se abre un panel con los productos agregados, donde se puede
 * ajustar la cantidad o quitar un producto sin salir de la página en la que se
 * está. "Ver carrito y pagar" manda al checkout completo (`/carrito`).
 */
export const CarritoIcono = () => {
    const { items, unidades, total, cambiarCantidad, eliminar } = useCarrito();
    const [abierto, setAbierto] = useState(false);
    const contenedorRef = useRef(null);

    const vacio = unidades === 0;
    const etiqueta = vacio
        ? 'Carrito de compras, vacío'
        : `Carrito de compras, ${unidades} ${unidades === 1 ? 'producto' : 'productos'}`;

    // Cierra el mini-carrito si se hace clic fuera de él.
    useEffect(() => {
        const alHacerClicFuera = (evento) => {
            if (contenedorRef.current && !contenedorRef.current.contains(evento.target)) {
                setAbierto(false);
            }
        };
        document.addEventListener('mousedown', alHacerClicFuera);
        return () => document.removeEventListener('mousedown', alHacerClicFuera);
    }, []);

    return (
        <div className={styles.contenedor} ref={contenedorRef}>
            <button
                type="button"
                className={styles.enlace}
                aria-label={etiqueta}
                title={etiqueta}
                aria-expanded={abierto}
                onClick={() => setAbierto((actual) => !actual)}
            >
                <ShoppingCart size={22} aria-hidden="true" />

                {/* El número ya se lee en la etiqueta, así que acá se oculta para
                    que el lector de pantalla no lo repita dos veces. */}
                {!vacio && (
                    <span className={styles.contador} aria-hidden="true">
                        {unidades > 99 ? '99+' : unidades}
                    </span>
                )}

                {/* Avisa el cambio a quien navega con lector de pantalla, sin
                    obligarlo a volver el foco al ícono. */}
                <span className={styles.soloLectores} role="status">
                    {etiqueta}
                </span>
            </button>

            {abierto && (
                <div className={styles.dropdown}>
                    <div className={styles.dropdownHeader}>
                        <h4>Tu carrito</h4>
                        {!vacio && (
                            <span className={styles.dropdownContador}>
                                {unidades} {unidades === 1 ? 'producto' : 'productos'}
                            </span>
                        )}
                    </div>

                    {vacio ? (
                        <div className={styles.dropdownVacio}>
                            <span aria-hidden="true">🛒</span>
                            <p>Todavía no agregaste nada.</p>
                            <Link
                                to="/marketplace"
                                className={styles.dropdownBotonSecundario}
                                onClick={() => setAbierto(false)}
                            >
                                Ver productos
                            </Link>
                        </div>
                    ) : (
                        <>
                            <ul className={styles.dropdownLista}>
                                {items.map((item) => {
                                    const precio = precioVigente(item);
                                    const sinTope = typeof item.stock !== 'number';
                                    const enElTope = !sinTope && item.cantidad >= item.stock;

                                    return (
                                        <li className={styles.dropdownItem} key={item.idProducto}>
                                            <div className={styles.dropdownImagenCaja}>
                                                {item.imagenUrl ? (
                                                    <img
                                                        src={resolverImagen(item.imagenUrl)}
                                                        alt=""
                                                        className={styles.dropdownImagen}
                                                    />
                                                ) : (
                                                    <span aria-hidden="true">🐾</span>
                                                )}
                                            </div>

                                            <div className={styles.dropdownDatos}>
                                                <p className={styles.dropdownNombre}>{item.nombre}</p>
                                                <p className={styles.dropdownPrecio}>{enColones(precio)} c/u</p>

                                                <div className={styles.dropdownControles}>
                                                    <button
                                                        type="button"
                                                        className={styles.dropdownBotonCantidad}
                                                        onClick={() => cambiarCantidad(item.idProducto, item.cantidad - 1)}
                                                        disabled={item.cantidad <= 1}
                                                        aria-label={`Quitar una unidad de ${item.nombre}`}
                                                    >
                                                        <Minus size={13} aria-hidden="true" />
                                                    </button>
                                                    <span className={styles.dropdownCantidad}>{item.cantidad}</span>
                                                    <button
                                                        type="button"
                                                        className={styles.dropdownBotonCantidad}
                                                        onClick={() => cambiarCantidad(item.idProducto, item.cantidad + 1)}
                                                        disabled={enElTope}
                                                        aria-label={`Agregar una unidad de ${item.nombre}`}
                                                    >
                                                        <Plus size={13} aria-hidden="true" />
                                                    </button>

                                                    <button
                                                        type="button"
                                                        className={styles.dropdownEliminar}
                                                        onClick={() => eliminar(item.idProducto)}
                                                        aria-label={`Quitar ${item.nombre} del carrito`}
                                                    >
                                                        <Trash2 size={14} aria-hidden="true" />
                                                    </button>
                                                </div>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>

                            <div className={styles.dropdownFooter}>
                                <div className={styles.dropdownTotal}>
                                    <span>Total</span>
                                    <span>{enColones(total)}</span>
                                </div>
                                <Link
                                    to="/carrito"
                                    className={styles.dropdownBotonPrimario}
                                    onClick={() => setAbierto(false)}
                                >
                                    Ver carrito y pagar
                                </Link>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default CarritoIcono;
