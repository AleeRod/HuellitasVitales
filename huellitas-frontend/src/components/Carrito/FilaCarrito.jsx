import { useEffect, useState } from 'react';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { precioVigente } from '../../lib/carritoLocal';
import styles from './FilaCarrito.module.css';

/** Formato de plata de Costa Rica: ₡12.500,00 */
const enColones = (monto) => `₡${Number(monto || 0).toLocaleString('es-CR', { minimumFractionDigits: 2 })}`;

/**
 * Una línea del carrito, con sus controles para cambiar la cantidad y para
 * quitar el producto.
 *
 * Mientras se guarda, solo se bloquea esta fila: las demás siguen usables.
 */
export const FilaCarrito = ({ item, guardando, onCambiarCantidad, onEliminar }) => {
    const [textoCantidad, setTextoCantidad] = useState(String(item.cantidad));

    // Refleja la cantidad real, tanto cuando cambia con los botones como
    // cuando un guardado falla y la fila vuelve para atrás.
    useEffect(() => {
        setTextoCantidad(String(item.cantidad));
    }, [item.cantidad]);

    const precio = precioVigente(item);
    const sinTope = typeof item.stock !== 'number';
    const enElTope = !sinTope && item.cantidad >= item.stock;

    const cambiarA = (cantidad) => {
        const resultado = onCambiarCantidad(item.idProducto, cantidad);
        // Entrada inválida: se descarta y la casilla vuelve al valor guardado.
        if (!resultado?.ok) setTextoCantidad(String(item.cantidad));
    };

    const confirmarTexto = () => cambiarA(textoCantidad);

    const alPresionarTecla = (evento) => {
        if (evento.key === 'Enter') {
            evento.preventDefault();
            evento.target.blur();
        }
    };

    return (
        <li className={styles.fila} aria-busy={guardando}>
            <div className={styles.imagenCaja}>
                {item.imagenUrl ? (
                    <img src={item.imagenUrl} alt="" className={styles.imagen} />
                ) : (
                    <span className={styles.sinImagen} aria-hidden="true">🐾</span>
                )}
            </div>

            <div className={styles.datos}>
                <p className={styles.nombre}>{item.nombre}</p>
                {item.nombreComercio && <p className={styles.comercio}>{item.nombreComercio}</p>}
                <p className={styles.precioUnitario}>{enColones(precio)} c/u</p>
                {enElTope && <p className={styles.aviso}>Es todo lo que hay disponible</p>}
            </div>

            <div className={styles.controles}>
                <button
                    type="button"
                    className={styles.botonCantidad}
                    onClick={() => cambiarA(item.cantidad - 1)}
                    disabled={guardando || item.cantidad <= 1}
                    aria-label={`Quitar una unidad de ${item.nombre}`}
                >
                    <Minus size={16} aria-hidden="true" />
                </button>

                <input
                    type="text"
                    inputMode="numeric"
                    className={styles.campoCantidad}
                    value={textoCantidad}
                    onChange={(evento) => setTextoCantidad(evento.target.value)}
                    onBlur={confirmarTexto}
                    onKeyDown={alPresionarTecla}
                    disabled={guardando}
                    aria-label={`Cantidad de ${item.nombre}`}
                />

                <button
                    type="button"
                    className={styles.botonCantidad}
                    onClick={() => cambiarA(item.cantidad + 1)}
                    disabled={guardando || enElTope}
                    aria-label={`Agregar una unidad de ${item.nombre}`}
                >
                    <Plus size={16} aria-hidden="true" />
                </button>
            </div>

            <p className={styles.subtotal}>{enColones(precio * item.cantidad)}</p>

            <button
                type="button"
                className={styles.botonEliminar}
                onClick={() => onEliminar(item.idProducto)}
                disabled={guardando}
                aria-label={`Quitar ${item.nombre} del carrito`}
            >
                <Trash2 size={18} aria-hidden="true" />
            </button>
        </li>
    );
};

export default FilaCarrito;
