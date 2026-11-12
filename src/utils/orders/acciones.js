import { SIN_CARGO, SIN_COMPROBANTE, marcaDe, puedeMarcarse } from '@/utils/orders/sinFactura'
import { COTIZACION, VALORIZACION } from '@/utils/documents/tipos'
import { esDeServicio, viva } from '@/utils/orders/estado'

// Lo que se puede hacer con ordenes. De aca salen la barra de seleccion y el
// menu (click derecho y boton de la fila). Los campos de cada una, en
// utils/actions.js. Una anulada no tiene ninguna.

const algunaViva = (ordenes) => ordenes.some(viva)
const yaImpreso = (ordenes) => ordenes.length === 1 && ordenes[0].tiene_ingreso
// Un documento tiene un solo cliente: con varios, el back tambien lo rechaza.
const deUnCliente = (ordenes) => new Set(ordenes.filter(viva).map(o => o.client_data?.id)).size === 1
const motivoDeClientes = (ordenes) => (deUnCliente(ordenes) ? '' : 'Son de clientes distintos')
const quitaOPone = (marca, texto) => (ordenes) => (marcaDe(ordenes) === marca ? `Quitar ${texto.toLowerCase()}` : texto)

export const VINCULAR = 'vincular'

export const GUIA = 'guia'

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
  // Con varias, un solo documento con los equipos de todas.
  {
    clave: COTIZACION, grupo: 'orden', varios: true,
    icono: 'mdi-file-document-edit-outline', texto: 'Cotizar', detalle: motivoDeClientes,
    visible: algunaViva, disponible: deUnCliente,
  },
  {
    clave: VALORIZACION, grupo: 'orden', varios: true,
    icono: 'mdi-receipt-text-outline', texto: 'Valorizar', detalle: motivoDeClientes,
    visible: algunaViva, disponible: deUnCliente,
  },
  {
    clave: GUIA, grupo: 'orden', varios: true,
    icono: 'mdi-truck-delivery-outline', texto: 'Guía de remisión', detalle: motivoDeClientes,
    visible: algunaViva, disponible: deUnCliente,
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
