import React from 'react';
import { AlertTriangle, HelpCircle } from 'lucide-react';
import styles from './ConfirmModal.module.css';

// Modal de confirmación genérico y reutilizable — reemplaza los window.confirm() nativos
// (el diálogo gris feo del navegador, sin estilo posible) que quedaban repartidos por varios
// paneles. Se usa junto con el hook useConfirm (mismo directorio).
const ConfirmModal = ({
  abierto,
  titulo,
  mensaje,
  textoConfirmar = 'Confirmar',
  textoCancelar = 'Cancelar',
  variante = 'peligro', // 'peligro' | 'normal'
  procesando = false,
  onCancelar,
  onConfirmar
}) => {
  if (!abierto) return null;

  const Icono = variante === 'peligro' ? AlertTriangle : HelpCircle;

  return (
    <div className={styles.overlay} onClick={() => !procesando && onCancelar()}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <span className={variante === 'peligro' ? styles.iconoPeligro : styles.iconoNormal}>
            <Icono size={20} />
          </span>
          <h3>{titulo}</h3>
        </div>

        <p className={styles.mensaje}>{mensaje}</p>

        <div className={styles.footer}>
          <button type="button" className={styles.btnSecundario} onClick={onCancelar} disabled={procesando}>
            {textoCancelar}
          </button>
          <button
            type="button"
            className={variante === 'peligro' ? styles.btnPeligro : styles.btnPrimario}
            onClick={onConfirmar}
            disabled={procesando}
          >
            {procesando ? 'Procesando…' : textoConfirmar}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
