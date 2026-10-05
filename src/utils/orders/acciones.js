import { SIN_CARGO, SIN_COMPROBANTE, marcaDe, puedeMarcarse } from '@/utils/orders/sinFactura'

// Lo que se puede hacer con ordenes. De aca salen la barra de seleccion y el
// menu (click derecho y boton de la fila). Los campos de cada una, en
// utils/actions.js.

const ANULADA = 4  // Order.OrderStatus.CANCELLED
export const ALQUILER = 2  // Order.OrderType.RENTAL
export const viva = (orden) => orden.status !== ANULADA
const quitaOPone = (marca, texto) => (ordenes) => (marcaDe(ordenes) === marca ? `Quitar ${texto.toLowerCase()}` : texto)

export const VINCULAR = 'vincular'

export const ACCIONES_ORDEN = [
  {
    clave: 'editar', grupo: 'orden', varios: false,
    icono: 'mdi-pencil',
    // En alquileres el modal tambien lleva las OC y valorizaciones.
    texto: ([orden]) => (orden.order_type === ALQUILER ? 'Editar alquiler' : 'Editar cliente'),
    disponible: ([orden]) => viva(orden),
  },
  {
    clave: 'equipo', grupo: 'orden', varios: false,
    icono: 'mdi-plus', texto: 'Añadir equipo extra',
    disponible: ([orden]) => viva(orden),
  },
  {
    clave: VINCULAR, grupo: 'cobro', varios: false,
    icono: 'mdi-link-variant', texto: 'Vincular a una factura',
    disponible: ([orden]) => viva(orden),
  },
  {
    clave: 'facturar', grupo: 'cobro', varios: true,
    icono: 'mdi-file-document-plus', texto: 'Facturar',
    disponible: (ordenes) => ordenes.every(viva),
  },
  {
    clave: SIN_COMPROBANTE, grupo: 'cobro', varios: true,
    icono: 'mdi-file-remove-outline', texto: quitaOPone(SIN_COMPROBANTE, 'Sin comprobante'),
    disponible: (ordenes) => ordenes.some(o => viva(o) && puedeMarcarse(o)),
  },
  {
    clave: SIN_CARGO, grupo: 'cobro', varios: true,
    icono: 'mdi-cash-off', texto: quitaOPone(SIN_CARGO, 'Sin cargo'),
    disponible: (ordenes) => ordenes.some(o => viva(o) && puedeMarcarse(o)),
  },
  {
    clave: 'anular', grupo: 'peligro', varios: true, permiso: 1004,
    icono: 'mdi-delete-outline', texto: 'Anular',
    disponible: (ordenes) => ordenes.some(viva),
  },
]
