import { API_BASE } from './config';

/**
 * Envía la compra al servidor.
 *
 * Solo se mandan el producto y la cantidad: el precio lo vuelve a calcular el
 * backend contra la base, así nadie puede comprar más barato editando lo que
 * tiene guardado en el navegador. El método de pago es solo texto informativo
 * de la simulación de checkout: no afecta el cobro (no hay cobro real).
 *
 * @param {Array} items  Items del carrito local
 * @param {string} token  JWT de la sesión activa
 * @param {string} [metodoPago]  'tarjeta' | 'sinpe' | 'efectivo'
 */
export async function crearOrden(items, token, metodoPago) {
    const respuesta = await fetch(`${API_BASE}/orden`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
            items: items.map((item) => ({
                idProducto: item.idProducto,
                cantidad: item.cantidad
            })),
            metodoPago: metodoPago || null
        })
    });

    const datos = await respuesta.json().catch(() => null);

    if (!respuesta.ok) {
        throw new Error(datos?.mensaje ?? 'No pudimos registrar tu compra. Intentá de nuevo.');
    }

    return datos;
}

/**
 * Trae el historial de compras ("Mis compras") del usuario autenticado.
 *
 * @param {string} token  JWT de la sesión activa
 */
export async function obtenerMisOrdenes(token) {
    const respuesta = await fetch(`${API_BASE}/orden`, {
        headers: { Authorization: `Bearer ${token}` }
    });

    const datos = await respuesta.json().catch(() => null);

    if (!respuesta.ok) {
        throw new Error(datos?.mensaje ?? 'No pudimos cargar tus compras.');
    }

    return datos?.ordenes ?? [];
}

/**
 * Trae el recibo/factura interna completo de una orden puntual.
 *
 * @param {string} token  JWT de la sesión activa
 * @param {number} idOrden
 */
export async function obtenerFactura(token, idOrden) {
    const respuesta = await fetch(`${API_BASE}/orden/${idOrden}`, {
        headers: { Authorization: `Bearer ${token}` }
    });

    const datos = await respuesta.json().catch(() => null);

    if (!respuesta.ok) {
        throw new Error(datos?.mensaje ?? 'No pudimos cargar el recibo de esa compra.');
    }

    return datos?.factura ?? null;
}
