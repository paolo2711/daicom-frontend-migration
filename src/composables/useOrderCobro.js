import { computed, ref, watch } from 'vue'

// Que orden muestra el panel de cobro de una lista de ordenes. Guarda el id y lee la fila de la lista, asi el
// panel ve sus marcas al recargar. `abierto` es el panel a pantalla completa en pantalla chica.
export function useOrderCobro (orders, seleccion) {
  const idEnCobro = ref(null)
  const foco = computed(() => orders.value.find(o => o.id === idEnCobro.value) || null)
  const abierto = ref(false)

  // Con una, el panel muestra esa; con varias, las marcadas.
  function abrirCobro (ordenes) {
    if (ordenes.length === 1) {
      seleccion.value = []
      idEnCobro.value = ordenes[0].id
    }
    abierto.value = true
  }
  const cerrarCobro = () => { idEnCobro.value = null }
  // El semaforo de la orden que ya esta en el panel lo suelta.
  const alSemaforo = (orden) => (idEnCobro.value === orden.id ? cerrarCobro() : abrirCobro([orden]))

  watch(() => foco.value || seleccion.value.length, (hay) => { if (!hay) abierto.value = false })

  return { foco, abierto, abrirCobro, cerrarCobro, alSemaforo }
}
