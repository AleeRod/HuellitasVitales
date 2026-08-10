import { useContext } from 'react';
import { CarritoContexto } from '../context/carritoContexto';

/**
 * Acceso al carrito compartido.
 *
 * Devuelve los items, la cantidad de unidades, el total y las acciones para
 * agregar, cambiar cantidades y eliminar.
 */
export function useCarrito() {
    const contexto = useContext(CarritoContexto);

    if (contexto === null) {
        throw new Error('useCarrito debe usarse dentro de CarritoProvider.');
    }

    return contexto;
}

export default useCarrito;
