import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import styles from './CustomSelect.module.css';

/**
 * Reemplazo genérico de un `<select>` nativo: un botón + un panel flotante
 * con las opciones, en el mismo lenguaje visual que ya usaban
 * `SelectorVeterinaria`/`PerfilMenu`/el mini-carrito (pine/mint, check en la
 * opción activa, panel con sombra y animación de entrada). Un `<select>`
 * nativo no se puede terminar de temar: el navegador dibuja la lista
 * desplegada con su propia UI (fondo blanco, resaltado azul del sistema),
 * sin importar cuánto CSS se le ponga al control cerrado — por eso se
 * reemplaza el control entero en vez de solo maquillarlo.
 *
 * Pensado como reemplazo directo de un `<select value={x} onChange={e =>
 * set(e.target.value)}>`: acá `onChange` recibe el valor ya resuelto (no un
 * evento), así que en la mayoría de los casos alcanza con `onChange={set}`.
 */
const CustomSelect = ({
  opciones = [], // [{ value, label }]
  value,
  onChange,
  placeholder = 'Seleccionar...',
  disabled = false,
  icono: Icono = null,
  className = '',
  style
}) => {
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

  const seleccionada = opciones.find((op) => String(op.value) === String(value));

  const elegir = (op) => {
    onChange(op.value);
    setAbierto(false);
  };

  return (
    <div className={`${styles.wrap} ${className}`} style={style} ref={contenedorRef}>
      <button
        type="button"
        className={styles.boton}
        onClick={() => !disabled && setAbierto((prev) => !prev)}
        disabled={disabled}
        aria-expanded={abierto}
      >
        {Icono && (
          <span className={styles.botonIcono}>
            <Icono size={15} />
          </span>
        )}
        <span className={seleccionada ? styles.botonTexto : styles.placeholder}>
          {seleccionada ? seleccionada.label : placeholder}
        </span>
        <ChevronDown
          size={15}
          className={`${styles.chevron} ${abierto ? styles.chevronAbierto : ''}`}
          aria-hidden="true"
        />
      </button>

      {abierto && (
        <div className={styles.panel}>
          {opciones.length === 0 ? (
            <div className={styles.vacio}>Sin opciones disponibles.</div>
          ) : (
            opciones.map((op) => {
              const activa = String(op.value) === String(value);
              return (
                <button
                  type="button"
                  key={op.value}
                  className={`${styles.opcion} ${activa ? styles.opcionActiva : ''}`}
                  onClick={() => elegir(op)}
                >
                  <span>{op.label}</span>
                  {activa && <Check size={15} className={styles.opcionCheck} aria-hidden="true" />}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default CustomSelect;
