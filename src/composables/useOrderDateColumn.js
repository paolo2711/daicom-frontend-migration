import { computed, ref } from 'vue'

// En rem: con la lista mas angosta, la fecha va dentro de la orden expandida.
const ANCHO_CON_FECHA = 60
const COLUMNA_FECHA = { title: 'Fecha', key: 'created_at', sortable: false }

// Las columnas de una lista de ordenes, con la fecha despues del numero cuando la lista tiene espacio.
export function useOrderDateColumn (columnas) {
  const anchoDeLaLista = ref(0)
  const fechaEnColumna = computed(() => anchoDeLaLista.value >= ANCHO_CON_FECHA)
  const headers = computed(() => (fechaEnColumna.value ? [columnas[0], COLUMNA_FECHA, ...columnas.slice(1)] : columnas))
  return { anchoDeLaLista, fechaEnColumna, headers }
}
