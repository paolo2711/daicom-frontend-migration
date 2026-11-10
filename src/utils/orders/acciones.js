import { SIN_CARGO, SIN_COMPROBANTE, marcaDe, puedeMarcarse } from '@/utils/orders/sinFactura'
import { esDeServicio, viva } from '@/utils/orders/estado'

// Lo que se puede hacer con ordenes. De aca salen la barra de seleccion y el
// menu (click derecho y boton de la fila). Los campos de cada una, en
// utils/actions.js. Una anulada no tiene ninguna.

const algunaViva = (ordenes) => ordenes.some(viva)
const yaImpreso = (ordenes) => ordenes.length === 1 && ordenes[0].tiene_ingreso
const quitaOPone = (marca, texto) => (ordenes) => (marcaDe(ordenes) === marca ? `Quitar ${texto.toLowerCase()}` : texto)

export const VINCULAR = 'vincular'

export const ACCIONES_ORDEN = [
  {
    clave: 'editar', grupo: 'orden', varios: false,
    icono: 'mdi-pencil', texto: 'Ver y editar',
    visible: algunaViva,
  },
  {
    clave: 'ingreso', grupo: 'orden', varios: false,
    icono: (ordenes) => (yaImpreso(ordenes) ? 'mdi-file-eye-outline' : 'mdi-printer'),
    texto: (ordenes) => (yaImpreso(ordenes) ? 'Ver ingreso' : 'Imprimir ingreso'),
    visible: (ordenes) => algunaViva(ordenes) && ordenes.every(esDeServicio),
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
