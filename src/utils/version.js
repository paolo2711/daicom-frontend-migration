const mayor = (version) => String(version ?? '').split('.')[0]

// La version de lo que guarda cada formulario (CURRENT_*_SCHEMA). Un campo nuevo sube el segundo numero; si cambia la
// forma de uno que ya estaba, en el o en sus filas, sube el primero y es otro formato.
export const mismoFormato = (una, otra) => mayor(una) === mayor(otra)
