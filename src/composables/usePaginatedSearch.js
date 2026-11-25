import { ref, watch } from 'vue'
import { debounce } from '@/utils/debounce'
import { leerCache, guardarCache, olvidarCache } from '@/utils/cache'
import { leerPagina } from '@/utils/pagination'

const ESPERA_TECLEO = 300

/**
 * Búsqueda paginada con preservación del seleccionado.
 *
 * @param {Function} apiServiceCall - (page, size, query) => Promise
 * @param {Function} mapperFunction - mapea cada resultado
 * @param {Function} getActiveId - id elegido en el v-model, para no perderlo de la lista
 * @param {String} recurso - nombre de la lista (utils/comboLists.js) para la memoria corta. Vacío = sin memoria.
 */
export function usePaginatedSearch(apiServiceCall, mapperFunction, getActiveId = () => null, recurso = '') {
  const items = ref([])
  const loading = ref(false)
  const searchQuery = ref(null)
  const total = ref(0)   // total de coincidencias en el server (para avisar "hay más")

  // Sin texto, el elegido va primero si el server no lo devolvio; buscando, solo los resultados.
  // Sobre una copia: la lista guardada no se toca.
  const aplicar = (lista, cuenta, buscando) => {
    total.value = cuenta
    const visibles = [...lista]
    const activeId = getActiveId()
    if (!buscando && activeId) {
      const activo = items.value.find(item => item.id === activeId)
      if (activo && !visibles.some(item => item.id === activeId)) {
        visibles.unshift(activo)
      }
    }
    items.value = visibles
  }

  let ultimaConsulta = null
  let enVuelo = null
  let vuelta = 0

  // Descarta lo traido y lo que esta en camino; la proxima busqueda va al server.
  const olvidar = () => {
    vuelta++
    ultimaConsulta = null
    enVuelo = null
    items.value = []
    total.value = 0
  }

  const retrieveData = async (query = '', forzar = false) => {
    const texto = query || ''
    // La misma busqueda llega por dos caminos al desplegar. Se descarta si ya
    // esta en vuelo o si es la que se acaba de traer.
    if (!forzar && (enVuelo === texto || (ultimaConsulta === texto && items.value.length))) return

    const clave = recurso ? `${recurso}|${texto}` : ''

    if (forzar && recurso) olvidarCache(recurso)

    if (clave && !forzar) {
      const guardado = leerCache(clave)
      if (guardado) {
        ultimaConsulta = texto
        aplicar(guardado.lista, guardado.total, Boolean(texto))
        return
      }
    }

    enVuelo = texto
    loading.value = true
    const mia = vuelta
    try {
      const response = await apiServiceCall(1, 10, query)
      if (mia !== vuelta) return
      const { filas, total: cuenta } = leerPagina(response.data)
      const lista = filas.map(mapperFunction)
      if (clave) guardarCache(clave, { lista, total: cuenta })
      ultimaConsulta = texto
      aplicar(lista, cuenta, Boolean(texto))
    } catch (error) {
      console.error("Error en la búsqueda paginada:", error)
    } finally {
      if (mia === vuelta) {
        enVuelo = null
        loading.value = false
      }
    }
  }

  // Espera a que el usuario deje de teclear antes de pedir.
  const buscarConEspera = debounce((query) => retrieveData(query), ESPERA_TECLEO)

  watch(searchQuery, (newVal) => {
    buscarConEspera(newVal)
  })

  return {
    items,
    loading,
    searchQuery,
    retrieveData,
    olvidar,
    total
  }
}
