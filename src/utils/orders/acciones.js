import { SIN_CARGO, SIN_COMPROBANTE, marcaDe, puedeMarcarse } from '@/utils/orders/sinFactura'
import { esAlquiler, viva } from '@/utils/orders/estado'

// Lo que se puede hacer con ordenes. De aca salen la barra de seleccion y el
// menu (click derecho y boton de la fila). Los campos de cada una, en
// utils/actions.js. Una anulada no tiene ninguna.

const algunaViva = (ordenes) => ordenes.some(viva)
const quitaOPone = (marca, texto) => (ordenes) => (marcaDe(ordenes) === marca ? `Quitar ${texto.toLowerCase()}` : texto)

export const VINCULAR = 'vincular'

export const ACCIONES_ORDEN = [
  {
    clave: 'editar', grupo: 'orden', varios: false,
    icono: 'mdi-pencil',
    // En alquileres el modal tambien lleva las OC y valorizaciones.
    texto: ([orden]) => (esAlquiler(orden) ? 'Editar alquiler' : 'Editar cliente'),
    visible: algunaViva,
  },
  {
    clave: 'equipo', grupo: 'orden', varios: false,
    icono: 'mdi-plus', texto: 'Añadir equipo extra',
    visible: algunaViva,
  },
  {
    clave: VINCULAR, grupo: 'cobro', varios: false,
    icono: 'mdi-link-variant', texto: 'Vincular a una factura',
    visible: algunaViva,
  },
  {
    clave: 'facturar', grupo: 'cobro', varios: true,
    icono: 'mdi-file-document-plus', texto: 'Facturar',
    visible: algunaViva,
    disponible: (ordenes) => ordenes.every(viva),
  },
  // Con factura fiscal va en gris: primero se desvincula esa factura.
  {
    clave: SIN_COMPROBANTE, grupo: 'cobro', varios: true,
    icono: 'mdi-file-remove-outline', texto: quitaOPone(SIN_COMPROBANTE, 'Sin comprobante'),
    visible: algunaViva,
    disponible: (ordenes) => ordenes.some(o => viva(o) && puedeMarcarse(o)),
  },
  {
    clave: SIN_CARGO, grupo: 'cobro', varios: true,
    icono: 'mdi-cash-off', texto: quitaOPone(SIN_CARGO, 'Sin cargo'),
    visible: algunaViva,
    disponible: (ordenes) => ordenes.some(o => viva(o) && puedeMarcarse(o)),
  },
  {
    clave: 'anular', grupo: 'peligro', varios: true, permiso: 1004,
    icono: 'mdi-delete-outline', texto: 'Anular',
    visible: algunaViva,
  },
]
