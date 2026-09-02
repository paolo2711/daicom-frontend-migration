import { ref } from 'vue'
import Swal from 'sweetalert2'
import { Toast } from '@/plugins/alerts'
import ClientDataService from '@/services/clients/clientDataService'
import ClientMappers from '@/mappers/clientMappers'
import ApiPeruService from '@/services/external/apiPeruService'
import { DOCUMENT_TYPE, DOCUMENT_LENGTH } from '@/utils/clients/documentTypes'

export function useClientLookup() {
  const loadingExternal = ref(false)
  const loadingResolve = ref(false)

  const buscarReniec = async (documento) => {
    const doc = (documento || '').trim()
    loadingExternal.value = true
    try {
      if (doc.length === DOCUMENT_LENGTH[DOCUMENT_TYPE.DNI]) {
        const nombre = await ApiPeruService.consultaDNI(doc)
        return { tipo: 'DNI', documento: doc, nombre, direccion: '' }
      }
      if (doc.length === DOCUMENT_LENGTH[DOCUMENT_TYPE.RUC]) {
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

  // Los dos pasos que todo consumidor encadena: consultar el documento afuera y
  // resolverlo contra la base. Avisa como salio y devuelve null si no se pudo,
  // asi cada vista solo se ocupa de que hacer con el cliente.
  const buscarYResolver = async (documento) => {
    let cliente
    try {
      const resultado = await buscarReniec(documento)
      cliente = await resolverContraBaseDeDatos(resultado)
    } catch (error) {
      Swal.fire('No encontrado', 'El documento no existe en SUNAT/RENIEC o hubo un error.', 'warning')
      return null
    }

    if (cliente.ambiguous) {
      Toast.fire({
        icon: 'warning',
        timer: 6000,
        title: 'Revisá este cliente',
        text: 'Ya había otros con un nombre parecido, así que se creó uno nuevo y quedó marcado para revisión.',
      })
    } else if (cliente.created) {
      Toast.fire({ icon: 'success', timer: 3000, title: 'Nuevo cliente registrado' })
    } else {
      Toast.fire({ icon: 'success', timer: 3000, title: 'Cliente sincronizado con RENIEC/SUNAT' })
    }

    return cliente
  }

  return {
    loadingExternal, loadingResolve, buscarYResolver,
  }
}