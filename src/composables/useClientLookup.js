import { ref } from 'vue'
import ClientDataService from '@/services/clients/clientDataService'
import ClientMappers from '@/mappers/clientMappers'
import ApiPeruService from '@/services/external/apiPeruService'

export function useClientLookup() {
  const localResults = ref([])
  const loadingLocal = ref(false)
  const loadingExternal = ref(false)
  const loadingResolve = ref(false)

  const buscarLocal = async (query) => {
    if (!query) {
      localResults.value = []
      return
    }
    loadingLocal.value = true
    try {
      const res = await ClientDataService.getFiltered(1, 10, query)
      localResults.value = res.data.results.map(ClientMappers.getMap)
    } catch (error) {
      console.error('Error buscando clientes locales:', error)
      localResults.value = []
    } finally {
      loadingLocal.value = false
    }
  }

  const buscarReniec = async (documento) => {
    const doc = (documento || '').trim()
    loadingExternal.value = true
    try {
      if (doc.length === 8) {
        const nombre = await ApiPeruService.consultaDNI(doc)
        return { tipo: 'DNI', documento: doc, nombre, direccion: '' }
      }
      if (doc.length === 11) {
        const res = await ApiPeruService.consultaRUC(doc)
        return { tipo: 'RUC', documento: doc, nombre: res.compania, direccion: res.direccion }
      }
      throw new Error('Formato inválido (8 u 11 dígitos)')
    } finally {
      loadingExternal.value = false
    }
  }

  const resolverContraBaseDeDatos = async (reniecResult) => {
    loadingResolve.value = true
    try {
      const payload = {
        dni: reniecResult.tipo === 'DNI' ? reniecResult.documento : '',
        ruc: reniecResult.tipo === 'RUC' ? reniecResult.documento : '',
        nombre: reniecResult.nombre,
        address: reniecResult.direccion,
      }
      const res = await ClientDataService.resolve(payload)
      return ClientMappers.getMap(res.data)
    } finally {
      loadingResolve.value = false
    }
  }

  return {
    localResults, loadingLocal, loadingExternal, loadingResolve,
    buscarLocal, buscarReniec, resolverContraBaseDeDatos,
  }
}