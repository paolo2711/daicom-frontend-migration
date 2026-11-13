import Swal from 'sweetalert2'
import BillingDataService from '@/services/billing/billingDataService'
import { avisarHecho } from '@/utils/documents/avisos'
import { mensajeDeError } from '@/utils/errors'
import { importe } from '@/utils/money'
import { porVencer } from '@/utils/orders/cobro'
import { ABONADO, ANULADA, CREDITO, DEUDA, EN_PROCESO, ESTADOS, EXCEDIDO, PAGADO } from '@/utils/orders/estado'

// Lo de una factura que comparten la pestaña Facturas y el panel de la orden.

export const estadoDe = (factura) => ESTADOS[factura.estado] || ESTADOS[DEUDA]

export const FORMA_DE_PAGO = { EFECTIVO: 'efectivo', BILLETERA: 'billetera virtual', TRANSFERENCIA: 'transferencia' }

export const FILTRO_DE_ESTADO =[EN_PROCESO, DEUDA, CREDITO, ABONADO, PAGADO, EXCEDIDO, ANULADA]
  .map(id => ({ id, name: ESTADOS[id].texto }))

// El contenedor sin comprobante nace en 0 hasta su primer abono.
export const montoDe = (factura) => (factura.amount > 0 ? factura.amount : null)

// Lo que falta cobrar (en verde azulado si es credito que no vence) o lo pagado de mas; null si esta justo.
export function saldoDe (factura) {
  const saldo = Number(factura.saldo_pendiente || 0)
  if (saldo > 0) return { texto: `Pdte ${importe(saldo)}`, clase: porVencer(factura) ? 'text-teal' : 'text-error' }
  if (saldo < 0) return { texto: `Exc. ${importe(-saldo)}`, clase: 'text-blue-darken-1' }
  return null
}

const fallo = (titulo, porDefecto) => (error) => {
  Swal.fire({ icon: 'error', title: titulo, text: mensajeDeError(error, porDefecto) })
  return false
}

// Quita una orden de la factura; si era la ultima, el back borra la factura. True si se hizo.
export async function desvincular (factura, orden) {
  const { isConfirmed } = await Swal.fire({
    title: '¿Desvincular esta orden?', icon: 'question', showCancelButton: true,
    html: `Se quitará <b>${orden.order_number}</b> de la factura <b>${factura.invoice_number || 'sin número'}</b>.`
      + '<br>La factura y sus abonos se conservan.',
    confirmButtonText: 'Sí, desvincular', cancelButtonText: 'Cancelar',
  })
  if (!isConfirmed) return false
  return BillingDataService.deleteInvoice(factura.id, orden.order_id).then(() => {
    avisarHecho(`${orden.order_number} desvinculada`)
    return true
  }, fallo('No se desvinculó', 'No se pudo desvincular.'))
}

// Vincula las ordenes a la factura, sin monto. True si se hizo.
export function vincular (factura, ordenes) {
  return BillingDataService.linkInvoice(factura.id, ordenes.map(o => o.id)).then(() => {
    avisarHecho(`${factura.invoice_number || 'Factura'} vinculada`)
    return true
  }, fallo('No se vinculó', 'No se pudo vincular.'))
}
