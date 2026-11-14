import { onBeforeUnmount } from 'vue'

// Vuelve a llamar a una funcion cada tanto mientras SUNAT no responde; se corta al cerrar o desmontar.
export function usePolling (espera = 5000) {
  let pendiente = null
  const parar = () => clearTimeout(pendiente)
  const programar = (funcion) => {
    parar()
    pendiente = setTimeout(funcion, espera)
  }
  onBeforeUnmount(parar)
  return { programar, parar }
}
