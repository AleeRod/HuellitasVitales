import React from 'react';
import { Dog, Cat, PawPrint } from 'lucide-react';
import styles from './MascotaChips.module.css';

const iconoPara = (especie) => {
  const valor = (especie || '').toLowerCase();
  if (valor.includes('gato')) return Cat;
  if (valor.includes('perro')) return Dog;
  return PawPrint;
};

// Selector de mascota como chips en vez de un <select> plano — todas las páginas del
// expediente (atención externa, traslado, emergencia) empiezan eligiendo una mascota, así que
// vale la pena que se sienta igual de bien en las tres en vez de un dropdown genérico.
const MascotaChips = ({ mascotas, valor, onSeleccionar }) => {
  if (!mascotas || mascotas.length === 0) {
    return <p className={styles.vacio}>No tenés mascotas registradas todavía.</p>;
  }

  return (
    <div className={styles.wrap}>
      {mascotas.map((m) => {
        const id = m.idMascota ?? m.IdMascota;
        const nombre = m.nombre ?? m.Nombre;
        const especie = m.especie ?? m.Especie;
        const Icon = iconoPara(especie);
        const activo = String(valor) === String(id);

        return (
          <button
            type="button"
            key={id}
            className={`${styles.chip} ${activo ? styles.chipActivo : ''}`}
            onClick={() => onSeleccionar(id)}
          >
            <span className={styles.avatar}><Icon size={16} /></span>
            {nombre}
          </button>
        );
      })}
    </div>
  );
};

export default MascotaChips;
