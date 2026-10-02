// Para los contadores que se refrescan con cada aviso del WebSocket.
// Un pedido a la vez, y mientras siguen llegando avisos, como mucho uno cada
// `ms`. El ultimo aviso siempre se atiende: lo que se muestra termina al dia.
//
// No es debounce: ese espera a que dejen de llegar, y con un lote que avisa
// durante un minuto la pantalla quedaria quieta todo ese minuto.
export function throttle(fn, ms = 3000) {
  let ultimo = 0
  let reloj = null
  let corriendo = false
  let pendiente = false

  async function correr() {
    reloj = null
    if (corriendo) {
      pendiente = true
      return
    }
    corriendo = true
    ultimo = Date.now()
    try {
      await fn()
    } catch {
      // El siguiente aviso lo vuelve a pedir.
    }
    corriendo = false
    if (pendiente) {
      pendiente = false
      programar()
    }
  }

  function programar() {
    if (reloj) return
    reloj = setTimeout(correr, Math.max(0, ultimo + ms - Date.now()))
  }

  return programar
}
