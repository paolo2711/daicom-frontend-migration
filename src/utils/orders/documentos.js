import OrderDataService from '@/services/orders/orderDataService'
import { COTIZACION as DE_COTIZACION, VALORIZACION as DE_VALORIZACION } from '@/utils/documents/tipos'

// OrderDocument.Tipo en el back.
export const ORDEN_DE_COMPRA = 1
export const VALORIZACION = 2
export const COTIZACION = 4

// Las secciones que vinculan un documento del sistema (OrderDocument.DEL_SISTEMA). `campo`: el del pedido al
// crear la orden y el de los pendientes.
export const VINCULABLES = [
  { tipo: COTIZACION, documento: DE_COTIZACION, campo: 'cotizaciones' },
  { tipo: VALORIZACION, documento: DE_VALORIZACION, campo: 'valorizaciones' },
]

export const sinPendientes = () => ({ cotizaciones: [], valorizaciones: [], archivos: [] })

// Los ids que se vinculan al crear la orden, por campo del pedido.
export const vinculosAlCrear = (pendientes) =>
  Object.fromEntries(VINCULABLES.map(v => [v.campo, pendientes[v.campo].map(d => d.id)]))

// Los PDF de un alquiler que van uno solo por orden (campos de Order).
export const GUIAS = [
  { campo: 'dispatch_guide_pdf', texto: 'Guía de salida' },
  { campo: 'return_guide_pdf', texto: 'Guía de retorno' },
]

// Un PDF para la orden: `destino` es un tipo de OrderDocument o un campo de GUIAS.
export function subirArchivo(ordenId, { destino, numero, archivo }) {
  const datos = new FormData()
  if (typeof destino === 'number') {
    datos.append('tipo', destino)
    datos.append('numero', numero || '')
    datos.append('pdf', archivo)
    return OrderDataService.addDocument(ordenId, datos)
  }
  datos.append(destino, archivo)
  return OrderDataService.uploadInvoice(ordenId, datos)
}

export function vincularDocumento(ordenId, tipo, documentoId) {
  const datos = new FormData()
  datos.append('tipo', tipo)
  datos.append('documento', documentoId)
  return OrderDataService.addDocument(ordenId, datos)
}

// Los PDF elegidos al crear la orden, ya creada. Devuelve el nombre de los que no subieron.
export async function subirPendientes(ordenId, archivos) {
  const fallaron = []
  for (const pendiente of archivos) {
    try {
      await subirArchivo(ordenId, pendiente)
    } catch {
      fallaron.push(pendiente.archivo.name)
    }
  }
  return fallaron
}
