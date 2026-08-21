import { useState } from "react";
import { ToastContainer } from "../../Toast/Toast";
import { useToast } from "../../Toast/useToast";
import styles from "./PanelTiposServicio.module.css";

export default function PanelTiposServicio() {
  const { toasts, showToast, removeToast } = useToast();
  const [tipos, setTipos] = useState([
    { idTipoServicio: 1, nombre: "Consulta", activo: true },
    { idTipoServicio: 2, nombre: "Grooming", activo: true },
    { idTipoServicio: 3, nombre: "Procedimiento", activo: true },
  ]);
  const [nombreNuevo, setNombreNuevo] = useState("");

  const handleCrear = () => {
    const nombre = nombreNuevo.trim();
    if (!nombre) return;

    const existe = tipos.some(
      (t) => t.nombre.toLowerCase() === nombre.toLowerCase()
    );
    if (existe) {
      showToast("Ese tipo de servicio ya existe.", "warning");
      return;
    }

    const nuevoId = tipos.length
      ? Math.max(...tipos.map((t) => t.idTipoServicio)) + 1
      : 1;

    setTipos([...tipos, { idTipoServicio: nuevoId, nombre, activo: true }]);
    setNombreNuevo("");
  };

  const handleToggleActivo = (id) => {
    setTipos(
      tipos.map((t) =>
        t.idTipoServicio === id ? { ...t, activo: !t.activo } : t
      )
    );
  };

  return (
    <div className={styles.container}>
      <h2>Tipos de Servicio</h2>

      <div className={styles.formNuevo}>
        <input
          type="text"
          placeholder="Nuevo tipo (ej. Vacunación)"
          value={nombreNuevo}
          onChange={(e) => setNombreNuevo(e.target.value)}
        />
        <button onClick={handleCrear}>Agregar</button>
      </div>

      <ul className={styles.lista}>
        {tipos.map((t) => (
          <li
            key={t.idTipoServicio}
            className={!t.activo ? styles.inactivo : ""}
          >
            <span>{t.nombre}</span>
            <button onClick={() => handleToggleActivo(t.idTipoServicio)}>
              {t.activo ? "Desactivar" : "Activar"}
            </button>
          </li>
        ))}
      </ul>

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}