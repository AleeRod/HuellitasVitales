import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Lock, ShoppingCart } from 'lucide-react';
import { useCarrito } from '../../hooks/useCarrito';
import { ToastContainer } from '../../components/Toast/Toast';
import useToast from '../../components/Toast/useToast';
import FilaCarrito from '../../components/Carrito/FilaCarrito';
import { crearOrden } from '../../api/ordenes';
import styles from './Carrito.module.css';

/** Formato de plata de Costa Rica: ₡12.500,00 */
const enColones = (monto) => `₡${Number(monto || 0).toLocaleString('es-CR', { minimumFractionDigits: 2 })}`;

/**
 * Panel del carrito.
 *
 * Los productos se guardan en el navegador, así que cualquiera puede armar su
 * compra sin tener cuenta. La sesión se pide recién al momento de pagar.
 */
const Carrito = () => {
    const { items, unidades, total, guardando, mensajeError, cambiarCantidad, eliminar, vaciar, limpiarMensajeError } =
        useCarrito();
    const { toasts, showToast, removeToast } = useToast();
    const navigate = useNavigate();
    const [pagando, setPagando] = useState(false);

    // Los avisos del carrito (tope de existencias, fallos al guardar) se
    // muestran con el mismo componente de notificaciones del resto del sitio.
    useEffect(() => {
        if (!mensajeError) return;
        showToast(mensajeError, 'warning');
        limpiarMensajeError();
    }, [mensajeError, showToast, limpiarMensajeError]);

    const alEliminar = (idProducto) => {
        const producto = items.find((item) => item.idProducto === idProducto);
        const resultado = eliminar(idProducto);
        if (resultado.ok) showToast(`Quitamos ${producto?.nombre ?? 'el producto'} del carrito.`, 'success');
    };

    /**
     * Único momento en que hace falta tener cuenta. Si ya hay sesión, la compra
     * sigue de largo; si no, se manda a iniciar sesión y se vuelve al carrito,
     * que sigue guardado en el navegador.
     */
    const pagar = async () => {
        const token = localStorage.getItem('token_huellitas');

        if (!token) {
            showToast('Iniciá sesión para completar tu compra. Tu carrito te espera acá.', 'info');
            navigate('/login', { state: { volverA: '/carrito' } });
            return;
        }

        setPagando(true);

        try {
            const respuesta = await crearOrden(items, token);
            vaciar();
            showToast(
                `Listo, tu compra quedó registrada con el número ${respuesta?.orden?.idOrden ?? ''}.`.trim(),
                'success'
            );
        } catch (error) {
            showToast(error.message, 'error');
        } finally {
            setPagando(false);
        }
    };

    const vacio = items.length === 0;

    return (
        <div className={styles.pagina}>
            <ToastContainer toasts={toasts} removeToast={removeToast} />

            <div className={styles.contenedor}>
                <header className={styles.encabezado}>
                    <Link to="/marketplace" className={styles.volver}>
                        <ArrowLeft size={18} aria-hidden="true" />
                        Seguir comprando
                    </Link>

                    <h1 className={styles.titulo}>
                        <ShoppingCart size={26} aria-hidden="true" />
                        Tu carrito
                    </h1>

                    {!vacio && (
                        <p className={styles.resumenCantidad}>
                            {unidades} {unidades === 1 ? 'producto' : 'productos'}
                        </p>
                    )}
                </header>

                {vacio ? (
                    <div className={styles.vacio}>
                        <span className={styles.vacioIcono} aria-hidden="true">🛒</span>
                        <p className={styles.vacioTitulo}>Todavía no agregaste nada</p>
                        <p className={styles.vacioTexto}>
                            Date una vuelta por el marketplace y armá la compra para tu mascota.
                        </p>
                        <Link to="/marketplace" className={styles.vacioBoton}>
                            Ver productos
                        </Link>
                    </div>
                ) : (
                    <div className={styles.cuerpo}>
                        <ul className={styles.lista}>
                            {items.map((item) => (
                                <FilaCarrito
                                    key={item.idProducto}
                                    item={item}
                                    guardando={guardando.includes(item.idProducto)}
                                    onCambiarCantidad={cambiarCantidad}
                                    onEliminar={alEliminar}
                                />
                            ))}
                        </ul>

                        <aside className={styles.resumen}>
                            <h2 className={styles.resumenTitulo}>Resumen</h2>

                            <div className={styles.resumenLinea}>
                                <span>Productos</span>
                                <span>{unidades}</span>
                            </div>

                            <div className={styles.resumenTotal}>
                                <span>Total</span>
                                <span>{enColones(total)}</span>
                            </div>

                            <button
                                type="button"
                                className={styles.botonPagar}
                                onClick={pagar}
                                disabled={pagando}
                            >
                                {pagando ? (
                                    <>
                                        <Loader2 size={18} className={styles.girando} aria-hidden="true" />
                                        Guardando tu compra…
                                    </>
                                ) : (
                                    <>
                                        <Lock size={16} aria-hidden="true" />
                                        Completar compra
                                    </>
                                )}
                            </button>

                            <p className={styles.resumenNota}>
                                Para terminar la compra te vamos a pedir que iniciés sesión.
                            </p>
                        </aside>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Carrito;
