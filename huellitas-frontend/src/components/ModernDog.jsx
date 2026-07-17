import React from 'react';

const ModernDog = ({ className = "" }) => {
  return (
    <svg 
      className={`modern-dog-svg ${className}`} 
      viewBox="0 0 200 200" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Sombra base (Fija en el suelo) */}
      <ellipse cx="100" cy="185" rx="55" ry="7" fill="rgba(27, 67, 50, 0.08)" />

      {/* GRUPO INTERACTIVO: Todo el perro reacciona al hover aquí */}
      <g className="dog-interactive-group">
        
        {/* 1. Orejas caídas (Capa más profunda) */}
        <ellipse cx="45" cy="115" rx="18" ry="35" transform="rotate(15 45 115)" fill="#F59E0B" className="dog-ear-l" />
        <ellipse cx="155" cy="115" rx="18" ry="35" transform="rotate(-15 155 115)" fill="#F59E0B" className="dog-ear-r" />

        {/* 2. Pañuelo / Bandana (Por debajo de la cabeza) */}
        <path d="M 55 130 Q 100 150 145 130 L 100 175 Z" fill="var(--mint)" />
        <path d="M 100 170 L 90 185 L 102 180 Z" fill="var(--pine-soft)" />
        <path d="M 100 170 L 110 185 L 98 180 Z" fill="var(--pine-soft)" />

        {/* 3. Cabeza Base (Redonda como en tu foto) */}
        <circle cx="100" cy="100" r="50" fill="#FBBF24" />

        {/* 4. Hocico (Crema) - Llega hasta y=145 */}
        <ellipse cx="100" cy="120" rx="35" ry="25" fill="#FEFCBF" />

        {/* 5. LENGUA - Nace justo en y=126 y baja hasta y=142. NUNCA sale del hocico */}
        <g className="dog-tongue-wrapper">
          <path d="M 92 126 C 92 142, 108 142, 108 126 Z" fill="#F472B6" />
          <path d="M 100 126 V 136" fill="none" stroke="#D53F8C" strokeWidth="2" strokeLinecap="round" />
        </g>

        {/* 6. Líneas de la boca - Se dibujan SOBRE la lengua para tapar el corte */}
        <path d="M 100 118 V 126 Q 112 132 122 122" fill="none" stroke="var(--pine-dk)" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M 100 118 V 126 Q 88 132 78 122" fill="none" stroke="var(--pine-dk)" strokeWidth="2.5" strokeLinecap="round" />

        {/* 7. Nariz Negra */}
        <ellipse cx="100" cy="112" rx="10" ry="6" fill="var(--pine-dk)" />
        <ellipse cx="103" cy="110" rx="3" ry="1.5" fill="#FFFFFF" opacity="0.8" />

        {/* 8. Ojos (Estilo minimalista) */}
        <g className="dog-eyes-group">
          <circle cx="75" cy="95" r="7" fill="var(--pine-dk)" />
          <circle cx="77" cy="93" r="2.5" fill="#FFFFFF" />
          
          <circle cx="125" cy="95" r="7" fill="var(--pine-dk)" />
          <circle cx="127" cy="93" r="2.5" fill="#FFFFFF" />
        </g>

        {/* 9. Cejas tiernas */}
        <path d="M 67 80 Q 75 75 83 80" fill="none" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" className="dog-brow" />
        <path d="M 133 80 Q 125 75 117 80" fill="none" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" className="dog-brow" />
      </g>

      {/* 10. Corazones flotantes (Invisibles hasta que haces Hover) */}
      <g className="dog-hearts">
        <path d="M 20 50 A 6 6 0 0 1 32 50 A 6 6 0 0 1 44 50 Q 44 62 32 74 Q 20 62 20 50 Z" fill="#FF477E" className="heart-anim h1" />
        <path d="M 160 30 A 8 8 0 0 1 176 30 A 8 8 0 0 1 192 30 Q 192 46 176 62 Q 160 46 160 30 Z" fill="#FF477E" className="heart-anim h2" />
        <path d="M 140 70 A 4 4 0 0 1 148 70 A 4 4 0 0 1 156 70 Q 156 78 148 86 Q 140 78 140 70 Z" fill="#FF477E" className="heart-anim h3" />
      </g>
    </svg>
  );
};

export default ModernDog;