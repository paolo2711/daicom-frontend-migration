import InventoryDataService from '@/services/inventory/inventoryDataService'
import { useActionCall } from '@/composables/useActionCall'
import { useContextMenu } from '@/composables/useContextMenu'
import { usePermissions } from '@/composables/usePermissions'
import { accionesPara } from '@/utils/actions'
import { ACCIONES_INVENTARIO } from '@/utils/equipments/acciones'

// Lo que hace cada accion de ACCIONES_INVENTARIO, y el menu de la tabla. `editar` abre el formulario en una
// pestaña (0 datos y fotos, 1 certificado).
export function useInventoryActions(lista, { editar, verHistorial, alEliminar }) {
  const { confirmarYLlamar } = useActionCall()
  const { hasAction } = usePermissions()
  const { menu, alClickDerecho, alBotonDeFila, estaEnElMenu } = useContextMenu(lista)

  const accionesDe = (equipos) => accionesPara(ACCIONES_INVENTARIO, equipos, hasAction)

  async function eliminar (equipo) {
    const hecho = await confirmarYLlamar({
      titulo: `¿Eliminar ${equipo.internal_id}?`, boton: 'Sí, eliminar',
      texto: 'Sale del inventario; sus alquileres pasados se conservan.',
      llamar: () => InventoryDataService.delete(equipo.id),
      exito: `${equipo.internal_id} eliminado`, fallo: 'No se pudo eliminar el equipo.',
    })
    if (hecho) alEliminar()
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
