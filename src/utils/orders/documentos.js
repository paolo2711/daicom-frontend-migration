import BillingDataService from '@/services/billing/billingDataService'
import DocumentsDataService from '@/services/documents/documentsDataService'
import OrderDataService from '@/services/orders/orderDataService'
import { ESTADOS } from '@/utils/billing/guias'
import { fechaCorta } from '@/utils/dates'
import { DOCUMENTOS, TIPOS_DE_COTIZACION } from '@/utils/documents/quoteDefaults'
import { COTIZACION as DE_COTIZACION, VALORIZACION as DE_VALORIZACION } from '@/utils/documents/tipos'
import { mensajeDeError } from '@/utils/errors'
import { monto } from '@/utils/money'
import { porPagina } from '@/utils/pagination'

// OrderDocument.Tipo en el back.
export const ORDEN_DE_COMPRA = 1
export const VALORIZACION = 2
export const COTIZACION = 4
export const GUIA_REMISION = 5

// Un documento de Documentos (cotizacion o valorizacion) que se vincula; el hecho fuera se sube en Documentos.
function deDocumentos (tipo, documento, campo, anterior = null) {
  return {
    anterior,
    tipo, documento, campo, llave: 'documento', nombre: DOCUMENTOS[documento].nombre, plural: DOCUMENTOS[documento].plural,
    sinResultados: (kind) => `El cliente no tiene ${DOCUMENTOS[documento].plural.toLowerCase()} de ${kind} emitidas`,
    buscar: ({ cliente, kind, query, page, size }) => DocumentsDataService.getAll({
      document_type: documento, kind, status: 'EMITIDO', client: cliente,
      document_number: query || undefined, ...porPagina(page, size),
    }),
    aOpcion: (d) => ({
      id: d.id, name: d.document_number, pdf: d.pdf_file, tipo: TIPOS_DE_COTIZACION[d.kind]?.texto,
      detalle: `${fechaCorta(d.issue_date)} · ${monto(d.total_amount, d.currency)}`,
    }),
  }
}

// Las secciones que vinculan algo del sistema. `campo`: el del pedido al crear la orden y el de los pendientes; `llave`:
// el de OrderDocument; `anterior`: un PDF de Order que ya no se sube. La guia hecha fuera se sube en PDF (`enPdf`).
export const VINCULABLES = [
  deDocumentos(COTIZACION, DE_COTIZACION, 'cotizaciones', { campo: 'quote_pdf', texto: 'Cotización (anterior)' }),
  deDocumentos(VALORIZACION, DE_VALORIZACION, 'valorizaciones'),
  {
    tipo: GUIA_REMISION, campo: 'guias', llave: 'guia', nombre: 'guía', plural: 'Guías de remisión', enPdf: true,
    anterior: { campo: 'dispatch_guide_pdf', texto: 'Guía de salida (anterior)' },
    sinResultados: () => 'El cliente no tiene guías de remisión vigentes',
    buscar: ({ cliente, query, page, size }) => BillingDataService.listDispatchGuides({
      cliente, q: query || undefined, vigentes: true, ...porPagina(page, size),
    }),
    aOpcion: (g) => ({ id: g.id, name: g.numero, pdf: g.pdf, tipo: ESTADOS[g.estado].texto,
                       detalle: fechaCorta(g.fecha_emision) }),
  },
]

export const sinPendientes = () => ({ cotizaciones: [], valorizaciones: [], guias: [], archivos: [] })

// Los ids que se vinculan al crear la orden, por campo del pedido.
export const vinculosAlCrear = (pendientes) =>
  Object.fromEntries(VINCULABLES.map(v => [v.campo, pendientes[v.campo].map(d => d.id)]))

// El PDF de un alquiler que va uno solo por orden: un campo de Order.
export const GUIA_DE_RETORNO = 'return_guide_pdf'

// Un PDF para la orden: `destino` es un tipo de OrderDocument o GUIA_DE_RETORNO.
export function subirArchivo(ordenId, { destino, numero, archivo }) {
  const datos = new FormData()
  if (typeof destino === 'number') {
    datos.append('tipo', destino)
    datos.append('numero', numero || '')
    datos.append('pdf', archivo)
    return OrderDataService.addDocument(ordenId, datos)
  }
  datos.append(destino, archivo)
  return OrderDataService.subirGuia(ordenId, datos)
}

export function vincularDocumento(ordenId, { tipo, llave }, id) {
  const datos = new FormData()
  datos.append('tipo', tipo)
  datos.append(llave, id)
  return OrderDataService.addDocument(ordenId, datos)
}

// Los PDF elegidos al crear la orden, ya creada: los que no subieron, con su motivo, y el aviso de su copia en la red.
export async function subirPendientes(ordenId, archivos) {
  const fallaron = []
  let warning = ''
  for (const pendiente of archivos) {
    try {
      const { data } = await subirArchivo(ordenId, pendiente)
      warning = warning || data.warning
    } catch (error) {
      fallaron.push(`${pendiente.archivo.name}: ${mensajeDeError(error, 'no se pudo subir.')}`)
    }
  }
  return { fallaron, warning }
}
