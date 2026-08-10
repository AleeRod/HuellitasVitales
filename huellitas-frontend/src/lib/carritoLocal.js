/**
 * Almacén del carrito de compras en el navegador.
 *
 * El carrito vive en localStorage para que cualquier persona pueda armarlo sin
 * tener sesión. La base de datos recién entra en juego al pagar: ahí se pide
 * iniciar sesión y la compra se guarda como orden.
 *
 * Este archivo es la única fuente de verdad del carrito. Los componentes no
 * leen ni escriben localStorage directamente.
 */

// Misma familia de nombres que token_huellitas y usuario_huellitas.
const CLAVE_CARRITO = 'carrito_huellitas';

/** Aviso que se dispara cuando el carrito cambia, para refrescar la pantalla. */
export const EVENTO_CARRITO = 'carrito:actualizado';

/**
 * Precio que se le cobra a la persona: si el producto tiene descuento, manda
 * el descuento. Mismo criterio que usa el backend al armar la orden.
 */
export function precioVigente(item) {
    return item?.precioDescuento ?? item?.precio ?? 0;
}

/**
 * Descarta cantidades que no sirven y aplica los topes.
 * Devuelve null cuando el valor no es aprovechable, para que quien llame
 * pueda ignorar el cambio en lugar de guardar una cantidad inventada.
 *
 * @param {*} cantidad  Valor a validar (puede venir de un input, o sea texto)
 * @param {number|null} stock  Existencias del producto; null significa sin tope
 */
export function normalizarCantidad(cantidad, stock) {
    const numero = Math.floor(Number(cantidad));

    if (!Number.isFinite(numero) || numero < 1) return null;

    // Solo topamos cuando el producto informa existencias.
    if (typeof stock === 'number' && Number.isFinite(stock)) {
        if (stock < 1) return null;
        return Math.min(numero, stock);
    }

    return numero;
}

/**
 * Deja pasar únicamente los items con forma válida. Protege contra datos
 * viejos o manipulados a mano en el navegador, que si no reventarían la
 * pantalla del carrito.
 */
function esItemValido(item) {
    return (
        item !== null &&
        typeof item === 'object' &&
        Number.isFinite(Number(item.idProducto)) &&
        Number.isFinite(Number(item.cantidad)) &&
        Number(item.cantidad) >= 1
    );
}

/**
 * Lee el carrito guardado. Ante cualquier dato corrupto devuelve un carrito
 * vacío en vez de fallar.
 */
export function obtenerCarrito() {
    try {
        const guardado = localStorage.getItem(CLAVE_CARRITO);
        if (!guardado) return [];

        const items = JSON.parse(guardado);
        if (!Array.isArray(items)) return [];

        return items.filter(esItemValido).map((item) => ({
            ...item,
            idProducto: Number(item.idProducto),
            cantidad: Number(item.cantidad)
        }));
    } catch (error) {
        console.error('No se pudo leer el carrito guardado, se empieza vacío.', error);
        return [];
    }
}

/**
 * Guarda el carrito y avisa a la pantalla.
 *
 * Escribir en localStorage puede fallar (espacio lleno, o navegación privada
 * en algunos navegadores). Por eso devuelve el resultado: si falló, entrega
 * los items que siguen guardados para que la pantalla vuelva a la verdad.
 *
 * @returns {{ok: boolean, items: Array, mensaje?: string}}
 */
export function guardarCarrito(items) {
    try {
        localStorage.setItem(CLAVE_CARRITO, JSON.stringify(items));
        window.dispatchEvent(new CustomEvent(EVENTO_CARRITO, { detail: items }));
        return { ok: true, items };
    } catch (error) {
        console.error('No se pudo guardar el carrito.', error);
        return {
            ok: false,
            items: obtenerCarrito(),
            mensaje: 'No pudimos guardar el cambio. Revisá el espacio de tu navegador e intentá de nuevo.'
        };
    }
}

/**
 * Agrega un producto. Si ya estaba en el carrito suma la cantidad, igual que
 * hace el backend al agregar.
 *
 * @param {object} producto  Producto tal como lo entrega el marketplace
 * @param {number} cantidad  Unidades a sumar
 */
export function agregarItem(producto, cantidad = 1) {
    if (!producto || !Number.isFinite(Number(producto.idProducto))) {
        return { ok: false, items: obtenerCarrito(), mensaje: 'No pudimos identificar ese producto.' };
    }

    const items = obtenerCarrito();
    const idProducto = Number(producto.idProducto);
    const existente = items.find((item) => item.idProducto === idProducto);
    const stock = producto.stock ?? existente?.stock ?? null;

    const cantidadPedida = (existente?.cantidad ?? 0) + Math.floor(Number(cantidad) || 0);
    const cantidadFinal = normalizarCantidad(cantidadPedida, stock);

    if (cantidadFinal === null) {
        return { ok: false, items, mensaje: 'Ese producto está agotado por ahora.' };
    }

    // Ya tenía todo el stock disponible en el carrito: no hay nada que sumar.
    if (existente && cantidadFinal === existente.cantidad) {
        return {
            ok: false,
            items,
            mensaje: `Ya tenés las ${existente.cantidad} unidades disponibles en el carrito.`
        };
    }

    const actualizados = existente
        ? items.map((item) => (item.idProducto === idProducto ? { ...item, cantidad: cantidadFinal } : item))
        : [
              ...items,
              {
                  idProducto,
                  nombre: producto.nombre ?? 'Producto',
                  precio: producto.precio ?? 0,
                  precioDescuento: producto.precioDescuento ?? null,
                  imagenUrl: producto.imagenUrl ?? null,
                  stock: stock,
                  idComercio: producto.idComercio ?? null,
                  nombreComercio: producto.nombreComercio ?? '',
                  cantidad: cantidadFinal
              }
          ];

    return guardarCarrito(actualizados);
}

/**
 * Cambia la cantidad de un producto ya presente en el carrito.
 * Las cantidades inválidas se descartan sin tocar lo guardado.
 */
export function cambiarCantidad(idProducto, cantidad) {
    const items = obtenerCarrito();
    const item = items.find((actual) => actual.idProducto === Number(idProducto));

    if (!item) {
        return { ok: false, items, mensaje: 'Ese producto ya no está en tu carrito.' };
    }

    const cantidadFinal = normalizarCantidad(cantidad, item.stock);

    if (cantidadFinal === null) {
        return { ok: false, items, mensaje: 'Escribí una cantidad de al menos 1.' };
    }

    // El tope de existencias se avisa, pero igual se guarda la cantidad máxima.
    const seTopo = typeof item.stock === 'number' && cantidadFinal < Math.floor(Number(cantidad));

    const resultado = guardarCarrito(
        items.map((actual) =>
            actual.idProducto === item.idProducto ? { ...actual, cantidad: cantidadFinal } : actual
        )
    );

    if (resultado.ok && seTopo) {
        return { ...resultado, mensaje: `Solo quedan ${item.stock} unidades de ${item.nombre}.` };
    }

    return resultado;
}

/** Saca un producto del carrito. */
export function eliminarItem(idProducto) {
    const items = obtenerCarrito();
    const restantes = items.filter((item) => item.idProducto !== Number(idProducto));

    if (restantes.length === items.length) {
        return { ok: false, items, mensaje: 'Ese producto ya no está en tu carrito.' };
    }

    return guardarCarrito(restantes);
}

/** Deja el carrito vacío. Se usa cuando la compra se guardó con éxito. */
export function vaciarCarrito() {
    return guardarCarrito([]);
}

/**
 * Suma de unidades, no de líneas: tres unidades de un mismo producto cuentan
 * como tres. Es lo que muestra el contador de la barra de navegación.
 */
export function contarUnidades(items) {
    if (!Array.isArray(items)) return 0;
    return items.reduce((total, item) => total + (Number(item.cantidad) || 0), 0);
}

/** Total a pagar según los precios guardados al momento de agregar. */
export function calcularTotal(items) {
    if (!Array.isArray(items)) return 0;
    return items.reduce((total, item) => total + precioVigente(item) * (Number(item.cantidad) || 0), 0);
}
