// Order.OrderStatus en el back. Es tambien el estado_financiero de la orden y,
// con los mismos numeros, el estado de una factura (Invoice.InvoiceStatus).
export const EN_PROCESO = 1
export const DEUDA = 2
export const ABONADO = 3
export const ANULADA = 4
export const PAGADO = 5
export const EXCEDIDO = 6
export const SIN_CARGO = 7
// Una Deuda a credito que todavia no vence.
export const CREDITO = 8

export const ESTADOS = {
  [EN_PROCESO]: { texto: 'En proceso' },
  [DEUDA]: { texto: 'Deuda' },
  [CREDITO]: { texto: 'Crédito' },
  [ABONADO]: { texto: 'Abonado' },
  [PAGADO]: { texto: 'Pagado' },
  [EXCEDIDO]: { texto: 'Excedido' },
  [ANULADA]: { texto: 'Anulada' },
  [SIN_CARGO]: { texto: 'Sin cargo' },
}

// El color del cobro: lo que falta cobrar en rojo, el credito al dia en teal (como su pildora), lo cobrado en verde
// y lo demas sin color.
export const TONOS = {
  debe: { texto: 'Debe', color: 'error' },
  credito: { texto: 'Crédito al día', color: 'teal' },
  abierta: { texto: 'En proceso' },
  pagada: { texto: 'Pagada', color: 'success' },
  anulada: { texto: 'Anulada', tenue: true },
}
const TONO_DEL_ESTADO = {
  [DEUDA]: 'debe', [ABONADO]: 'debe', [CREDITO]: 'credito', [PAGADO]: 'pagada', [EXCEDIDO]: 'pagada', [ANULADA]: 'anulada',
}
export const tonoDe = (estado) => TONOS[TONO_DEL_ESTADO[estado] || 'abierta']

export const FILTRO_DE_ESTADO = [EN_PROCESO, DEUDA, CREDITO, ABONADO, PAGADO, EXCEDIDO, SIN_CARGO, ANULADA]
  .map(id => ({ id, name: ESTADOS[id].texto }))

// Order.OrderType.
export const SERVICIO = 1
export const ALQUILER = 2

export const viva = (orden) => orden?.status !== ANULADA
// Las ordenes viejas pueden venir sin tipo: son de servicio.
export const esDeServicio = (orden) => !orden?.order_type || orden.order_type === SERVICIO
export const esAlquiler = (orden) => orden?.order_type === ALQUILER
