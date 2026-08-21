import React from 'react';
import styles from './Charts.module.css';

// Gráfico de barras simple, sin librerías externas — cada barra crece proporcional al valor
// más alto de la serie. `datos` es [{ etiqueta, cantidad }].
const BarraChart = ({ datos, color = '#52B788' }) => {
  const max = Math.max(1, ...datos.map((d) => d.cantidad));

  if (datos.every((d) => d.cantidad === 0)) {
    return <p className={styles.sinDatos}>Todavía no hay datos suficientes para este período.</p>;
  }

  return (
    <div className={styles.barrasWrap}>
      {datos.map((d, i) => (
        <div className={styles.barraCol} key={`${d.etiqueta}-${i}`}>
          <div className={styles.barraValor}>{d.cantidad}</div>
          <div className={styles.barraPista}>
            <div
              className={styles.barra}
              style={{ height: `${Math.max(4, (d.cantidad / max) * 100)}%`, background: color }}
            />
          </div>
          <div className={styles.barraLabel}>{d.etiqueta}</div>
        </div>
      ))}
    </div>
  );
};

export default BarraChart;
