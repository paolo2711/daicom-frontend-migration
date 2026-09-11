// Memoria corta para las listas de los desplegables: clientes, laboratorios,
// catálogo de equipos. Vive en la pestaña y vence sola.
const VIDA = 60_000

const guardado = new Map()

export function leerCache(clave) {
  const dato = guardado.get(clave)
  if (!dato) return null
  if (Date.now() - dato.en > VIDA) {
    guardado.delete(clave)
    return null
  }
  return dato.valor
}

export function guardarCache(clave, valor) {
  guardado.set(clave, { valor, en: Date.now() })
}

// Tras crear o editar un registro, lo guardado de ese recurso ya no sirve.
export function olvidarCache(recurso) {
  for (const clave of [...guardado.keys()]) {
    if (clave.startsWith(`${recurso}|`)) guardado.delete(clave)
  }
}
