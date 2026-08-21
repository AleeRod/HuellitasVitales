    import React, { useEffect, useState } from "react";
    import {
    X,
    Plus,
    Search,
    UserPlus,
    Mail,
    Briefcase,
    CheckCircle,
    XCircle,
    Store,
    } from "lucide-react";
    import { API_BASE } from "../../../api/config";
    import { ToastContainer } from "../../Toast/Toast";
    import { useToast } from "../../Toast/useToast";
    import { useConfirm } from "../../ConfirmModal/useConfirm";
    import SelectorVeterinaria from "../../Cliente/SelectorVeterinaria/SelectorVeterinaria";
    import CustomSelect from "../../CustomSelect/CustomSelect";
    import styles from "./PanelEmpleados.module.css";

    const ESTADO = {
    CARGANDO: "cargando",
    OK: "ok",
    VACIO: "vacio",
    ERROR: "error",
    };

    // Función robusta para obtener el token, igual que en PanelServicios
    const obtenerToken = () => {
    return (
        localStorage.getItem("token_huellitas") ||
        localStorage.getItem("token") ||
        localStorage.getItem("huellitas_token") ||
        localStorage.getItem("jwt") ||
        ""
    );
    };

    const authHeaders = (conJson = false) => ({
    Authorization: `Bearer ${obtenerToken()}`,
    ...(conJson ? { "Content-Type": "application/json" } : {}),
    });

    function formatFecha(fechaISO) {
    if (!fechaISO) return "-";
    return new Date(fechaISO).toLocaleDateString("es-CR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
    }

    const PanelEmpleados = () => {
    const { toasts, showToast, removeToast } = useToast();
    const { pedirConfirmacion, ConfirmacionModal } = useConfirm();

    // Comercios del dueño logueado
    const [comercios, setComercios] = useState([]);
    const [idComercioSeleccionado, setIdComercioSeleccionado] = useState("");
    const [cargandoComercios, setCargandoComercios] = useState(true);

    // Empleados del comercio seleccionado
    const [empleados, setEmpleados] = useState([]);
    const [estado, setEstado] = useState(ESTADO.CARGANDO);

    // Catálogo de cargos
    const [cargos, setCargos] = useState([]);

    // Modal de vincular empleado
    const [modalAbierto, setModalAbierto] = useState(false);
    const [correoBusqueda, setCorreoBusqueda] = useState("");
    const [buscandoUsuario, setBuscandoUsuario] = useState(false);
    const [usuarioEncontrado, setUsuarioEncontrado] = useState(null);
    const [idCargoSeleccionado, setIdCargoSeleccionado] = useState("");
    const [errorModal, setErrorModal] = useState("");
    const [guardando, setGuardando] = useState(false);

    // ─── Carga inicial: comercios propios + catálogo de cargos ───
    useEffect(() => {
        cargarComercios();
        cargarCargos();
    }, []);

    // ─── Cada vez que cambia el comercio seleccionado, recarga empleados ───
    useEffect(() => {
        if (idComercioSeleccionado) {
        cargarEmpleados(idComercioSeleccionado);
        }
    }, [idComercioSeleccionado]);

    const cargarComercios = async () => {
        setCargandoComercios(true);
        try {
        const res = await fetch(`${API_BASE}/Comercio/mios`, {
            headers: authHeaders(),
        });
        if (!res.ok) throw new Error("No se pudieron cargar tus comercios");
        const data = await res.json();
        setComercios(data);
        if (data.length > 0) {
            setIdComercioSeleccionado(String(data[0].idComercio));
        } else {
            setEstado(ESTADO.VACIO);
        }
        } catch (err) {
        console.error(err);
        setEstado(ESTADO.ERROR);
        } finally {
        setCargandoComercios(false);
        }
    };

    const cargarCargos = async () => {
        try {
        const res = await fetch(`${API_BASE}/Cargo`, { headers: authHeaders() });
        if (!res.ok) throw new Error("No se pudo cargar el catálogo de cargos");
        const data = await res.json();
        setCargos(data);
        } catch (err) {
        console.error(err);
        }
    };

    const cargarEmpleados = async (idComercio) => {
        setEstado(ESTADO.CARGANDO);
        try {
        const res = await fetch(
            `${API_BASE}/ComercioFuncionario?idComercio=${idComercio}`,
            { headers: authHeaders() }
        );
        if (!res.ok) throw new Error("No se pudo cargar la lista de empleados");
        const data = await res.json();
        setEmpleados(data);
        setEstado(data.length === 0 ? ESTADO.VACIO : ESTADO.OK);
        } catch (err) {
        console.error(err);
        setEstado(ESTADO.ERROR);
        }
    };

    // ─── Modal: buscar/crear/cerrar ───
    const abrirModal = () => {
        setCorreoBusqueda("");
        setUsuarioEncontrado(null);
        setIdCargoSeleccionado("");
        setErrorModal("");
        setModalAbierto(true);
    };

    const cerrarModal = () => {
        setModalAbierto(false);
    };

    const buscarUsuario = async (e) => {
        e.preventDefault();
        const correo = correoBusqueda.trim();
        if (!correo) return;

        setBuscandoUsuario(true);
        setErrorModal("");
        setUsuarioEncontrado(null);
        try {
        const res = await fetch(
            `${API_BASE}/ComercioFuncionario/buscar-usuario?correo=${encodeURIComponent(correo)}`,
            { headers: authHeaders() }
        );
        const data = await res.json();

        if (!res.ok) {
            setErrorModal(data?.mensaje || "No se encontró ningún usuario con ese correo.");
            return;
        }
        setUsuarioEncontrado(data);
        } catch (err) {
        console.error(err);
        setErrorModal("Ocurrió un error al buscar el usuario.");
        } finally {
        setBuscandoUsuario(false);
        }
    };

    const vincularEmpleado = async () => {
        if (!usuarioEncontrado) {
        setErrorModal("Primero buscá y confirmá el usuario por correo.");
        return;
        }
        if (!idCargoSeleccionado) {
        setErrorModal("Seleccioná un cargo para el empleado.");
        return;
        }

        setGuardando(true);
        setErrorModal("");
        try {
        const res = await fetch(`${API_BASE}/ComercioFuncionario`, {
            method: "POST",
            headers: authHeaders(true),
            body: JSON.stringify({
            idComercio: Number(idComercioSeleccionado),
            correo: usuarioEncontrado.correo,
            idCargo: Number(idCargoSeleccionado),
            }),
        });
        const data = await res.json().catch(() => null);

        if (!res.ok) {
            throw new Error(data?.mensaje || "No se pudo vincular al empleado.");
        }

        cerrarModal();
        cargarEmpleados(idComercioSeleccionado);
        } catch (err) {
        setErrorModal(err.message);
        } finally {
        setGuardando(false);
        }
    };

    const cambiarEstadoEmpleado = (empleado) => {
        const nuevoEstado = !empleado.activo;
        pedirConfirmacion({
        titulo: nuevoEstado ? "Reactivar empleado" : "Desactivar empleado",
        mensaje: nuevoEstado
            ? `¿Reactivar a ${empleado.nombre} ${empleado.apellidos}?`
            : `¿Desactivar a ${empleado.nombre} ${empleado.apellidos}? Ya no podrá operar en este comercio.`,
        textoConfirmar: nuevoEstado ? "Sí, reactivar" : "Sí, desactivar",
        variante: nuevoEstado ? "normal" : "peligro",
        onConfirmar: async () => {
            try {
            const res = await fetch(
                `${API_BASE}/ComercioFuncionario/${empleado.idComercioFuncionario}/estado`,
                {
                method: "PUT",
                headers: authHeaders(true),
                body: JSON.stringify({ activo: nuevoEstado }),
                }
            );
            if (!res.ok) throw new Error("No se pudo actualizar el estado del empleado.");
            showToast(nuevoEstado ? "Empleado reactivado correctamente." : "Empleado desactivado correctamente.", "success");
            cargarEmpleados(idComercioSeleccionado);
            } catch (err) {
            console.error(err);
            showToast(err.message, "error");
            }
        }
        });
    };

    const comercioActual = comercios.find(
        (c) => String(c.idComercio) === String(idComercioSeleccionado)
    );

    // ─── Sin comercios aprobados: no hay nada que gestionar ───
    if (!cargandoComercios && comercios.length === 0) {
        return (
        <div className={styles.panel}>
            <div className={styles.estadoBox}>
            <Store size={32} color="#52B788" />
            <h3>No tenés comercios aprobados todavía</h3>
            <p>
                Una vez que tengas al menos un comercio aprobado, vas a poder
                registrar y gestionar sus empleados desde acá.
            </p>
            </div>
        </div>
        );
    }

    return (
        <div className={styles.panel}>
        <div className={styles.headerRow}>
            <div>
            <h2 className={styles.titulo}>Empleados</h2>
            <p className={styles.subtitulo}>
                Gestioná quién trabaja en tu comercio y qué cargo tiene.
            </p>
            </div>
            <button className={styles.btnNuevo} onClick={abrirModal}>
            <UserPlus size={18} />
            Registrar empleado
            </button>
        </div>

        {comercios.length > 1 && (
            <div className={styles.toolbar}>
            <div style={{ minWidth: '240px' }}>
                <SelectorVeterinaria
                opciones={comercios}
                valor={idComercioSeleccionado}
                onSeleccionar={setIdComercioSeleccionado}
                />
            </div>
            </div>
        )}

        {estado === ESTADO.CARGANDO && (
            <div className={styles.estadoBox}>Cargando empleados...</div>
        )}

        {estado === ESTADO.ERROR && (
            <div className={styles.estadoBox}>
            No pudimos cargar los empleados.{" "}
            <button
                onClick={() => cargarEmpleados(idComercioSeleccionado)}
                className={styles.linkBtn}
            >
                Reintentar
            </button>
            </div>
        )}

        {estado === ESTADO.VACIO && (
            <div className={styles.estadoBox}>
            <h3>Todavía no tenés empleados registrados</h3>
            <p>
                Vinculá a tu primer empleado en{" "}
                <strong>{comercioActual?.nombreComercial}</strong> buscándolo por
                su correo.
            </p>
            <button className={styles.btnNuevo} onClick={abrirModal}>
                <UserPlus size={18} />
                Registrar el primero
            </button>
            </div>
        )}

        {estado === ESTADO.OK && (
            <div className={styles.tableWrap}>
            <table className={styles.table}>
                <thead>
                <tr>
                    <th>Empleado</th>
                    <th>Correo</th>
                    <th>Cargo</th>
                    <th>Ingreso</th>
                    <th>Estado</th>
                    <th aria-label="Acciones"></th>
                </tr>
                </thead>
                <tbody>
                {empleados.map((emp) => (
                    <tr key={emp.idComercioFuncionario}>
                    <td>
                        <span className={styles.nombreEmpleado}>
                        {emp.nombre} {emp.apellidos}
                        </span>
                    </td>
                    <td>
                        <span className={styles.metaCell}>
                        <Mail size={14} />
                        {emp.correo}
                        </span>
                    </td>
                    <td>
                        <span className={styles.cargoBadge}>
                        <Briefcase size={14} />
                        {emp.cargo}
                        </span>
                    </td>
                    <td>
                        <span className={styles.metaCell}>
                        {formatFecha(emp.fechaIngreso)}
                        </span>
                    </td>
                    <td>
                        <span className={emp.activo ? styles.estadoOk : styles.estadoOff}>
                        {emp.activo ? "Activo" : "Inactivo"}
                        </span>
                    </td>
                    <td>
                        <button
                        className={emp.activo ? styles.iconBtnDanger : styles.iconBtn}
                        onClick={() => cambiarEstadoEmpleado(emp)}
                        title={emp.activo ? "Desactivar" : "Reactivar"}
                        >
                        {emp.activo ? <XCircle size={16} /> : <CheckCircle size={16} />}
                        </button>
                    </td>
                    </tr>
                ))}
                </tbody>
            </table>
            </div>
        )}

        {modalAbierto && (
            <div className={styles.overlay} onClick={cerrarModal}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                <h3>Registrar empleado</h3>
                <button className={styles.closeBtn} onClick={cerrarModal} aria-label="Cerrar">
                    <X size={20} />
                </button>
                </div>

                <div className={styles.modalBody}>
                <p className={styles.ayudaModal}>
                    El empleado debe tener ya una cuenta creada en Huellitas
                    Vitales. Buscalo por su correo para vincularlo.
                </p>

                <form onSubmit={buscarUsuario} className={styles.busquedaForm}>
                    <label className={styles.campo} style={{ flex: 1 }}>
                    <span>Correo del empleado</span>
                    <input
                        type="email"
                        value={correoBusqueda}
                        onChange={(e) => {
                        setCorreoBusqueda(e.target.value);
                        setUsuarioEncontrado(null);
                        }}
                        placeholder="empleado@correo.com"
                        required
                    />
                    </label>
                    <button
                    type="submit"
                    className={styles.btnSecundario}
                    disabled={buscandoUsuario}
                    >
                    <Search size={16} />
                    {buscandoUsuario ? "Buscando..." : "Buscar"}
                    </button>
                </form>

                {usuarioEncontrado && (
                    <div className={styles.usuarioEncontrado}>
                    <CheckCircle size={18} color="#2e7d32" />
                    <div>
                        <div className={styles.usuarioNombre}>
                        {usuarioEncontrado.nombre} {usuarioEncontrado.apellidos}
                        </div>
                        <div className={styles.usuarioCorreo}>
                        {usuarioEncontrado.correo}
                        </div>
                    </div>
                    </div>
                )}

                {usuarioEncontrado && (
                    <label className={styles.campo}>
                    <span>Cargo</span>
                    <CustomSelect
                        value={idCargoSeleccionado}
                        onChange={setIdCargoSeleccionado}
                        placeholder="Seleccione un cargo..."
                        opciones={cargos.map((c) => ({ value: c.idCargo, label: c.nombre }))}
                    />
                    </label>
                )}

                {errorModal && <p className={styles.errorMsg}>{errorModal}</p>}
                </div>

                <div className={styles.modalFooter}>
                <button className={styles.btnSecundario} onClick={cerrarModal} disabled={guardando}>
                    Cancelar
                </button>
                <button
                    className={styles.btnPrimario}
                    onClick={vincularEmpleado}
                    disabled={!usuarioEncontrado || guardando}
                >
                    <Plus size={16} />
                    {guardando ? "Vinculando..." : "Vincular empleado"}
                </button>
                </div>
            </div>
            </div>
        )}

        {ConfirmacionModal}
        <ToastContainer toasts={toasts} removeToast={removeToast} />
        </div>
    );
    };

    export default PanelEmpleados;