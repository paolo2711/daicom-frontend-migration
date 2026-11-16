import { computed, ref } from 'vue'

// El comprobante abierto en su panel (PanelSunat): el de Ver informacion o el recien emitido. `formulario` es el
// que lo emitio, y vuelve a abrirse con "Corregir".
export function useEmissionPanel (formulario, recargar, aFila = (fila) => fila) {
  const abierta = ref(null)
  const corregible = computed(() => Boolean(abierta.value && formulario.value?.corregible(abierta.value.id)))

  function alEmitir (fila) {
    abierta.value = aFila(fila)
    recargar()
  }
  function corregir () {
    abierta.value = null
    formulario.value.corregir()
  }

  return { abierta, corregible, alEmitir, corregir }
}
