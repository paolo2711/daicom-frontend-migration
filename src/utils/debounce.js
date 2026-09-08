// Espera a que el usuario deje de teclear antes de pegarle al backend.
// Estaba escrito a mano en cada lista que tiene buscador.
export function debounce(fn, ms = 350) {
  let id = null
  return (...args) => {
    clearTimeout(id)
    id = setTimeout(() => fn(...args), ms)
  }
}
