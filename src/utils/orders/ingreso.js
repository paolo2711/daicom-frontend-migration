import OrderDataService from '@/services/orders/orderDataService'
import { abrirEnOtraPestana } from '@/utils/pdf'

// El PDF del ingreso de una orden de servicio, en otra pestaña.
export async function abrirIngreso(id) {
  const { data } = await OrderDataService.ingreso(id)
  abrirEnOtraPestana(data.url)
}
