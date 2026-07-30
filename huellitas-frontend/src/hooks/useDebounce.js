import { useEffect, useState } from 'react';

/**
 * Devuelve una versión "retrasada" del valor: solo se actualiza cuando el
 * usuario deja de escribir durante `delay` milisegundos. Sirve para no
 * disparar una petición al backend por cada tecla.
 *
 * @param {*} valor  Valor que cambia rápido (ej: texto del input)
 * @param {number} delay  Milisegundos de espera (por defecto 400)
 */
export function useDebounce(valor, delay = 400) {
    const [valorRetrasado, setValorRetrasado] = useState(valor);

    useEffect(() => {
        const temporizador = setTimeout(() => setValorRetrasado(valor), delay);

        // Si el valor cambia antes de cumplirse el delay, se cancela el anterior.
        return () => clearTimeout(temporizador);
    }, [valor, delay]);

    return valorRetrasado;
}
