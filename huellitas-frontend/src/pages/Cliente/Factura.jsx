import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Printer, CreditCard, Smartphone, Banknote, Receipt } from 'lucide-react';

import ClienteLayout from '../../components/Cliente/ClienteLayout/ClienteLayout';
import { ToastContainer } from '../../components/Toast/Toast';
import { useToast } from '../../components/Toast/useToast';
import { obtenerFactura } from '../../api/ordenes';
import { resolverImagen } from '../../api/config';
import styles from './Factura.module.css';

/** Formato de plata de Costa Rica: ₡12.500,00 */
const enColones = (monto) => `₡${Number(monto || 0).toLocaleString('es-CR', { minimumFractionDigits: 2 })}`;

const ICONO_METODO = {
    tarjeta: CreditCard,
    sinpe: Smartphone,
    efectivo: Banknote
};

const NOMBRE_METODO = {
    tarjeta: 'Tarjeta (crédito o débito)',
    sinpe: 'SINPE Móvil',
    efectivo: 'Efectivo al recibir'
};

/**
 * Recibo/factura interna de una orden puntual. Es un comprobante de la
 * plataforma, no una factura electrónica fiscal: el checkout completo es una
 * simulación (no hay pasarela de pago real ni obligación ante Hacienda).
 *
 * Pensada para imprimirse: "Imprimir" abre el diálogo nativo del navegador y
 * el CSS de impresión oculta el sidebar/topbar del portal, dejando solo el
 * recibo en la hoja.
 */
const Factura = () => {
    const { idOrden } = useParams();
    const navigate = useNavigate();
    const { toasts, showToast, removeToast } = useToast();
    const [factura, setFactura] = useState(null);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('token_huellitas') || localStorage.getItem('jwt') || localStorage.getItem('token');
        if (!token) {
            setCargando(false);
            setError('Debés iniciar sesión para ver este recibo.');
            return;
        }

        let activo = true;
        setCargando(true);
        obtenerFactura(token, idOrden)
            .then((data) => {
                if (!activo) return;
                if (!data) {
                    setError('No encontramos esa compra.');
                } else {
                    setFactura(data);
                }
            })
            .catch((err) => {
                if (!activo) return;
                setError(err.message || 'No pudimos cargar el recibo.');
                showToast(err.message || 'No pudimos cargar el recibo.', 'error');
            })
            .finally(() => {
                if (activo) setCargando(false);
            });

        return () => { activo = false; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [idOrden]);

    const IconoMetodo = (factura && ICONO_METODO[factura.metodoPago]) || Receipt;
    const nombreMetodo = (factura && NOMBRE_METODO[factura.metodoPago]) || 'Sin especificar';

    return (
        <ClienteLayout activo="compras" titulo="Recibo de compra" subtitulo="Detalle completo de tu orden.">
            <div className={styles.acciones}>
                <button type="button" className={styles.botonVolver} onClick={() => navigate('/cliente/mis-compras')}>
                    <ArrowLeft size={16} aria-hidden="true" /> Volver a mis compras
                </button>
                {factura && (
                    <button type="button" className={styles.botonImprimir} onClick={() => window.print()}>
                        <Printer size={16} aria-hidden="true" /> Imprimir
                    </button>
                )}
            </div>

            {cargando && <div className={styles.estado}>Cargando recibo…</div>}
            {!cargando && error && <div className={styles.estado}>{error}</div>}

            {!cargando && factura && (
                <div className={styles.facturaCard}>
                    <div className={styles.encabezado}>
                        <div className={styles.marca}>
                            <img src="/Imagenes/logo-huellitas.png" alt="Huellitas Vitales" className={styles.logo} />
                            <div>
                                <p className={styles.marcaNombre}>Huellitas Vitales</p>
                                <p className={styles.marcaTexto}>Recibo de compra — comprobante interno</p>
                            </div>
                        </div>
                        <div className={styles.numeroOrden}>
                            <span>Orden</span>
                            <strong>#{factura.idOrden}</strong>
                        </div>
                    </div>

                    <div className={styles.datosGrid}>
                        <div>
                            <p className={styles.datoLabel}>Cliente</p>
                            <p className={styles.datoValor}>{factura.nombreCliente}</p>
                            <p className={styles.datoSub}>{factura.correoCliente}</p>
                        </div>
                        <div>
                            <p className={styles.datoLabel}>Fecha</p>
                            <p className={styles.datoValor}>
                                {new Date(factura.fechaOrden).toLocaleDateString('es-CR', { day: '2-digit', month: 'long', year: 'numeric' })}
                            </p>
                            <p className={styles.datoSub}>
                                {new Date(factura.fechaOrden).toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>
                        <div>
                            <p className={styles.datoLabel}>Método de pago</p>
                            <p className={styles.datoValor} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <IconoMetodo size={15} /> {nombreMetodo}
                            </p>
                            <span className={styles.estadoBadge}>{factura.estadoOrden}</span>
                        </div>
                    </div>

                    <div className={styles.tablaWrap}>
                        <table className={styles.tabla}>
                            <thead>
                                <tr>
                                    <th>Producto</th>
                                    <th>Cantidad</th>
                                    <th>Precio unitario</th>
                                    <th>Subtotal</th>
                                </tr>
                            </thead>
                            <tbody>
                                {factura.items.map((item) => (
                                    <tr key={item.idProducto}>
                                        <td>
                                            <div className={styles.filaProducto}>
                                                <div className={styles.miniImagenCaja}>
                                                    {item.imagenUrl ? (
                                                        <img src={resolverImagen(item.imagenUrl)} alt="" className={styles.miniImagen} />
                                                    ) : (
                                                        <span aria-hidden="true">🐾</span>
                                                    )}
                                                </div>
                                                <span>{item.nombreProducto}</span>
                                            </div>
                                        </td>
                                        <td>{item.cantidad}</td>
                                        <td>{enColones(item.precioUnitario)}</td>
                                        <td>{enColones(item.subtotal)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className={styles.totalFila}>
                        <span>Total pagado</span>
                        <span className={styles.totalMonto}>{enColones(factura.total)}</span>
                    </div>

                    <p className={styles.pie}>
                        Este comprobante es una simulación interna de Huellitas Vitales — no constituye una
                        factura electrónica fiscal.
                    </p>
                </div>
            )}

            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </ClienteLayout>
    );
};

export default Factura;
