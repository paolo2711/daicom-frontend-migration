// src/composables/usePaginatedSearch.js
import { ref, watch } from 'vue'

/**
 * Composable genérico para búsquedas paginadas con preservación de estado
 * * @param {Function} apiServiceCall - Función del servicio (ej. (page, size, query) => ClientDataService...)
 * @param {Function} mapperFunction - Función para mapear la respuesta
 * @param {Function} getActiveId - Getter para obtener el ID actualmente seleccionado en el v-model
 */
export function usePaginatedSearch(apiServiceCall, mapperFunction, getActiveId = () => null) {
  const items = ref([])
  const loading = ref(false)
  const searchQuery = ref(null)

  const retrieveData = async (query = '') => {
    loading.value = true
    try {
      // Llamada estándar a tus servicios paginados
      const response = await apiServiceCall(1, 10, query)
      const fetched = response.data.results.map(mapperFunction)
      
      // SOLUCIÓN DE RAÍZ CENTRALIZADA
      const activeId = getActiveId()
      if (activeId) {
        // Buscamos si el objeto activo ya estaba en la lista anterior
        const activeObj = items.value.find(item => item.id === activeId)
        // Si existe en memoria, pero NO vino en esta nueva página del backend, lo inyectamos
        if (activeObj && !fetched.some(item => item.id === activeId)) {
          fetched.unshift(activeObj)
        }
      }
      
      items.value = fetched
    } catch (error) {
      console.error("Error en la búsqueda paginada:", error)
    } finally {
      loading.value = false
    }
  }

  // Centralizamos el watcher para no repetirlo en cada componente
  watch(searchQuery, (newVal) => {
    retrieveData(newVal)
  })

  return {
    items,
    loading,
    searchQuery,
    retrieveData
  }
}