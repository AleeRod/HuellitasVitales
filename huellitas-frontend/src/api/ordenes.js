import { API_BASE } from './config';

/**
 * Envía la compra al servidor.
 *
 * Solo se mandan el producto y la cantidad: el precio lo vuelve a calcular el
 * backend contra la base, así nadie puede comprar más barato editando lo que
 * tiene guardado en el navegador.
 *
 * @param {Array} items  Items del carrito local
 * @param {string} token  JWT de la sesión activa
 */
export async function crearOrden(items, token) {
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
            }))
        })
    });

    const datos = await respuesta.json().catch(() => null);

    if (!respuesta.ok) {
        throw new Error(datos?.mensaje ?? 'No pudimos registrar tu compra. Intentá de nuevo.');
    }

    return datos;
}
