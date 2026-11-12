import BillingDataService from '@/services/billing/billingDataService'
import DocumentsDataService from '@/services/documents/documentsDataService'
import OrderDataService from '@/services/orders/orderDataService'
import { ESTADOS } from '@/utils/billing/guias'
import { fechaCorta } from '@/utils/dates'
import { DOCUMENTOS, TIPOS_DE_COTIZACION } from '@/utils/documents/quoteDefaults'
import { COTIZACION as DE_COTIZACION, VALORIZACION as DE_VALORIZACION } from '@/utils/documents/tipos'
import { monto } from '@/utils/money'

// OrderDocument.Tipo en el back.
export const ORDEN_DE_COMPRA = 1
export const VALORIZACION = 2
export const COTIZACION = 4
export const GUIA_REMISION = 5

// Un documento de Documentos (cotizacion o valorizacion) que se vincula; el hecho fuera se sube en Documentos.
function deDocumentos (tipo, documento, campo) {
  return {
    tipo, documento, campo, llave: 'documento', nombre: DOCUMENTOS[documento].nombre, plural: DOCUMENTOS[documento].plural,
    sinResultados: (kind) => `El cliente no tiene ${DOCUMENTOS[documento].plural.toLowerCase()} de ${kind} emitidas`,
    buscar: ({ cliente, kind, query, page, size }) => DocumentsDataService.getAll({
      document_type: documento, kind, status: 'EMITIDO', client: cliente,
      document_number: query || undefined, page, itemsPerPage: size,
    }),
    aOpcion: (d) => ({
      id: d.id, name: d.document_number, pdf: d.pdf_file, tipo: TIPOS_DE_COTIZACION[d.kind]?.texto,
      detalle: `${fechaCorta(d.issue_date)} · ${monto(d.total_amount, d.currency)}`,
    }),
  }
}

// Las secciones que vinculan algo del sistema. `campo`: el del pedido al crear la orden y el de los pendientes;
// `llave`: el campo de OrderDocument. La guia hecha fuera se sube en PDF a la misma seccion.
export const VINCULABLES = [
  deDocumentos(COTIZACION, DE_COTIZACION, 'cotizaciones'),
  deDocumentos(VALORIZACION, DE_VALORIZACION, 'valorizaciones'),
  {
    tipo: GUIA_REMISION, campo: 'guias', llave: 'guia', nombre: 'guía', plural: 'Guías de remisión', enPdf: true,
    sinResultados: () => 'El cliente no tiene guías de remisión vigentes',
    buscar: ({ cliente, query, page, size }) => BillingDataService.listDispatchGuides({
      cliente, q: query || undefined, vigentes: true, page, itemsPerPage: size,
    }),
    aOpcion: (g) => ({ id: g.id, name: g.numero, pdf: g.pdf, tipo: ESTADOS[g.estado].texto,
                       detalle: fechaCorta(g.fecha_emision) }),
  },
]

export const sinPendientes = () => ({ cotizaciones: [], valorizaciones: [], guias: [], archivos: [] })

// Los ids que se vinculan al crear la orden, por campo del pedido.
export const vinculosAlCrear = (pendientes) =>
  Object.fromEntries(VINCULABLES.map(v => [v.campo, pendientes[v.campo].map(d => d.id)]))

// Los PDF de un alquiler que van uno solo por orden (campos de Order). La de salida es de antes: las de ahora
// son guías de remisión.
export const GUIAS = [
  { campo: 'dispatch_guide_pdf', texto: 'Guía de salida (anterior)', anterior: true },
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

export function vincularDocumento(ordenId, { tipo, llave }, id) {
  const datos = new FormData()
  datos.append('tipo', tipo)
  datos.append(llave, id)
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
