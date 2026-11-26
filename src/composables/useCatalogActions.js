import EquipmentDataService from '@/services/equipments/equipmentDataService'
import ServicioCatalogoDataService from '@/services/equipments/servicioCatalogoDataService'
import { useActionCall } from '@/composables/useActionCall'
import { useContextMenu } from '@/composables/useContextMenu'
import { usePermissions } from '@/composables/usePermissions'
import { accionesPara } from '@/utils/actions'
import { ACCIONES_EQUIPO_DEL_CATALOGO, ACCIONES_SERVICIO_DEL_CATALOGO } from '@/utils/equipments/catalogo'

// Lo que hacen las acciones del catalogo: las del menu de un equipo y las de cada servicio en su panel. Los
// formularios los abre la pantalla; `alCambiar(eliminado)` recarga, con el equipo si se borro.
export function useCatalogActions(equipos, { editarEquipo, editarServicio, alCambiar }) {
  const { hasAction } = usePermissions()
  const { confirmarYLlamar } = useActionCall()
  const { menu, alClickDerecho, alBotonDeFila, estaEnElMenu } = useContextMenu(equipos)

  const accionesDeEquipo = (filas) => accionesPara(ACCIONES_EQUIPO_DEL_CATALOGO, filas, hasAction)
  const accionesDeServicio = (filas) => accionesPara(ACCIONES_SERVICIO_DEL_CATALOGO, filas, hasAction)

  async function eliminarEquipo (equipo) {
    const hecho = await confirmarYLlamar({
      titulo: `¿Eliminar ${equipo.nombre_tecnico}?`, boton: 'Sí, eliminar',
      texto: equipo.servicios_count
        ? `Se borra del catálogo con sus ${equipo.servicios_count} servicios. No se puede deshacer.`
        : 'Se borra del catálogo. No se puede deshacer.',
      llamar: () => EquipmentDataService.delete(equipo.id),
      exito: 'Equipo eliminado', fallo: 'No se pudo eliminar el equipo.',
    })
    if (hecho) alCambiar(equipo)
  }

  async function eliminarServicio (servicio) {
    const hecho = await confirmarYLlamar({
      titulo: `¿Eliminar ${servicio.nombre}?`, boton: 'Sí, eliminar',
      texto: 'Se borra del catálogo con sus precios. No se puede deshacer.',
      llamar: () => ServicioCatalogoDataService.delete(servicio.id),
      exito: 'Servicio eliminado', fallo: 'No se pudo eliminar el servicio.',
    })
    if (hecho) alCambiar()
  }

  function accionDeEquipo (clave, [equipo]) {
    switch (clave) {
      case 'editar': return editarEquipo(equipo)
      case 'servicio': return editarServicio(null, equipo)
      case 'eliminar': return eliminarEquipo(equipo)
    }
  }

  function accionDeServicio (clave, [servicio], equipo) {
    switch (clave) {
      case 'editar': return editarServicio(servicio, equipo)
      case 'eliminar': return eliminarServicio(servicio)
    }
  }

  return { menu, alClickDerecho, alBotonDeFila, estaEnElMenu, accionesDeEquipo, accionesDeServicio,
           accionDeEquipo, accionDeServicio }
}
