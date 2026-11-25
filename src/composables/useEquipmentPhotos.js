import { ref } from 'vue'
import Swal from 'sweetalert2'
import { useLatestRequest } from '@/composables/useLatestRequest'
import InventoryDataService from '@/services/inventory/inventoryDataService'
import { mensajeDeError } from '@/utils/errors'

// Las fotos de un equipo del inventario en PhotoViewer: `visor` es su ref.
export function useEquipmentPhotos () {
  const visor = ref(null)
  const { begin, isLatest } = useLatestRequest()

  async function verFotos (id) {
    const token = begin()
    try {
      const { data } = await InventoryDataService.get(id)
      if (isLatest(token)) visor.value?.open(data.gallery)
    } catch (error) {
      if (isLatest(token)) Swal.fire('No se abrieron las fotos', mensajeDeError(error, 'Intenta de nuevo.'), 'error')
    }
  }

  return { visor, verFotos }
}
