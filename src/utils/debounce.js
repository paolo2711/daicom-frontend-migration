// Espera a que el usuario deje de teclear.
// `ya()` hace en el acto lo que quedo esperando; `cancelar()` lo descarta.
export function debounce(fn, ms = 350) {
  let id = null
  let pendiente = null
  const ya = () => {
    clearTimeout(id)
    if (!pendiente) return
    const args = pendiente
    pendiente = null
    fn(...args)
  }
  const llamar = (...args) => {
    clearTimeout(id)
    pendiente = args
    id = setTimeout(ya, ms)
  }
  llamar.ya = ya
  llamar.cancelar = () => {
    clearTimeout(id)
    pendiente = null
  }
  return llamar
}
