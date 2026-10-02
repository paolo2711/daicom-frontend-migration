import { fechaCorta, hoyISO } from '@/utils/dates'

// Una Deuda a credito que todavia no vence. No es una columna: el back la
// calcula al leer (OrderInvoice.estado y Order.estado_financiero).
export const CREDITO = 8

// "Vence 25/11/2026" mientras corre el plazo, "Venció ..." en rojo si ya paso
// sin pagarse. Pagada no dice nada: null.
export function vencimiento(factura) {
  if (!factura.es_credito || !factura.due_date || [5, 6].includes(factura.estado)) return null
  const vencida = factura.due_date < hoyISO()
  return {
    texto: `${vencida ? 'Venció' : 'Vence'} ${fechaCorta(factura.due_date)}`,
    color: vencida ? 'error' : 'teal',
  }
}

// El semaforo de la fila de una orden. estado_financiero: 1=En Proceso,
// 2=Deuda, 3=Abonado, 4=Anulada, 5=Pagado, 6=Excedido, 8=Credito.
export const getColorSemaforoFinanciero = (o) => {
  // Sin cargo va primero: esas ordenes tambien tienen wants_invoice en false y
  // caerian en la rama de abajo, que habla de abonos que nunca van a existir.
  if (o.requiere_pago === false) return 'grey-darken-2'
  if (o.wants_invoice === false) {
    // Sin comprobante: verde si ya tiene abono (pagado), gris si aún no.
    return o.estado_financiero === 5 ? 'success' : 'grey-darken-2'
  }
  switch (o.estado_financiero) {
    case 4: return 'grey-darken-1'   // Anulada
    case 6: return 'blue-darken-1'   // Excedido
    case 5: return 'success'         // Pagado
    case 3: return 'warning'         // Abonado (parcial)
    case 2: return 'error'           // Deuda
    case CREDITO: return 'teal'
    case 1:
    default: return 'grey'           // En proceso / sin factura
  }
}

export const getIconoSemaforoFinanciero = (o) => {
  if (o.requiere_pago === false) return 'mdi-cash-off'
  if (o.wants_invoice === false) {
    return o.estado_financiero === 5 ? 'mdi-file-document-check-outline' : 'mdi-file-document-remove-outline'
  }
  switch (o.estado_financiero) {
    case 4: return 'mdi-file-document-remove-outline' // Anulada
    case 6: return 'mdi-file-document-alert-outline'  // Excedido
    case 5: return 'mdi-file-document-check-outline'  // Pagado
    case 3: return 'mdi-file-document-edit-outline'   // Abonado parcial
    case 2: return 'mdi-file-document-alert-outline'  // Deuda
    case CREDITO: return 'mdi-calendar-clock'
    case 1:
    default: return 'mdi-file-document-outline'  // Libre / sin factura
  }
}

export const getTextoSemaforoFinanciero = (o) => {
  if (o.requiere_pago === false) return 'Sin cargo, no se cobra'
  if (o.wants_invoice === false) {
    return o.estado_financiero === 5 ? 'Sin comprobante · Pagado' : 'Sin comprobante · Sin abono aún'
  }
  const { cantidad, numero, vence } = o.facturas || { cantidad: 0, numero: '' }
  const cuantas = cantidad > 1 ? `${cantidad} facturas` : numero
  switch (o.estado_financiero) {
    case 4: return o.order_type === 2 ? 'Alquiler anulado' : 'Orden anulada'
    case 6: return `Excedido (${cuantas})`
    case 5: return `Pagado (${cuantas})`
    case 3: return `Abono parcial (${cuantas})`
    case 2: return `Sin abonos / Deuda (${cuantas})`
    case CREDITO: return `A crédito · vence ${fechaCorta(vence)} (${cuantas})`
    case 1:
    default: return 'Sin factura — clic para ver'
  }
}
