// Que le pasa a una fila en el modal de lote (BatchActionDialog).
export const HECHO = 'hecho'     // ya esta hecho, o listo para esta accion
export const BLOQUEA = 'bloquea' // no se puede
export const NEUTRO = 'neutro'   // ni una cosa ni la otra
export const AVISO = 'aviso'     // se puede, pero se pierde algo

// Color solo para lo que hay que mirar: lo que no se puede y lo que cambia algo.
const COLOR_POR_NIVEL = { [BLOQUEA]: 'error', [AVISO]: 'warning' }

export const colorDe = (nivel) => COLOR_POR_NIVEL[nivel] || 'grey'
