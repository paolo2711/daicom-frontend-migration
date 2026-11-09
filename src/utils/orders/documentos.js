import OrderDataService from '@/services/orders/orderDataService'

// OrderDocument.Tipo en el back.
export const ORDEN_DE_COMPRA = 1
export const VALORIZACION = 2
export const COTIZACION = 4

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

export function vincularCotizacion(ordenId, documentoId) {
  const datos = new FormData()
  datos.append('tipo', COTIZACION)
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
