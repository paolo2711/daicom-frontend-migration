import { computed } from 'vue'
import { useOpenRow } from '@/composables/useCurrentRows'

// El comprobante abierto en su panel (PanelSunat): el de Ver informacion o el recien emitido, tomado de `lista`.
// `formulario` es el que lo emitio, y vuelve a abrirse con "Corregir".
export function useEmissionPanel (formulario, recargar, lista, aFila = (fila) => fila) {
  const abierta = useOpenRow(lista)
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
