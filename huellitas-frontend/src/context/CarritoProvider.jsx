import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CarritoContexto } from './carritoContexto';
import {
    EVENTO_CARRITO,
    agregarItem,
    calcularTotal,
    cambiarCantidad as guardarCantidad,
    contarUnidades,
    eliminarItem as quitarItem,
    normalizarCantidad,
    obtenerCarrito,
    vaciarCarrito
} from '../lib/carritoLocal';

/**
 * Estado compartido del carrito.
 *
 * Existe para que el contador de la barra de navegación y el panel del carrito
 * muestren siempre lo mismo: son pantallas distintas leyendo un solo estado,
 * así el contador se actualiza al editar o eliminar sin recargar la página.
 */

/** Espera antes de escribir en el navegador, para agrupar los clics seguidos. */
const RETARDO_GUARDADO = 400;

export const CarritoProvider = ({ children }) => {
    const [items, setItems] = useState(() => obtenerCarrito());
    const [guardando, setGuardando] = useState([]);
    const [mensajeError, setMensajeError] = useState(null);

    // Un temporizador por producto: subir la cantidad de un producto no debe
    // cancelar el guardado pendiente de otro.
    const temporizadores = useRef(new Map());

    const marcarGuardando = useCallback((idProducto, activo) => {
        setGuardando((previos) =>
            activo
                ? previos.includes(idProducto)
                    ? previos
                    : [...previos, idProducto]
                : previos.filter((id) => id !== idProducto)
        );
    }, []);

    // Refresca cuando el carrito cambia desde otro componente (por ejemplo al
    // agregar desde el marketplace) o desde otra pestaña abierta.
    useEffect(() => {
        const sincronizar = () => {
            // Si hay guardados pendientes, la pantalla ya muestra el valor nuevo
            // y pisarla haría "saltar" la cantidad hacia atrás.
            if (temporizadores.current.size > 0) return;
            setItems(obtenerCarrito());
        };

        const sincronizarOtraPestania = (evento) => {
            if (evento.key === null || evento.key === 'carrito_huellitas') sincronizar();
        };

        window.addEventListener(EVENTO_CARRITO, sincronizar);
        window.addEventListener('storage', sincronizarOtraPestania);

        return () => {
            window.removeEventListener(EVENTO_CARRITO, sincronizar);
            window.removeEventListener('storage', sincronizarOtraPestania);
        };
    }, []);

    // Al desmontar, guarda de una vez lo que quedó pendiente.
    useEffect(() => {
        const pendientes = temporizadores.current;
        return () => {
            pendientes.forEach((temporizador) => clearTimeout(temporizador));
            pendientes.clear();
        };
    }, []);

    // Devuelve el resultado para que la pantalla que agrega muestre el aviso.
    // No lo guarda en mensajeError: si no, el aviso saldría más tarde, al abrir
    // el panel del carrito, fuera de contexto.
    const agregar = useCallback((producto, cantidad = 1) => {
        const resultado = agregarItem(producto, cantidad);
        setItems(resultado.items);
        return resultado;
    }, []);

    /**
     * Cambia la cantidad mostrando el nuevo valor de inmediato y guardando un
     * momento después. Si el guardado falla, la fila vuelve al valor real.
     */
    const cambiarCantidad = useCallback(
        (idProducto, cantidad) => {
            const item = items.find((actual) => actual.idProducto === idProducto);
            if (!item) return { ok: false, mensaje: 'Ese producto ya no está en tu carrito.' };

            const cantidadFinal = normalizarCantidad(cantidad, item.stock);

            // Entrada inválida: no se toca nada de lo guardado.
            if (cantidadFinal === null) {
                return { ok: false, mensaje: 'Escribí una cantidad de al menos 1.' };
            }

            if (cantidadFinal === item.cantidad) return { ok: true };

            const cantidadPedida = Math.floor(Number(cantidad));
            if (cantidadFinal < cantidadPedida) {
                setMensajeError(`Solo quedan ${item.stock} unidades de ${item.nombre}.`);
            }

            setItems((previos) =>
                previos.map((actual) =>
                    actual.idProducto === idProducto ? { ...actual, cantidad: cantidadFinal } : actual
                )
            );
            marcarGuardando(idProducto, true);

            clearTimeout(temporizadores.current.get(idProducto));
            temporizadores.current.set(
                idProducto,
                setTimeout(() => {
                    temporizadores.current.delete(idProducto);
                    const resultado = guardarCantidad(idProducto, cantidadFinal);
                    marcarGuardando(idProducto, false);

                    if (!resultado.ok) {
                        setItems(resultado.items);
                        setMensajeError(resultado.mensaje ?? 'No pudimos guardar el cambio.');
                    }
                }, RETARDO_GUARDADO)
            );

            return { ok: true };
        },
        [items, marcarGuardando]
    );

    const eliminar = useCallback(
        (idProducto) => {
            // Un producto que se va no necesita esperar: se guarda de una.
            clearTimeout(temporizadores.current.get(idProducto));
            temporizadores.current.delete(idProducto);
            marcarGuardando(idProducto, true);

            const resultado = quitarItem(idProducto);
            setItems(resultado.items);
            marcarGuardando(idProducto, false);

            if (!resultado.ok && resultado.mensaje) setMensajeError(resultado.mensaje);
            return resultado;
        },
        [marcarGuardando]
    );

    const vaciar = useCallback(() => {
        temporizadores.current.forEach((temporizador) => clearTimeout(temporizador));
        temporizadores.current.clear();

        const resultado = vaciarCarrito();
        setItems(resultado.items);
        return resultado;
    }, []);

    const limpiarMensajeError = useCallback(() => setMensajeError(null), []);

    const valor = useMemo(
        () => ({
            items,
            unidades: contarUnidades(items),
            total: calcularTotal(items),
            guardando,
            mensajeError,
            agregar,
            cambiarCantidad,
            eliminar,
            vaciar,
            limpiarMensajeError
        }),
        [items, guardando, mensajeError, agregar, cambiarCantidad, eliminar, vaciar, limpiarMensajeError]
    );

    return <CarritoContexto.Provider value={valor}>{children}</CarritoContexto.Provider>;
};
