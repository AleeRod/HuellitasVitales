import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Lock, ShoppingCart } from 'lucide-react';
import { useCarrito } from '../../hooks/useCarrito';
import { ToastContainer } from '../../components/Toast/Toast';
import useToast from '../../components/Toast/useToast';
import FilaCarrito from '../../components/Carrito/FilaCarrito';
import ModalRegistroRapido from '../../components/ModalRegistroRapido/ModalRegistroRapido'; // Ajusta la ruta si difiere en tu carpeta
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
    
    // Estado para controlar la visibilidad del modal de registro rápido
    const [modalRegistroAbierto, setModalRegistroAbierto] = useState(false);

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
     * Función principal para procesar la orden tras validar token o tras registro rápido.
     */
    const procesarCompra = async (tokenUsuario) => {
        setPagando(true);

        try {
            const respuesta = await crearOrden(items, tokenUsuario);
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

    /**
     * Al dar clic en 'Completar compra': Si no hay token, abre el modal de registro rápido.
     */
    const pagar = () => {
        const token = localStorage.getItem('token_huellitas');

        if (!token) {
            setModalRegistroAbierto(true);
            return;
        }

        procesarCompra(token);
    };

    /**
     * Callback invocado por ModalRegistroRapido cuando el registro es exitoso.
     */
    const alCompletarRegistroRapido = () => {
        setModalRegistroAbierto(false);
        const nuevoToken = localStorage.getItem('token_huellitas');
        procesarCompra(nuevoToken);
    };

    const vacio = items.length === 0;

    return (
        <div className={styles.pagina}>
            <ToastContainer toasts={toasts} removeToast={removeToast} />

            {/* Modal de Registro Rápido */}
            <ModalRegistroRapido
                isOpen={modalRegistroAbierto}
                onClose={() => setModalRegistroAbierto(false)}
                onRegistroExitoso={alCompletarRegistroRapido}
            />

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