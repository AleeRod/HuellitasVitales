import React, { useState } from 'react';
import DogNav from '../../components/DogNav/DogNav';
import { ToastContainer } from '../../components/Toast/Toast';
import { useToast } from '../../components/Toast/useToast';
import styles from './SolicitudComercio.module.css';

// Estado inicial del formulario, separado para poder reutilizarlo al resetear
const ESTADO_INICIAL = {
    idUsuario: 1,
    idTipoPersona: 1, // 1 = Física, 2 = Jurídica
    identificacion: '',
    razonSocial: '',
    veterinaria: { activo: false, nombre: '', direccion: '', telefono: '' },
    almacen: { activo: false, nombre: '', direccion: '', telefono: '' }
};

const SolicitudComercio = () => {
    const { toasts, showToast, removeToast } = useToast();

    const [formData, setFormData] = useState(ESTADO_INICIAL);

    const handleInputChange = (e) => {
        const { name, type, checked } = e.target;
        let value = e.target.value;

        // --- VALIDACIONES EN TIEMPO REAL (FILTRO DE TECLADO) ---
        if (name.endsWith('.telefono')) {
            value = value.replace(/[^0-9]/g, '').slice(0, 8); // Solo números, max 8
        }
        if (name === 'identificacion') {
            value = value.replace(/[^0-9-]/g, '').slice(0, 20); // Solo números y guiones
        }
        if (name === 'razonSocial' || name.endsWith('.nombre')) {
            value = value.slice(0, 100);
        }
        if (name.endsWith('.direccion')) {
            value = value.slice(0, 200);
        }

        // --- GUARDADO EN EL ESTADO ---
        if (type === 'checkbox') {
            const [seccion, campo] = name.split('.');
            setFormData(prev => ({
                ...prev,
                [seccion]: { ...prev[seccion], [campo]: checked }
            }));
        } else if (name.includes('.')) {
            const [seccion, campo] = name.split('.');
            setFormData(prev => ({
                ...prev,
                [seccion]: { ...prev[seccion], [campo]: value }
            }));
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    // --- VALIDACIONES DE SINTAXIS (AL DAR CLIC EN ENVIAR) ---
    const validarFormulario = () => {
        if (!formData.identificacion.trim() || formData.identificacion.trim().length < 7) {
            showToast('La identificación no es válida (mínimo 7 caracteres).', 'warning');
            return false;
        }

        if (formData.idTipoPersona == 2 && !formData.razonSocial.trim()) {
            showToast('La Razón Social es obligatoria para Personas Jurídicas.', 'warning');
            return false;
        }

        if (!formData.veterinaria.activo && !formData.almacen.activo) {
            showToast('Debes registrar al menos un comercio (Veterinaria o Almacén).', 'warning');
            return false;
        }

        if (formData.veterinaria.activo) {
            const { nombre, direccion, telefono } = formData.veterinaria;
            if (!nombre.trim() || nombre.trim().length < 3) {
                showToast('El nombre de la veterinaria debe tener al menos 3 caracteres.', 'warning');
                return false;
            }
            if (!direccion.trim() || direccion.trim().length < 10) {
                showToast('Especifica una dirección más detallada para la veterinaria (mínimo 10 caracteres).', 'warning');
                return false;
            }
            if (telefono.length !== 8) {
                showToast('El teléfono de la veterinaria debe tener exactamente 8 dígitos.', 'warning');
                return false;
            }
        }

        if (formData.almacen.activo) {
            const { nombre, direccion, telefono } = formData.almacen;
            if (!nombre.trim() || nombre.trim().length < 3) {
                showToast('El nombre del almacén debe tener al menos 3 caracteres.', 'warning');
                return false;
            }
            if (!direccion.trim() || direccion.trim().length < 10) {
                showToast('Especifica una dirección más detallada para el almacén (mínimo 10 caracteres).', 'warning');
                return false;
            }
            if (telefono.length !== 8) {
                showToast('El teléfono del almacén debe tener exactamente 8 dígitos.', 'warning');
                return false;
            }
        }

        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validarFormulario()) return;

        const payload = {
            idUsuario: formData.idUsuario,
            idTipoPersona: parseInt(formData.idTipoPersona),
            identificacion: formData.identificacion.trim(),
            razonSocial: formData.idTipoPersona == 1 ? "" : formData.razonSocial.trim(),
            comercios: []
        };

        if (formData.veterinaria.activo) {
            payload.comercios.push({
                idTipoComercio: 1,
                nombreComercial: formData.veterinaria.nombre.trim(),
                direccion: formData.veterinaria.direccion.trim(),
                telefono: formData.veterinaria.telefono
            });
        }

        if (formData.almacen.activo) {
            payload.comercios.push({
                idTipoComercio: 2,
                nombreComercial: formData.almacen.nombre.trim(),
                direccion: formData.almacen.direccion.trim(),
                telefono: formData.almacen.telefono
            });
        }

        try {
            const res = await fetch('http://localhost:5010/api/comercio/solicitud', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (res.ok) {
                showToast(data.mensaje || 'Solicitud enviada con éxito.', 'success');
                // Ya no navega a otra página: solo limpia el formulario para
                // que el usuario pueda registrar otro comercio si lo desea.
                setFormData(ESTADO_INICIAL);
            } else {
                showToast(data.mensaje || 'No se pudo procesar la solicitud.', 'error');
            }
        } catch (error) {
            showToast('Error de conexión con el servidor.', 'error');
        }
    };

    return (
        <>
            {/* COMPONENTE DE NAVEGACIÓN ANIMADO */}
            <DogNav />

            {/* Pila de notificaciones (éxito, error, advertencia) */}
            <ToastContainer toasts={toasts} removeToast={removeToast} />

            <main className={styles.solicitudLayout}>
                <div className={styles.formContainer}>

                    <div className={styles.cardHead}>
                        <span className={styles.heroBadge}>🚀 Nueva Afiliación</span>
                        <h2 className={styles.cardTitle}>Registro de Comercios</h2>
                        <p className={styles.cardSubtitle}>Únete a la red de Huellitas Vitales como socio comercial.</p>
                    </div>

                    <form onSubmit={handleSubmit} className={styles.formArea}>

                        {/* SECCIÓN: Información Legal */}
                        <div className={styles.sectionTitle}>Datos Legales</div>
                        <div className={styles.panelGrid}>
                            <div className={styles.inputGroup}>
                                <label className="form-label">Identificación (Cédula)</label>
                                <input type="text" name="identificacion" value={formData.identificacion} className="form-control" onChange={handleInputChange} placeholder="Ej: 1-1234-5678 o 3-101-XXXXXX" />
                            </div>
                            <div className={styles.inputGroup}>
                                <label className="form-label">Tipo de Persona</label>
                                <select name="idTipoPersona" value={formData.idTipoPersona} className="form-select" onChange={handleInputChange}>
                                    <option value={1}>Física</option>
                                    <option value={2}>Jurídica</option>
                                </select>
                            </div>

                            {/* Razón Social se oculta/muestra dinámicamente */}
                            {formData.idTipoPersona == 2 && (
                                <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                                    <label className="form-label">Razón Social</label>
                                    <input type="text" name="razonSocial" value={formData.razonSocial} className="form-control" onChange={handleInputChange} placeholder="Nombre legal de la empresa" />
                                </div>
                            )}
                        </div>

                        <div style={{ margin: '2.5rem 0' }}></div>

                        {/* SECCIÓN: Tipos de Comercio */}
                        <div className={styles.sectionTitle}>Tipos de Servicio a Registrar</div>

                        {/* Veterinaria */}
                        <div className={`${styles.comercioToggleBox} ${formData.veterinaria.activo ? styles.comercioToggleBoxActive : ''}`}>
                            <label className={styles.toggleLabel}>
                                <input type="checkbox" name="veterinaria.activo" checked={formData.veterinaria.activo} onChange={handleInputChange} className={styles.customCheckbox} />
                                <span className={styles.toggleText}>Clínica Veterinaria</span>
                            </label>

                            {formData.veterinaria.activo && (
                                <div className={`${styles.panelGrid} ${styles.nestedGrid}`}>
                                    <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                                        <label className="form-label">Nombre Comercial</label>
                                        <input type="text" name="veterinaria.nombre" value={formData.veterinaria.nombre} className="form-control" onChange={handleInputChange} placeholder="Nombre de la clínica" />
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <label className="form-label">Dirección Exacta</label>
                                        <input type="text" name="veterinaria.direccion" value={formData.veterinaria.direccion} className="form-control" onChange={handleInputChange} placeholder="Provincia, cantón, distrito y señas" />
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <label className="form-label">Teléfono</label>
                                        <input type="text" name="veterinaria.telefono" value={formData.veterinaria.telefono} className="form-control" onChange={handleInputChange} placeholder="Ej: 22334455" />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Almacén */}
                        <div className={`${styles.comercioToggleBox} ${formData.almacen.activo ? styles.comercioToggleBoxActive : ''}`}>
                            <label className={styles.toggleLabel}>
                                <input type="checkbox" name="almacen.activo" checked={formData.almacen.activo} onChange={handleInputChange} className={styles.customCheckbox} />
                                <span className={styles.toggleText}>Almacén / Tienda de Mascotas</span>
                            </label>

                            {formData.almacen.activo && (
                                <div className={`${styles.panelGrid} ${styles.nestedGrid}`}>
                                    <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                                        <label className="form-label">Nombre Comercial</label>
                                        <input type="text" name="almacen.nombre" value={formData.almacen.nombre} className="form-control" onChange={handleInputChange} placeholder="Nombre del Pet Shop" />
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <label className="form-label">Dirección Exacta</label>
                                        <input type="text" name="almacen.direccion" value={formData.almacen.direccion} className="form-control" onChange={handleInputChange} placeholder="Provincia, cantón, distrito y señas" />
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <label className="form-label">Teléfono</label>
                                        <input type="text" name="almacen.telefono" value={formData.almacen.telefono} className="form-control" onChange={handleInputChange} placeholder="Ej: 22334455" />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className={styles.submitBtnContainer}>
                            <button type="submit" className={`btn-main ${styles.submitBtn}`}>
                                Enviar Solicitud de Registro
                            </button>
                        </div>
                    </form>
                </div>
            </main>
        </>
    );
};

export default SolicitudComercio;