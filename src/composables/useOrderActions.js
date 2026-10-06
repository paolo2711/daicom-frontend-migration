import Swal from 'sweetalert2'
import { usePermissions } from '@/composables/usePermissions'
import { useContextMenu } from '@/composables/useContextMenu'
import { accionesPara } from '@/utils/actions'
import { ACCIONES_ORDEN, VINCULAR } from '@/utils/orders/acciones'
import { esAlquiler, viva } from '@/utils/orders/estado'
import { SIN_CARGO, SIN_COMPROBANTE, alternarMarca } from '@/utils/orders/sinFactura'
import { anularOrdenes } from '@/utils/orders/anulacion'

// Lo que hace cada accion de ACCIONES_ORDEN, y el menu de la tabla. Lo usan
// Servicios y Alquileres; cada una dice como abre sus modales.
// Marcar pone al panel de facturas en modo vincular, asi que el menu no marca.
export function useOrderActions(seleccion, { editar, agregarEquipo, facturar }) {
  const { hasAction } = usePermissions()
  const { menu, alClickDerecho, alBotonDeFila, estaEnElMenu } = useContextMenu(seleccion, { marca: false })

  const estaMarcada = (orden) => seleccion.value.some(o => o.id === orden.id)

  // Vincular es marcarla: sobre las ya marcadas no hay nada que hacer.
  const accionesDe = (ordenes) => accionesPara(ACCIONES_ORDEN, ordenes, hasAction)
    .filter(a => a.clave !== VINCULAR || !ordenes.every(estaMarcada))

  // Las que se tocaron salen de la seleccion; las demas marcadas siguen.
  const soltar = (ordenes) => {
    const ids = ordenes.map(o => o.id)
    seleccion.value = seleccion.value.filter(o => !ids.includes(o.id))
  }

  async function anular (ordenes) {
    const vivas = ordenes.filter(viva)
    const { isConfirmed } = await Swal.fire({
      title: vivas.length === 1 ? `¿Anular ${vivas[0].order_number}?` : `¿Anular ${vivas.length} órdenes?`,
      text: esAlquiler(vivas[0])
        ? 'Lo reservado vuelve a disponible. Con equipos en obra, primero se registra su devolución.'
        : 'Se anulan también todos sus equipos.',
      icon: 'warning', showCancelButton: true, confirmButtonText: 'Sí, anular', cancelButtonText: 'Cancelar',
    })
    if (isConfirmed && await anularOrdenes(vivas)) soltar(vivas)
  }

  async function ejecutarAccion (clave, ordenes) {
    const [orden] = ordenes
    switch (clave) {
      case 'editar': return editar(orden)
      case 'equipo': return agregarEquipo(orden)
      case VINCULAR:
        seleccion.value = [...seleccion.value, ...ordenes.filter(o => !estaMarcada(o))]
        return
      case 'facturar': return facturar(ordenes)
      case SIN_COMPROBANTE:
      case SIN_CARGO:
        if (await alternarMarca(clave, ordenes)) soltar(ordenes)
        return
      case 'anular': return anular(ordenes)
    }
  }

  return { menu, alClickDerecho, alBotonDeFila, estaEnElMenu, accionesDe, ejecutarAccion }
}
