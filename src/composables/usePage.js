import { ref, watch } from 'vue'
import { primeraPagina } from '@/utils/pagination'

// La pagina de una tabla del server: al cambiarla se recarga; un filtro llama a `alInicio`, que recarga desde la primera.
export function usePage (recargar) {
  const opciones = ref(primeraPagina())
  watch(opciones, () => recargar(), { deep: true })

  const alInicio = () => {
    if (opciones.value.page === 1) recargar()
    else opciones.value.page = 1
  }

  return { opciones, alInicio }
}
