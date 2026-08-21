import React from 'react';
import { FileText } from 'lucide-react';
import styles from './ExpedienteBadge.module.css';

const formatFecha = (fechaISO) => {
  if (!fechaISO) return '-';
  return new Date(fechaISO).toLocaleDateString('es-CR', { day: '2-digit', month: 'long', year: 'numeric' });
};

// Tarjeta compacta con la info del expediente vigente — se repetía como texto suelto en las
// tres páginas (atención externa, traslado, emergencia), cada una a su manera. Ahora es un solo
// componente, y siempre muestra el nombre real de la veterinaria (viene de GET
// /api/expediente/{id}, no del GET /api/expediente/mascota/{id} inicial que solo trae el id).
const ExpedienteBadge = ({ detalle, cargando }) => {
  if (cargando) return <div className={styles.cargando}>Cargando expediente…</div>;
  if (!detalle) return null;

  return (
    <div className={styles.card}>
      <div className={styles.icono}><FileText size={20} /></div>
      <div className={styles.info}>
        <span className={styles.titulo}>Expediente de {detalle.nombreMascota}</span>
        <span className={styles.meta}>
          Veterinaria actual: {detalle.nombreComercioActual || 'Sin asignar'} · Abierto el {formatFecha(detalle.fechaApertura)}
        </span>
      </div>
    </div>
  );
};

export default ExpedienteBadge;
