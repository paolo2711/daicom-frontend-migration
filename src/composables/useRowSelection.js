import { computed, toValue } from 'vue'
import { seguirLaLista } from '@/composables/useCurrentRows'

// Las casillas de una tabla: `marcables`, las filas que se pueden marcar; `seleccion`, el ref de las marcadas.
export function useRowSelection (marcables, seleccion) {
  const esMarcable = (fila) => toValue(marcables).some(f => f.id === fila.id)
  const estaMarcada = (fila) => seleccion.value.some(f => f.id === fila.id)
  const todasMarcadas = computed(() => toValue(marcables).length > 0 && seleccion.value.length === toValue(marcables).length)
  const algunasMarcadas = computed(() => seleccion.value.length > 0 && !todasMarcadas.value)

  const marcarTodas = (si) => { seleccion.value = si ? [...toValue(marcables)] : [] }

  function alternar (fila) {
    if (!esMarcable(fila)) return
    seleccion.value = estaMarcada(fila) ? seleccion.value.filter(f => f.id !== fila.id) : [...seleccion.value, fila]
  }

  // Para el clic en la fila: los botones y las casillas hacen lo suyo.
  function alClicFila (event, fila) {
    if (!event.target.closest('button, a, .v-btn, .v-selection-control')) alternar(fila)
  }

  // Las que dejan de ser marcables o salen de la lista se desmarcan.
  seguirLaLista(marcables, seleccion)

  return { esMarcable, estaMarcada, todasMarcadas, algunasMarcadas, marcarTodas, alternar, alClicFila }
}
