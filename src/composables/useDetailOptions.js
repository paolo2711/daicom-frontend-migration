import { computed, ref, watch } from 'vue'

// Lo que se ve a la derecha de un formulario de WorkspaceLayout: la fila elegida o una opcion, nunca las dos.
// `opciones` devuelve las [{ clave, titulo }] de la pestaña Opciones.
export function useDetailOptions (elegida, opciones) {
  const opcionAbierta = ref(null)
  watch(elegida, (fila) => { if (fila) opcionAbierta.value = null })

  function abrirOpcion (clave) {
    elegida.value = null
    opcionAbierta.value = clave
  }
  const tituloDeOpcion = computed(() => opciones().find(o => o.clave === opcionAbierta.value)?.titulo ?? '')

  return { opcionAbierta, abrirOpcion, tituloDeOpcion }
}
