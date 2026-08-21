import React, { useEffect, useRef, useState } from 'react';
import { Building2, ChevronDown, MapPin, Check } from 'lucide-react';
import styles from './SelectorVeterinaria.module.css';

// Dropdown a medida para elegir veterinaria — reemplaza el <select> nativo en los flujos de
// Emergencia/Traslado. Un <select> no puede mostrar nombre + ubicación por opción, ni tener su
// propio hover: el navegador dibuja la lista con su UI nativa (ver captura del bug reportado).
// Este componente sí controla cada fila, así que puede mostrar la dirección de cada veterinaria
// debajo del nombre para que el cliente elija con más contexto.
const SelectorVeterinaria = ({ opciones, valor, onSeleccionar, placeholder = 'Elegí una veterinaria...', deshabilitado = false }) => {
  const [abierto, setAbierto] = useState(false);
  const contenedorRef = useRef(null);

  useEffect(() => {
    const alHacerClickFuera = (e) => {
      if (contenedorRef.current && !contenedorRef.current.contains(e.target)) setAbierto(false);
    };
    document.addEventListener('mousedown', alHacerClickFuera);
    return () => document.removeEventListener('mousedown', alHacerClickFuera);
  }, []);

  useEffect(() => {
    const alPresionarEscape = (e) => {
      if (e.key === 'Escape') setAbierto(false);
    };
    document.addEventListener('keydown', alPresionarEscape);
    return () => document.removeEventListener('keydown', alPresionarEscape);
  }, []);

  const idDe = (op) => op.idComercio ?? op.IdComercio;
  const nombreDe = (op) => op.nombreComercial ?? op.NombreComercial;
  const direccionDe = (op) => op.direccion ?? op.Direccion;

  const seleccionada = opciones.find((op) => String(idDe(op)) === String(valor));

  const elegir = (op) => {
    onSeleccionar(String(idDe(op)));
    setAbierto(false);
  };

  return (
    <div className={styles.wrap} ref={contenedorRef}>
      <button
        type="button"
        className={styles.boton}
        onClick={() => !deshabilitado && setAbierto((prev) => !prev)}
        disabled={deshabilitado}
      >
        <span className={styles.botonIcono}><Building2 size={18} /></span>
        <span className={styles.botonTexto}>
          {seleccionada ? (
            <>
              <span className={styles.botonNombre}>{nombreDe(seleccionada)}</span>
              {direccionDe(seleccionada) && <span className={styles.botonDireccion}>{direccionDe(seleccionada)}</span>}
            </>
          ) : (
            <span className={styles.placeholder}>{placeholder}</span>
          )}
        </span>
        <ChevronDown size={16} className={`${styles.chevron} ${abierto ? styles.chevronAbierto : ''}`} />
      </button>

      {abierto && (
        <div className={styles.panel}>
          {opciones.length === 0 ? (
            <div className={styles.vacio}>No hay veterinarias disponibles.</div>
          ) : (
            opciones.map((op) => {
              const activa = String(idDe(op)) === String(valor);
              return (
                <button
                  type="button"
                  key={idDe(op)}
                  className={`${styles.opcion} ${activa ? styles.opcionActiva : ''}`}
                  onClick={() => elegir(op)}
                >
                  <span className={styles.opcionInfo}>
                    <span className={styles.opcionNombre}>{nombreDe(op)}</span>
                    {direccionDe(op) && (
                      <span className={styles.opcionDireccion}>
                        <MapPin size={12} /> {direccionDe(op)}
                      </span>
                    )}
                  </span>
                  {activa && <Check size={16} className={styles.opcionCheck} />}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default SelectorVeterinaria;
