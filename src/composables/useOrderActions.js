import Swal from 'sweetalert2'
import { useRouter } from 'vue-router'
import { usePermissions } from '@/composables/usePermissions'
import { useContextMenu } from '@/composables/useContextMenu'
import { accionesPara } from '@/utils/actions'
import { COTIZACION, VALORIZACION } from '@/utils/documents/tipos'
import { ACCIONES_COBRO, ACCIONES_ORDEN, COBRO, GUIA } from '@/utils/orders/acciones'
import { esAlquiler, viva } from '@/utils/orders/estado'
import { SIN_CARGO, SIN_COMPROBANTE, alternarMarca } from '@/utils/orders/sinFactura'
import { anularOrdenes } from '@/utils/orders/anulacion'

// Lo que hace cada accion de ACCIONES_ORDEN y ACCIONES_COBRO, y el menu de la tabla. Lo usan Servicios y
// Alquileres; cada una dice como abre sus modales y su panel de cobro.
export function useOrderActions(seleccion, { editar, imprimirIngreso, abrirCobro }) {
  const { hasAction } = usePermissions()
  const router = useRouter()
  const { menu, alClickDerecho, alBotonDeFila, estaEnElMenu } = useContextMenu(seleccion, { marca: false })

  const accionesDe = (ordenes) => accionesPara(ACCIONES_ORDEN, ordenes, hasAction)
  const accionesDeCobro = (ordenes) => accionesPara(ACCIONES_COBRO, ordenes, hasAction)

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

  // La pestaña de ese documento abre su formulario lleno con los equipos de estas ordenes.
  const PESTANA = {
    [COTIZACION]: 'documents-quotes', [VALORIZACION]: 'documents-valuations', [GUIA]: 'billing-dispatch-guides',
    facturar: 'billing-invoices',
  }
  const armarDocumento = (clave, ordenes) => router.push({
    name: PESTANA[clave], query: { ordenes: ordenes.filter(viva).map(o => o.id).join(',') },
  })

  async function ejecutarAccion (clave, ordenes) {
    const [orden] = ordenes
    switch (clave) {
      case 'editar': return editar(orden)
      case 'ingreso': return imprimirIngreso(orden)
      case COTIZACION:
      case VALORIZACION:
      case GUIA:
      case 'facturar':
        return armarDocumento(clave, ordenes)
      case COBRO: return abrirCobro(ordenes)
      // Devuelve si se hizo: el panel de cobro abre entonces el abono de la que quedo sin comprobante.
      case SIN_COMPROBANTE:
      case SIN_CARGO: {
        const hecho = await alternarMarca(clave, ordenes)
        if (hecho) soltar(ordenes)
        return hecho
      }
      case 'anular': return anular(ordenes)
    }
  }

  return { menu, alClickDerecho, alBotonDeFila, estaEnElMenu, accionesDe, accionesDeCobro, ejecutarAccion }
}
