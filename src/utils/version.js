const mayor = (version) => String(version ?? '').split('.')[0]

// Dos versiones de un JSON con el mismo primer numero son del mismo formato: el segundo solo agrega campos.
export const mismoFormato = (una, otra) => mayor(una) === mayor(otra)
