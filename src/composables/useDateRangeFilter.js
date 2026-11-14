import { ref } from 'vue'

// El rango de DateRangeFilter: se elige en su menu y pasa a `filtros` (desde, hasta) recien al aplicarlo.
export function useDateRangeFilter (filtros) {
  const rango = ref({ desde: '', hasta: '' })
  const aplicarRango = () => Object.assign(filtros.value, rango.value)
  function limpiarRango () {
    rango.value = { desde: '', hasta: '' }
    aplicarRango()
  }
  return { rango, aplicarRango, limpiarRango }
}
