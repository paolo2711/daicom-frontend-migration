import { computed, ref } from 'vue'

// El comprobante recien emitido, al costado de su lista mientras SUNAT responde (SunatEnvio). Su fila de la lista
// manda en cuanto llega; `formulario` es el que lo emitio, y vuelve a abrirse con "Corregir".
export function useEmissionPanel (filas, formulario, recargar, aFila = (fila) => fila) {
  const id = ref(null)
  const respuesta = ref(null)
  const enviada = computed(() => filas.value.find(f => f.id === id.value) || respuesta.value)
  const corregible = computed(() => Boolean(enviada.value && formulario.value?.corregible(enviada.value.id)))

  function alEmitir (fila) {
    respuesta.value = aFila(fila)
    id.value = fila.id
    recargar()
  }
  function cerrar () {
    id.value = null
    respuesta.value = null
  }
  function corregir () {
    cerrar()
    formulario.value.corregir()
  }

  return { enviada, corregible, alEmitir, cerrar, corregir }
}
