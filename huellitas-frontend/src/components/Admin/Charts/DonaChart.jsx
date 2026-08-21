import React from 'react';
import styles from './Charts.module.css';

// Gráfico de dona con conic-gradient (CSS puro, sin librerías) + leyenda con conteos y
// porcentajes. `segmentos` es [{ etiqueta, valor, color }].
const DonaChart = ({ segmentos }) => {
  const total = segmentos.reduce((acc, s) => acc + s.valor, 0);

  const gradiente = total === 0
    ? '#e2e8f0'
    : (() => {
        let acumulado = 0;
        return segmentos
          .filter((s) => s.valor > 0)
          .map((s) => {
            const inicio = (acumulado / total) * 360;
            acumulado += s.valor;
            const fin = (acumulado / total) * 360;
            return `${s.color} ${inicio}deg ${fin}deg`;
          })
          .join(', ');
      })();

  return (
    <div className={styles.donaWrap}>
      <div className={styles.dona} style={{ background: `conic-gradient(${gradiente})` }}>
        <div className={styles.donaHueco}>
          <span className={styles.donaTotal}>{total}</span>
          <span className={styles.donaTotalLabel}>total</span>
        </div>
      </div>
      <ul className={styles.donaLeyenda}>
        {segmentos.map((s) => (
          <li key={s.etiqueta}>
            <span className={styles.donaPunto} style={{ background: s.color }} />
            {s.etiqueta}: <strong>{s.valor}</strong>
            <span className={styles.donaPorcentaje}>{total ? Math.round((s.valor / total) * 100) : 0}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default DonaChart;
