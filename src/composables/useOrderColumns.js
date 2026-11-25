import { computed, ref } from 'vue'

// En rem: con la lista mas angosta, la fecha va dentro de la orden expandida.
const ANCHO_CON_ESPACIO = 60
const COLUMNA_FECHA = { title: 'Fecha', key: 'created_at', sortable: false }

// Las columnas de una lista de ordenes. Con espacio suma la fecha y las que llevan `conEspacio`.
export function useOrderColumns (columnas) {
  const anchoDeLaLista = ref(0)
  const hayEspacio = computed(() => anchoDeLaLista.value >= ANCHO_CON_ESPACIO)
  const headers = computed(() => (hayEspacio.value
    ? [columnas[0], COLUMNA_FECHA, ...columnas.slice(1)]
    : columnas.filter(columna => !columna.conEspacio)))
  return { anchoDeLaLista, hayEspacio, headers }
}
