import { createContext } from 'react';

/**
 * Contexto del carrito compartido.
 *
 * Vive en su propio archivo porque el proveedor solo puede exportar
 * componentes: si se mezclan, el refresco en caliente de Vite deja de andar.
 * Para consumirlo usá el hook useCarrito.
 */
export const CarritoContexto = createContext(null);
