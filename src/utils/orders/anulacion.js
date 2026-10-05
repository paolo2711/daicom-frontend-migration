import Swal from 'sweetalert2'
import { Toast } from '@/plugins/alerts'
import OrderDataService from '@/services/orders/orderDataService'
import { mensajeDeError } from '@/utils/errors'

// Todas o ninguna: si una no se puede, el servidor dice cual y por que, y no se
// anula nada. La confirmacion la hace cada pantalla, que sabe que avisar.
export async function anularOrdenes (ordenes) {
  const n = ordenes.length
  try {
    await OrderDataService.anular(ordenes.map(o => o.id))
  } catch (err) {
    const rechazos = err.response?.data?.rechazos
    if (rechazos) {
      Swal.fire({ icon: 'error', title: n === 1 ? 'No se anuló' : 'No se anuló ninguna', html: rechazos.join('<br>') })
    } else {
      Swal.fire({ icon: 'error', title: 'Error', text: mensajeDeError(err, 'No se pudo anular.') })
    }
    return false
  }
  Toast.fire({ timer: 2200, icon: 'success', title: n === 1 ? 'Orden anulada' : 'Órdenes anuladas' })
  return true
}
