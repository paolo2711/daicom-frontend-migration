import { fechaCorta, hoyISO } from '@/utils/dates'
import { ABONADO, ANULADA, CREDITO, DEUDA, EXCEDIDO, PAGADO, esAlquiler, tonoDe } from '@/utils/orders/estado'

// A credito y dentro del plazo, tenga abonos o no: lo que falta todavia no se
// cobra.
const porVencer = (factura) => !!(factura.es_credito && factura.due_date && factura.due_date >= hoyISO())

// "Vence 25/11/2026" mientras corre el plazo, "Venció ..." si ya paso sin pagarse. Pagada no dice nada.
export function vencimiento(factura) {
  if (!factura.es_credito || !factura.due_date || [PAGADO, EXCEDIDO].includes(factura.estado)) return ''
  return `${porVencer(factura) ? 'Vence' : 'Venció'} ${fechaCorta(factura.due_date)}`
}

// El semaforo de la fila de una orden, segun su estado_financiero.
export const getColorSemaforoFinanciero = (o) => {
  // Sin cargo va primero: esas ordenes tambien tienen wants_invoice en false y
  // caerian en la rama de abajo, que habla de abonos que nunca van a existir.
  if (o.requiere_pago === false) return undefined
  // Sin comprobante: verde si ya tiene abono, sin color si aun no.
  if (o.wants_invoice === false) return o.estado_financiero === PAGADO ? 'success' : undefined
  return tonoDe(o.estado_financiero).color
}

export const getIconoSemaforoFinanciero = (o) => {
  if (o.requiere_pago === false) return 'mdi-cash-off'
  if (o.wants_invoice === false) {
    return o.estado_financiero === PAGADO ? 'mdi-file-document-check-outline' : 'mdi-file-document-remove-outline'
  }
  switch (o.estado_financiero) {
    case ANULADA: return 'mdi-file-document-remove-outline'
    case EXCEDIDO: return 'mdi-file-document-alert-outline'
    case PAGADO: return 'mdi-file-document-check-outline'
    case ABONADO: return 'mdi-file-document-edit-outline'
    case DEUDA: return 'mdi-file-document-alert-outline'
    case CREDITO: return 'mdi-calendar-clock'
    default: return 'mdi-file-document-outline'  // Libre / sin factura
  }
}

export const getTextoSemaforoFinanciero = (o) => {
  if (o.requiere_pago === false) return 'Sin cargo, no se cobra'
  if (o.wants_invoice === false) {
    return o.estado_financiero === PAGADO ? 'Sin comprobante · Pagado' : 'Sin comprobante · Sin abono aún'
  }
  const { cantidad, numero, vence } = o.facturas || { cantidad: 0, numero: '' }
  const cuantas = cantidad > 1 ? `${cantidad} facturas` : numero
  switch (o.estado_financiero) {
    case ANULADA: return esAlquiler(o) ? 'Alquiler anulado' : 'Orden anulada'
    case EXCEDIDO: return `Excedido (${cuantas})`
    case PAGADO: return `Pagado (${cuantas})`
    case ABONADO: return `Abono parcial (${cuantas})`
    case DEUDA: return `Sin abonos / Deuda (${cuantas})`
    case CREDITO: return `A crédito · vence ${fechaCorta(vence)} (${cuantas})`
    default: return 'Sin factura — clic para ver'
  }
}
