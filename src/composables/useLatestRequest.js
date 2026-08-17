// src/composables/useLatestRequest.js
/**
 * Para cuando se solapan varias cargas de una tabla (montaje + filtro + recarga
 * por WS + busqueda enlazada). Sin esto la respuesta que llega ultima gana aunque
 * sea la mas vieja, y te pisa el resultado bueno. Aca solo se aplica la mas reciente.
 *
 * Uso (sirve con async o con .then):
 *   const { begin, isLatest } = useLatestRequest()
 *   const cargar = async () => {
 *     const token = begin()
 *     const res = await Servicio.getAll(...)
 *     if (!isLatest(token)) return          // llego una mas nueva, descartar
 *     items.value = res.data.results
 *   }
 */
export function useLatestRequest() {
  let seq = 0
  const begin = () => ++seq
  const isLatest = (token) => token === seq
  return { begin, isLatest }
}
