import { ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCarrito } from '../../hooks/useCarrito';
import styles from './CarritoIcono.module.css';

/**
 * Ícono del carrito con el contador de unidades.
 *
 * El número es la suma de unidades, no la cantidad de líneas: tres frascos del
 * mismo alimento se muestran como 3. Cuando el carrito está vacío el número
 * desaparece y queda solo el ícono.
 */
export const CarritoIcono = () => {
    const { unidades } = useCarrito();

    const vacio = unidades === 0;
    const etiqueta = vacio
        ? 'Carrito de compras, vacío'
        : `Carrito de compras, ${unidades} ${unidades === 1 ? 'producto' : 'productos'}`;

    return (
        <Link to="/carrito" className={styles.enlace} aria-label={etiqueta} title={etiqueta}>
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
        </Link>
    );
};

export default CarritoIcono;
