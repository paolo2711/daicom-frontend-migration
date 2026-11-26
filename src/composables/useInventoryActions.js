import InventoryDataService from '@/services/inventory/inventoryDataService'
import { useContextMenu } from '@/composables/useContextMenu'
import { usePermissions } from '@/composables/usePermissions'
import { useSwal } from '@/composables/useSwal'
import { accionesPara } from '@/utils/actions'
import { avisarHecho } from '@/utils/documents/avisos'
import { ACCIONES_INVENTARIO } from '@/utils/equipments/acciones'
import { mensajeDeError } from '@/utils/errors'

// Lo que hace cada accion de ACCIONES_INVENTARIO, y el menu de la tabla. `editar` abre el formulario en una
// pestaña (0 datos y fotos, 1 certificado).
export function useInventoryActions(lista, { editar, verHistorial, alEliminar }) {
  const swal = useSwal()
  const { hasAction } = usePermissions()
  const { menu, alClickDerecho, alBotonDeFila, estaEnElMenu } = useContextMenu(lista)

  const accionesDe = (equipos) => accionesPara(ACCIONES_INVENTARIO, equipos, hasAction)

  async function eliminar (equipo) {
    const { isConfirmed } = await swal.fire({
      title: `¿Eliminar ${equipo.internal_id}?`,
      text: 'Sale del inventario; sus alquileres pasados se conservan.',
      icon: 'warning', showCancelButton: true, confirmButtonText: 'Sí, eliminar', cancelButtonText: 'Cancelar',
    })
    if (!isConfirmed) return
    try {
      await InventoryDataService.delete(equipo.id)
      avisarHecho(`${equipo.internal_id} eliminado`)
      alEliminar()
    } catch (err) {
      swal.fire({ icon: 'error', title: 'No se eliminó', text: mensajeDeError(err, 'No se pudo eliminar el equipo.') })
    }
  }

  function ejecutarAccion (clave, [equipo]) {
    switch (clave) {
      case 'editar': return editar(equipo, 0)
      case 'certificado': return editar(equipo, 1)
      case 'historial': return verHistorial(equipo)
      case 'eliminar': return eliminar(equipo)
    }
  }

  return { menu, alClickDerecho, alBotonDeFila, estaEnElMenu, accionesDe, ejecutarAccion }
}
