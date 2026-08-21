import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Receipt, CreditCard, Smartphone, Banknote } from 'lucide-react';

import ClienteLayout from '../../components/Cliente/ClienteLayout/ClienteLayout';
import { ToastContainer } from '../../components/Toast/Toast';
import { useToast } from '../../components/Toast/useToast';
import { obtenerMisOrdenes } from '../../api/ordenes';

/** Formato de plata de Costa Rica: ₡12.500,00 */
const enColones = (monto) => `₡${Number(monto || 0).toLocaleString('es-CR', { minimumFractionDigits: 2 })}`;

const ICONO_METODO = {
    tarjeta: CreditCard,
    sinpe: Smartphone,
    efectivo: Banknote
};

const NOMBRE_METODO = {
    tarjeta: 'Tarjeta',
    sinpe: 'SINPE Móvil',
    efectivo: 'Efectivo'
};

/**
 * Historial de compras del cliente ("Mis compras"). Cada orden muestra su
 * estado, fecha, total y método de pago (simulado), con acceso al recibo
 * completo de cada una.
 */
const MisCompras = () => {
    const [ordenes, setOrdenes] = useState([]);
    const [cargando, setCargando] = useState(false);
    const { toasts, showToast, removeToast } = useToast();
    const navigate = useNavigate();

    const obtenerToken = () => localStorage.getItem('token_huellitas') || localStorage.getItem('jwt') || localStorage.getItem('token');

    const cargarMisCompras = async () => {
        const token = obtenerToken();
        if (!token) return;

        try {
            setCargando(true);
            const lista = await obtenerMisOrdenes(token);
            setOrdenes(Array.isArray(lista) ? lista : []);
        } catch (error) {
            console.error(error);
            setOrdenes([]);
            showToast(error.message || 'Error al cargar tus compras.', 'error');
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        cargarMisCompras();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const formatearFecha = (fechaISO) => {
        if (!fechaISO) return 'Sin fecha';
        return new Date(fechaISO).toLocaleDateString('es-CR', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    return (
        <ClienteLayout activo="compras">
            <section className="dashboard-grid" style={{ gridTemplateColumns: '1fr' }}>
                <div className="content-card">
                    <div className="card-head">
                        <div>
                            <h2 className="card-title">Mis compras</h2>
                            <p className="card-subtitle">Historial de órdenes del marketplace y sus recibos.</p>
                        </div>
                    </div>

                    <div className="pet-list">
                        {cargando && <div className="appointment" style={{ display: 'block' }}>Cargando tus compras…</div>}
                        {!cargando && ordenes.length === 0 && (
                            <div className="appointment" style={{ display: 'block' }}>
                                Todavía no tenés compras registradas. Date una vuelta por el marketplace.
                            </div>
                        )}
                        {!cargando && ordenes.map((orden) => {
                            const IconoMetodo = ICONO_METODO[orden.metodoPago] || Receipt;
                            const nombreMetodo = NOMBRE_METODO[orden.metodoPago] || 'Sin especificar';

                            return (
                                <div className="pet-item" key={orden.idOrden}>
                                    <div className="pet-info">
                                        <div className="pet-icon"><Receipt size={22} color="#52B788" /></div>
                                        <div>
                                            <div className="pet-title">Orden #{orden.idOrden}</div>
                                            <div className="pet-detail">
                                                {formatearFecha(orden.fechaOrden)} · {orden.cantidadProductos}{' '}
                                                {orden.cantidadProductos === 1 ? 'producto' : 'productos'} · {enColones(orden.total)}
                                            </div>
                                            <div className="pet-detail" style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                                                <IconoMetodo size={13} /> {nombreMetodo}
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <span className="status-badge status-ok">{orden.estadoOrden || 'Completada'}</span>
                                        <button
                                            className="btn-soft"
                                            onClick={() => navigate(`/cliente/mis-compras/${orden.idOrden}`)}
                                            style={{ padding: '8px 12px' }}
                                        >
                                            Ver factura
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </ClienteLayout>
    );
};

export default MisCompras;
