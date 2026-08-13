// src/composables/useLatestRequest.js
/**
 * Guard de secuencia para cargas que se solapan (race condition).
 *
 * Cuando una tabla dispara varias cargas casi a la vez (montaje + filtro +
 * recarga por WebSocket + búsqueda enlazada), la respuesta que llega ÚLTIMA gana,
 * aunque sea la más vieja — y pisa el resultado bueno. Este guard hace que solo
 * se aplique la respuesta de la carga MÁS RECIENTE; las viejas se descartan.
 *
 * Uso (sirve con async/await o con .then):
 *   const { begin, isLatest } = useLatestRequest()
 *   const cargar = async () => {
 *     const token = begin()
 *     const res = await Servicio.getAll(...)
 *     if (!isLatest(token)) return          // llegó una carga más nueva → descartar
 *     items.value = res.data.results
 *   }
 */
export function useLatestRequest() {
  let seq = 0
  const begin = () => ++seq
  const isLatest = (token) => token === seq
  return { begin, isLatest }
}
