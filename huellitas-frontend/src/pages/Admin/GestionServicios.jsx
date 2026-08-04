import React, { useCallback, useEffect, useState } from 'react';
import {
    Plus, Pencil, Trash2, RotateCcw, X,
    Stethoscope, Scissors, Syringe, Clock, Loader2,
} from 'lucide-react';
import apiClient from '../../services/apiClient';
import { ToastContainer } from '../../components/Toast/Toast';
import { useToast } from '../../components/Toast/useToast';
import styles from './GestionServicios.module.css';

// Catálogo de tipos. Los ids deben coincidir con el enum TipoServicio del backend.
const TIPOS = [
    { id: 1, nombre: 'Consulta', Icono: Stethoscope },
    { id: 2, nombre: 'Grooming', Icono: Scissors },
    { id: 3, nombre: 'Procedimiento Quirúrgico', Icono: Syringe },
];

const tipoInfo = (id) => TIPOS.find((t) => t.id === Number(id)) ?? { id, nombre: 'Otro', Icono: Stethoscope };

const FORM_VACIO = { nombre: '', descripcion: '', duracionMinutos: 30, precio: 0, tipo: 1 };

const money = new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC', maximumFractionDigits: 2 });

const GestionServicios = () => {
    const { toasts, showToast, removeToast } = useToast();

    const [servicios, setServicios] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(false);

    const [modalAbierto, setModalAbierto] = useState(false);
    const [editandoId, setEditandoId] = useState(null); // null = creando
    const [form, setForm] = useState(FORM_VACIO);
    const [guardando, setGuardando] = useState(false);

    // ─── Carga de la lista de gestión (activos + inactivos) ───
    const cargar = useCallback(async () => {
        setCargando(true);
        setError(false);
        try {
            const data = await apiClient.get('/servicioveterinario/gestion');
            setServicios(data);
        } catch (e) {
            setError(true);
            showToast(e.message, 'error');
        } finally {
            setCargando(false);
        }
    }, [showToast]);

    useEffect(() => { cargar(); }, [cargar]);

    // ─── Apertura del modal ───
    const abrirCrear = () => {
        setEditandoId(null);
        setForm(FORM_VACIO);
        setModalAbierto(true);
    };

    const abrirEditar = (s) => {
        setEditandoId(s.idServicioVeterinario);
        setForm({
            nombre: s.nombre,
            descripcion: s.descripcion ?? '',
            duracionMinutos: s.duracionMinutos,
            precio: s.precio,
            tipo: s.tipo,
        });
        setModalAbierto(true);
    };

    const cerrarModal = () => {
        if (guardando) return;
        setModalAbierto(false);
    };

    const cambiarCampo = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    // ─── Validación de cliente (el backend valida de nuevo) ───
    const validar = () => {
        if (!form.nombre.trim() || form.nombre.trim().length < 3) {
            showToast('El nombre debe tener al menos 3 caracteres.', 'warning');
            return false;
        }
        const dur = Number(form.duracionMinutos);
        if (!Number.isFinite(dur) || dur < 5 || dur > 600) {
            showToast('La duración debe estar entre 5 y 600 minutos.', 'warning');
            return false;
        }
        const precio = Number(form.precio);
        if (!Number.isFinite(precio) || precio < 0) {
            showToast('El precio no puede ser negativo.', 'warning');
            return false;
        }
        return true;
    };

    const guardar = async (e) => {
        e.preventDefault();
        if (!validar()) return;

        const payload = {
            nombre: form.nombre.trim(),
            descripcion: form.descripcion.trim() || null,
            duracionMinutos: Number(form.duracionMinutos),
            precio: Number(form.precio),
            tipo: Number(form.tipo),
        };

        setGuardando(true);
        try {
            const resp = editandoId
                ? await apiClient.put(`/servicioveterinario/${editandoId}`, payload)
                : await apiClient.post('/servicioveterinario', payload);

            showToast(resp?.mensaje || 'Guardado con éxito.', 'success');
            setModalAbierto(false);
            await cargar();
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setGuardando(false);
        }
    };

    // ─── Desactivar (borrado lógico) / Reactivar ───
    const desactivar = async (s) => {
        if (!window.confirm(`¿Desactivar "${s.nombre}"? Dejará de aparecer al agendar citas nuevas.`)) return;
        try {
            const resp = await apiClient.delete(`/servicioveterinario/${s.idServicioVeterinario}`);
            showToast(resp?.mensaje || 'Servicio desactivado.', 'success');
            await cargar();
        } catch (err) {
            showToast(err.message, 'error');
        }
    };

    const reactivar = async (s) => {
        try {
            const resp = await apiClient.patch(`/servicioveterinario/${s.idServicioVeterinario}/reactivar`);
            showToast(resp?.mensaje || 'Servicio reactivado.', 'success');
            await cargar();
        } catch (err) {
            showToast(err.message, 'error');
        }
    };

    return (
        <div className={styles.layout}>
            <ToastContainer toasts={toasts} removeToast={removeToast} />

            <div className="container py-4">
                {/* Encabezado */}
                <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
                    <div>
                        <h1 className={styles.title}>Servicios de la clínica</h1>
                        <p className={styles.subtitle}>Configura el catálogo que se ofrece al agendar citas.</p>
                    </div>
                    <button className={`btn ${styles.btnPrimary}`} onClick={abrirCrear}>
                        <Plus size={18} /> Nuevo servicio
                    </button>
                </div>

                {/* Contenido */}
                {cargando ? (
                    <div className={styles.centered}>
                        <Loader2 className={styles.spin} size={28} /> <span>Cargando servicios…</span>
                    </div>
                ) : error ? (
                    <div className={styles.centered}>
                        <p>No se pudieron cargar los servicios.</p>
                        <button className="btn btn-outline-secondary btn-sm" onClick={cargar}>Reintentar</button>
                    </div>
                ) : servicios.length === 0 ? (
                    <div className={styles.emptyBox}>
                        <p className="mb-2">Aún no hay servicios registrados.</p>
                        <button className={`btn ${styles.btnPrimary}`} onClick={abrirCrear}>
                            <Plus size={18} /> Crear el primero
                        </button>
                    </div>
                ) : (
                    <div className={`table-responsive ${styles.tableCard}`}>
                        <table className="table align-middle mb-0">
                            <thead>
                                <tr>
                                    <th>Servicio</th>
                                    <th>Tipo</th>
                                    <th className="text-center">Duración</th>
                                    <th className="text-end">Precio</th>
                                    <th className="text-center">Estado</th>
                                    <th className="text-end">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {servicios.map((s) => {
                                    const { nombre: tNombre, Icono } = tipoInfo(s.tipo);
                                    return (
                                        <tr key={s.idServicioVeterinario} className={s.isActive ? '' : styles.filaInactiva}>
                                            <td>
                                                <div className={styles.nombre}>{s.nombre}</div>
                                                {s.descripcion && <div className={styles.desc}>{s.descripcion}</div>}
                                            </td>
                                            <td>
                                                <span className={styles.tipoBadge}>
                                                    <Icono size={14} /> {tNombre}
                                                </span>
                                            </td>
                                            <td className="text-center text-nowrap">
                                                <Clock size={14} className="me-1 opacity-50" />
                                                {s.duracionMinutos} min
                                            </td>
                                            <td className="text-end text-nowrap">{money.format(s.precio)}</td>
                                            <td className="text-center">
                                                <span className={s.isActive ? styles.badgeActivo : styles.badgeInactivo}>
                                                    {s.isActive ? 'Activo' : 'Inactivo'}
                                                </span>
                                            </td>
                                            <td className="text-end text-nowrap">
                                                <button
                                                    className="btn btn-sm btn-outline-secondary me-2"
                                                    title="Editar"
                                                    onClick={() => abrirEditar(s)}
                                                >
                                                    <Pencil size={15} />
                                                </button>
                                                {s.isActive ? (
                                                    <button
                                                        className="btn btn-sm btn-outline-danger"
                                                        title="Desactivar"
                                                        onClick={() => desactivar(s)}
                                                    >
                                                        <Trash2 size={15} />
                                                    </button>
                                                ) : (
                                                    <button
                                                        className="btn btn-sm btn-outline-success"
                                                        title="Reactivar"
                                                        onClick={() => reactivar(s)}
                                                    >
                                                        <RotateCcw size={15} />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ─── Modal de formulario (controlado por React, sin JS de Bootstrap) ─── */}
            {modalAbierto && (
                <>
                    <div className="modal fade show d-block" tabIndex="-1" role="dialog" onMouseDown={cerrarModal}>
                        <div
                            className="modal-dialog modal-dialog-centered"
                            role="document"
                            onMouseDown={(e) => e.stopPropagation()}
                        >
                            <div className="modal-content">
                                <form onSubmit={guardar}>
                                    <div className="modal-header">
                                        <h5 className="modal-title">
                                            {editandoId ? 'Editar servicio' : 'Nuevo servicio'}
                                        </h5>
                                        <button type="button" className="btn-close" aria-label="Cerrar" onClick={cerrarModal} />
                                    </div>

                                    <div className="modal-body">
                                        <div className="mb-3">
                                            <label className="form-label">Nombre</label>
                                            <input
                                                type="text"
                                                name="nombre"
                                                className="form-control"
                                                value={form.nombre}
                                                onChange={cambiarCampo}
                                                maxLength={120}
                                                placeholder="Ej: Consulta general"
                                                autoFocus
                                            />
                                        </div>

                                        <div className="mb-3">
                                            <label className="form-label">Descripción <span className="text-muted">(opcional)</span></label>
                                            <textarea
                                                name="descripcion"
                                                className="form-control"
                                                value={form.descripcion}
                                                onChange={cambiarCampo}
                                                maxLength={500}
                                                rows={2}
                                                placeholder="Detalle breve del servicio"
                                            />
                                        </div>

                                        <div className="row g-3">
                                            <div className="col-6">
                                                <label className="form-label">Tipo</label>
                                                <select name="tipo" className="form-select" value={form.tipo} onChange={cambiarCampo}>
                                                    {TIPOS.map((t) => (
                                                        <option key={t.id} value={t.id}>{t.nombre}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="col-6">
                                                <label className="form-label">Duración (min)</label>
                                                <input
                                                    type="number"
                                                    name="duracionMinutos"
                                                    className="form-control"
                                                    value={form.duracionMinutos}
                                                    onChange={cambiarCampo}
                                                    min={5}
                                                    max={600}
                                                    step={5}
                                                />
                                            </div>
                                            <div className="col-12">
                                                <label className="form-label">Precio (₡)</label>
                                                <input
                                                    type="number"
                                                    name="precio"
                                                    className="form-control"
                                                    value={form.precio}
                                                    onChange={cambiarCampo}
                                                    min={0}
                                                    step="0.01"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="modal-footer">
                                        <button type="button" className="btn btn-light" onClick={cerrarModal} disabled={guardando}>
                                            <X size={16} /> Cancelar
                                        </button>
                                        <button type="submit" className={`btn ${styles.btnPrimary}`} disabled={guardando}>
                                            {guardando ? <Loader2 className={styles.spin} size={16} /> : <Plus size={16} />}
                                            {editandoId ? ' Guardar cambios' : ' Crear servicio'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                    <div className="modal-backdrop fade show" />
                </>
            )}
        </div>
    );
};

export default GestionServicios;
