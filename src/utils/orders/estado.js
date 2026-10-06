// Order.OrderStatus en el back. Es tambien el estado_financiero de la orden y,
// con los mismos numeros, el estado de una factura (OrderInvoice.InvoiceStatus).
export const EN_PROCESO = 1
export const DEUDA = 2
export const ABONADO = 3
export const ANULADA = 4
export const PAGADO = 5
export const EXCEDIDO = 6
// Una Deuda a credito que todavia no vence. No es una columna: el back la
// calcula al leer (OrderInvoice.estado y Order.estado_financiero).
export const CREDITO = 8

// Texto y color de cada uno. Anulada va en azul-gris, distinto del gris de En
// proceso.
export const ESTADOS = {
  [EN_PROCESO]: { texto: 'En proceso', color: '#9e9e9e' },
  [DEUDA]: { texto: 'Deuda', color: '#e53935' },
  [CREDITO]: { texto: 'Crédito', color: '#00897b' },
  [ABONADO]: { texto: 'Abonado', color: '#fb8c00' },
  [PAGADO]: { texto: 'Pagado', color: '#43a047' },
  [EXCEDIDO]: { texto: 'Excedido', color: '#1e88e5' },
  [ANULADA]: { texto: 'Anulada', color: '#546e7a' },
}

// El filtro de la columna de la orden. Credito no esta: no se guarda, se
// calcula al leer.
export const FILTRO_DE_ESTADO = [EN_PROCESO, DEUDA, ABONADO, PAGADO, EXCEDIDO, ANULADA]
  .map(id => ({ id, name: ESTADOS[id].texto }))

// Order.OrderType.
export const SERVICIO = 1
export const ALQUILER = 2

export const viva = (orden) => orden?.status !== ANULADA
// Las ordenes viejas pueden venir sin tipo: son de servicio.
export const esDeServicio = (orden) => !orden?.order_type || orden.order_type === SERVICIO
export const esAlquiler = (orden) => orden?.order_type === ALQUILER
