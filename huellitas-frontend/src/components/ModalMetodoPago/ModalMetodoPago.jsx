import React, { useState } from 'react';
import { X, CreditCard, Smartphone, Banknote, Lock, ShieldCheck, Loader2 } from 'lucide-react';
import styles from './ModalMetodoPago.module.css';

/** Formato de plata de Costa Rica: ₡12.500,00 */
const enColones = (monto) => `₡${Number(monto || 0).toLocaleString('es-CR', { minimumFractionDigits: 2 })}`;

const METODOS = [
    { id: 'tarjeta', nombre: 'Tarjeta', icono: CreditCard },
    { id: 'sinpe', nombre: 'SINPE Móvil', icono: Smartphone },
    { id: 'efectivo', nombre: 'Efectivo', icono: Banknote }
];

/** Deja solo dígitos, los agrupa de a 4 y tapa a 16 dígitos (formato de tarjeta). */
const formatearNumeroTarjeta = (valor) => {
    const soloDigitos = valor.replace(/\D/g, '').slice(0, 16);
    return soloDigitos.replace(/(.{4})/g, '$1 ').trim();
};

/** Formatea el vencimiento como MM/AA a medida que se escribe. */
const formatearVencimiento = (valor) => {
    const soloDigitos = valor.replace(/\D/g, '').slice(0, 4);
    if (soloDigitos.length <= 2) return soloDigitos;
    return `${soloDigitos.slice(0, 2)}/${soloDigitos.slice(2)}`;
};

/**
 * Simulación visual de un método de pago. No se conecta a ninguna pasarela
 * real ni cobra nada: es el paso que le da al checkout la sensación de un
 * pago de verdad antes de registrar la orden contra el backend.
 *
 * Se abre después de confirmar sesión (ya logueado, o recién completado el
 * registro rápido) y, al confirmar, dispara `onConfirmar`, que es quien de
 * verdad manda la orden al servidor.
 */
const ModalMetodoPago = ({ isOpen, onClose, total, unidades, procesando, onConfirmar }) => {
    const [metodo, setMetodo] = useState('tarjeta');
    const [tarjeta, setTarjeta] = useState({ nombre: '', numero: '', vencimiento: '', cvv: '' });
    const [telefonoSinpe, setTelefonoSinpe] = useState('');
    const [errores, setErrores] = useState({});

    if (!isOpen) return null;

    const cambiarTarjeta = (campo, valor) => {
        setTarjeta((actual) => ({ ...actual, [campo]: valor }));
        if (errores[campo]) setErrores((actual) => ({ ...actual, [campo]: null }));
    };

    const cambiarTelefono = (valor) => {
        setTelefonoSinpe(valor);
        if (errores.telefono) setErrores((actual) => ({ ...actual, telefono: null }));
    };

    const validar = () => {
        const nuevosErrores = {};

        if (metodo === 'tarjeta') {
            if (!tarjeta.nombre.trim()) nuevosErrores.nombre = 'Ingresá el nombre tal como aparece en la tarjeta.';
            if (tarjeta.numero.replace(/\s/g, '').length < 16) nuevosErrores.numero = 'El número debe tener 16 dígitos.';
            if (!/^\d{2}\/\d{2}$/.test(tarjeta.vencimiento)) nuevosErrores.vencimiento = 'Formato MM/AA.';
            if (!/^\d{3,4}$/.test(tarjeta.cvv)) nuevosErrores.cvv = 'CVV inválido.';
        }

        if (metodo === 'sinpe' && !/^\d{8}$/.test(telefonoSinpe.replace(/\D/g, ''))) {
            nuevosErrores.telefono = 'Ingresá un número de 8 dígitos.';
        }

        setErrores(nuevosErrores);
        return Object.keys(nuevosErrores).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (procesando || !validar()) return;
        await onConfirmar(metodo);
    };

    const cerrar = () => {
        if (procesando) return;
        onClose();
    };

    return (
        <div className={styles.overlay} onMouseDown={cerrar}>
            <div className={styles.modal} onMouseDown={(e) => e.stopPropagation()}>
                <button className={styles.closeBtn} onClick={cerrar} disabled={procesando} aria-label="Cerrar">
                    <X size={20} />
                </button>

                <div className={styles.modalHeader}>
                    <span className={styles.iconoLock}>
                        <Lock size={18} />
                    </span>
                    <h2 className={styles.titulo}>Método de pago</h2>
                    <p className={styles.subtitulo}>Elegí cómo simular tu pago para completar la compra.</p>
                </div>

                <div className={styles.metodos}>
                    {METODOS.map((m) => {
                        const Icono = m.icono;
                        const activo = metodo === m.id;
                        return (
                            <button
                                type="button"
                                key={m.id}
                                className={`${styles.metodoOpcion} ${activo ? styles.metodoActivo : ''}`}
                                onClick={() => setMetodo(m.id)}
                                disabled={procesando}
                            >
                                <Icono size={20} />
                                <span>{m.nombre}</span>
                            </button>
                        );
                    })}
                </div>

                <form onSubmit={handleSubmit} className={styles.formBody}>
                    {metodo === 'tarjeta' && (
                        <>
                            <div className={styles.tarjetaPreview}>
                                <div className={styles.tarjetaTop}>
                                    <span className={styles.tarjetaChip} aria-hidden="true" />
                                    <CreditCard size={22} />
                                </div>
                                <p className={styles.tarjetaNumeroPreview}>
                                    {tarjeta.numero || '•••• •••• •••• ••••'}
                                </p>
                                <div className={styles.tarjetaPreviewFila}>
                                    <span>{tarjeta.nombre.trim() ? tarjeta.nombre.toUpperCase() : 'NOMBRE APELLIDO'}</span>
                                    <span>{tarjeta.vencimiento || 'MM/AA'}</span>
                                </div>
                            </div>

                            <div className={styles.inputGroup}>
                                <label>Nombre en la tarjeta</label>
                                <input
                                    type="text"
                                    placeholder="Ej: Javier Powers"
                                    value={tarjeta.nombre}
                                    onChange={(e) => cambiarTarjeta('nombre', e.target.value)}
                                    className={errores.nombre ? styles.inputError : ''}
                                    disabled={procesando}
                                />
                                {errores.nombre && <span className={styles.errorText}>{errores.nombre}</span>}
                            </div>

                            <div className={styles.inputGroup}>
                                <label>Número de tarjeta</label>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    placeholder="0000 0000 0000 0000"
                                    value={tarjeta.numero}
                                    onChange={(e) => cambiarTarjeta('numero', formatearNumeroTarjeta(e.target.value))}
                                    className={errores.numero ? styles.inputError : ''}
                                    disabled={procesando}
                                />
                                {errores.numero && <span className={styles.errorText}>{errores.numero}</span>}
                            </div>

                            <div className={styles.filaDoble}>
                                <div className={styles.inputGroup}>
                                    <label>Vencimiento</label>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        placeholder="MM/AA"
                                        value={tarjeta.vencimiento}
                                        onChange={(e) => cambiarTarjeta('vencimiento', formatearVencimiento(e.target.value))}
                                        className={errores.vencimiento ? styles.inputError : ''}
                                        disabled={procesando}
                                    />
                                    {errores.vencimiento && <span className={styles.errorText}>{errores.vencimiento}</span>}
                                </div>

                                <div className={styles.inputGroup}>
                                    <label>CVV</label>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        placeholder="123"
                                        value={tarjeta.cvv}
                                        onChange={(e) => cambiarTarjeta('cvv', e.target.value.replace(/\D/g, '').slice(0, 4))}
                                        className={errores.cvv ? styles.inputError : ''}
                                        disabled={procesando}
                                    />
                                    {errores.cvv && <span className={styles.errorText}>{errores.cvv}</span>}
                                </div>
                            </div>
                        </>
                    )}

                    {metodo === 'sinpe' && (
                        <div className={styles.inputGroup}>
                            <label>Número de teléfono</label>
                            <input
                                type="tel"
                                placeholder="8888-8888"
                                value={telefonoSinpe}
                                onChange={(e) => cambiarTelefono(e.target.value)}
                                className={errores.telefono ? styles.inputError : ''}
                                disabled={procesando}
                            />
                            {errores.telefono && <span className={styles.errorText}>{errores.telefono}</span>}
                            <p className={styles.ayuda}>Simulamos el aviso que te llegaría al celular para aprobar el pago.</p>
                        </div>
                    )}

                    {metodo === 'efectivo' && (
                        <div className={styles.efectivoBox}>
                            <Banknote size={22} aria-hidden="true" />
                            <p>Pagás en efectivo cuando recibas tu pedido en la puerta.</p>
                        </div>
                    )}

                    <div className={styles.resumenPago}>
                        <span>{unidades} {unidades === 1 ? 'producto' : 'productos'}</span>
                        <span className={styles.resumenPagoTotal}>{enColones(total)}</span>
                    </div>

                    <button type="submit" className={styles.btnConfirmar} disabled={procesando}>
                        {procesando ? (
                            <>
                                <Loader2 size={18} className={styles.girando} aria-hidden="true" />
                                Procesando pago…
                            </>
                        ) : (
                            <>
                                <Lock size={16} aria-hidden="true" />
                                Confirmar y pagar {enColones(total)}
                            </>
                        )}
                    </button>

                    <p className={styles.footNota}>
                        <ShieldCheck size={14} aria-hidden="true" />
                        Simulación: no se hace ningún cobro real ni se guardan estos datos.
                    </p>
                </form>
            </div>
        </div>
    );
};

export default ModalMetodoPago;
