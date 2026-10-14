// Lo que esta en desarrollo se marca beta: una ruta con `meta: { beta: true }`
// o una entrada del menu con `beta: true`. Solo se ve con VITE_BETA=true (el
// .env de cada entorno); el build del server no la lleva, asi que ahi ni la
// pestaña ni la ruta existen.
const VER_BETA = import.meta.env.VITE_BETA === 'true'

export const esBeta = (item) => Boolean(item?.meta?.beta ?? item?.beta)

// La lista sin lo beta, en todos sus niveles. Con VER_BETA queda igual.
export const sinBeta = (lista) => (VER_BETA ? lista : lista
  .filter(item => !esBeta(item))
  .map(item => (item.children ? { ...item, children: sinBeta(item.children) } : item)))
