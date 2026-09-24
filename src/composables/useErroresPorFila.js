import { ref, watch } from 'vue'

// Lo que el servidor rechazo de una lista, por posicion. Al tocar la lista las
// posiciones cambian y los errores ya no apuntan a su fila: se limpian.
export function useErroresPorFila(lista) {
  const errores = ref({})

  watch(lista, () => { errores.value = {} }, { deep: true })

  const marcarErrores = (filas) => { errores.value = filas || {} }

  return { errores, marcarErrores }
}
