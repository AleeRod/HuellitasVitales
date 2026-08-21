import React, { useCallback, useState } from 'react';
import ConfirmModal from './ConfirmModal';

// Hook que reemplaza el patrón window.confirm(...) que se lo comía todo el proyecto: en vez de
// bloquear con un diálogo nativo del navegador, pedirConfirmacion() abre un modal propio y
// ejecuta onConfirmar() recién si el usuario confirma. Uso típico:
//
//   const { pedirConfirmacion, ConfirmacionModal } = useConfirm();
//   ...
//   pedirConfirmacion({
//     titulo: 'Desactivar empleado',
//     mensaje: `¿Desactivar a ${nombre}? Ya no podrá operar en este comercio.`,
//     textoConfirmar: 'Sí, desactivar',
//     onConfirmar: async () => { await hacerLoQueSea(); }
//   });
//   ...
//   return (<>...{ConfirmacionModal}</>);
export function useConfirm() {
  const [estado, setEstado] = useState(null); // opciones pasadas a pedirConfirmacion, o null
  const [procesando, setProcesando] = useState(false);

  const pedirConfirmacion = useCallback((opciones) => {
    setEstado(opciones);
  }, []);

  const cerrar = useCallback(() => {
    if (procesando) return;
    setEstado(null);
  }, [procesando]);

  const confirmar = useCallback(async () => {
    if (!estado) return;
    setProcesando(true);
    try {
      await estado.onConfirmar();
      setEstado(null);
    } catch (err) {
      // Si onConfirmar no atrapó su propio error, no lo tragamos en silencio — se deja el
      // modal abierto para que quien llama decida (normalmente ya muestra su propio toast).
      console.error('Error al confirmar la acción:', err);
    } finally {
      setProcesando(false);
    }
  }, [estado]);

  const ConfirmacionModal = (
    <ConfirmModal
      abierto={!!estado}
      titulo={estado?.titulo}
      mensaje={estado?.mensaje}
      textoConfirmar={estado?.textoConfirmar}
      textoCancelar={estado?.textoCancelar}
      variante={estado?.variante}
      procesando={procesando}
      onCancelar={cerrar}
      onConfirmar={confirmar}
    />
  );

  return { pedirConfirmacion, ConfirmacionModal };
}
