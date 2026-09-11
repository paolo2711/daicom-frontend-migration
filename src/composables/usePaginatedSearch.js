import { ref, watch } from 'vue'
import { debounce } from '@/utils/debounce'
import { leerCache, guardarCache, olvidarCache } from '@/utils/cacheCorta'

const ESPERA_TECLEO = 300

/**
 * Búsqueda paginada con preservación del seleccionado.
 *
 * @param {Function} apiServiceCall - (page, size, query) => Promise
 * @param {Function} mapperFunction - mapea cada resultado
 * @param {Function} getActiveId - id elegido en el v-model, para no perderlo de la lista
 * @param {String} recurso - nombre para la memoria corta ('clientes', 'labs'...). Vacío = sin memoria.
 */
export function usePaginatedSearch(apiServiceCall, mapperFunction, getActiveId = () => null, recurso = '') {
  const items = ref([])
  const loading = ref(false)
  const searchQuery = ref(null)
  const total = ref(0)   // total de coincidencias en el server (para avisar "hay más")

  // Sin busqueda, el seleccionado se antepone si el server no lo devolvio, para
  // que no desaparezca de la lista. Buscando no: ahi la lista son los
  // resultados, y colar el elegido entre ellos confunde.
  // Se hace sobre una copia: la lista guardada no se toca.
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
    try {
      const response = await apiServiceCall(1, 10, query)
      const cuenta = response.data.count ?? response.data.results.length
      const lista = response.data.results.map(mapperFunction)
      if (clave) guardarCache(clave, { lista, total: cuenta })
      ultimaConsulta = texto
      aplicar(lista, cuenta, Boolean(texto))
    } catch (error) {
      console.error("Error en la búsqueda paginada:", error)
    } finally {
      enVuelo = null
      loading.value = false
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
    total
  }
}
