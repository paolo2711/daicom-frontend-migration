import Swal from 'sweetalert2'
import BillingDataService from '@/services/billing/billingDataService'
import { avisarHecho } from '@/utils/documents/avisos'
import { itemVacio } from '@/utils/documents/quoteDefaults'
import { mensajeDeError } from '@/utils/errors'
import { importe, monto } from '@/utils/money'
import { vencimiento } from '@/utils/orders/cobro'
import { ABONADO, ANULADA, CREDITO, DEUDA, ESTADOS, EXCEDIDO, PAGADO, tonoDe } from '@/utils/orders/estado'
import { ACEPTADA as ACEPTADA_SUNAT, ESTADOS as ESTADOS_SUNAT, POR_ENVIAR, RECHAZADA, REVISAR } from '@/utils/billing/sunat'

// Lo de una factura que comparten la pestaña Facturas y el panel de la orden.

export function estadoDe (factura) {
  const estado = ESTADOS[factura.estado] ? factura.estado : DEUDA
  return { ...tonoDe(estado), texto: ESTADOS[estado].texto }
}

// El icono de la pildora: de donde salio la factura. Lleva una alerta si falta algo con SUNAT.
export const TIPOS = {
  emitida: { texto: 'Emitida en la plataforma', icono: 'mdi-send-outline' },
  keyfacil: { texto: 'Subida de KeyFacil', icono: 'mdi-file-upload-outline' },
  alerta: { texto: 'Falta algo con SUNAT', icono: 'mdi-alert' },
}
// La nota de credito que SUNAT todavia no acepto, si hay.
export const notaPendiente = (factura) => factura.notas?.find(n => n.estado !== ACEPTADA_SUNAT)

const SIN_COMPROBANTE = { texto: 'Sin comprobante', icono: 'mdi-file-remove-outline' }

export function tipoDe (factura) {
  if (!factura.es_fiscal) return SIN_COMPROBANTE
  if (!factura.estado_sunat) return TIPOS.keyfacil
  if ([POR_ENVIAR, RECHAZADA, REVISAR].includes(factura.estado_sunat)) {
    return { ...TIPOS.alerta, texto: ESTADOS_SUNAT[factura.estado_sunat].texto }
  }
  if (factura.baja_en_proceso) return { ...TIPOS.alerta, texto: 'Baja sin respuesta de SUNAT' }
  const nota = notaPendiente(factura)
  if (nota) return { ...TIPOS.alerta, texto: `Nota ${nota.numero}: ${ESTADOS_SUNAT[nota.estado].texto}` }
  return TIPOS.emitida
}

export const EMITIR = 'emitir'
export const SUBIR = 'subir'
// El boton de la pestaña Facturas: la de la app o una hecha en KeyFacil.
export const OPCIONES_NUEVA_FACTURA = [
  { valor: EMITIR, texto: 'Emitir factura', detalle: 'Con la serie de la app, ante SUNAT', icono: 'mdi-send-outline' },
  { valor: SUBIR, texto: 'Subir de KeyFacil', detalle: 'Su PDF, para cobrarla', icono: 'mdi-file-upload-outline' },
]

// La unidad de los items de la factura; a SUNAT va como servicio (ZZ).
const UNIDAD_DE_FACTURA = 'und'

// La version de lo que guarda cada formulario. Un campo nuevo sube el segundo numero; si cambia la forma de uno que ya
// estaba, en el o en sus items, sube el primero.
export const CURRENT_INVOICE_SCHEMA = '1.0'
export const CURRENT_CREDIT_NOTE_SCHEMA = '1.0'

export const itemDeFactura = () => ({ ...itemVacio(UNIDAD_DE_FACTURA), incluye_igv: false })
// Un item de la factura en su nota: si entra y cuanto tenia.
export const itemDeNota = (item) => ({ ...item, incluir: false, original: item.quantity })

export const DETRACCION = 'DETRACCION'
export const FORMAS_DE_PAGO = {
  TRANSFERENCIA: { texto: 'Transferencia', icono: 'mdi-bank-transfer' },
  EFECTIVO: { texto: 'Efectivo', icono: 'mdi-cash' },
  BILLETERA: { texto: 'Billetera', icono: 'mdi-cellphone-nfc' },
  [DETRACCION]: { texto: 'Detracción', icono: 'mdi-bank-outline' },
}
export const formaDePago = (abono) => FORMAS_DE_PAGO[abono.payment_method] || { texto: '', icono: 'mdi-cash-register' }

export const FILTRO_DE_ESTADO = [DEUDA, CREDITO, ABONADO, PAGADO, EXCEDIDO, ANULADA]
  .map(id => ({ id, name: ESTADOS[id].texto }))
export const TONOS_DE_FACTURA = Object.fromEntries([DEUDA, CREDITO, PAGADO, ANULADA].map(tonoDe).map(tono => [tono.texto, tono]))

export const montoDe = (factura) => (factura.amount > 0 ? factura.amount : null)

export const nombreDe = (factura) =>
  (factura.es_fiscal ? factura.invoice_number || 'Sin número' : SIN_COMPROBANTE.texto)

export const anulada = (factura) => factura.estado === ANULADA

// La columna Cobro: cuanto falta, lo abonado de lo que el cliente paga y la barra.
export function cobroDe (factura) {
  const { a_recibir: neto, total_pagado: pagado, saldo_pendiente: saldo, currency } = factura
  const abonos = `${factura.cantidad_de_abonos} ${factura.cantidad_de_abonos === 1 ? 'abono' : 'abonos'}`
  if (anulada(factura)) return { texto: 'Anulada', detalle: pagado > 0 ? abonos : '', porcentaje: null }
  const porcentaje = neto > 0 ? Math.min(100, Math.round((pagado / neto) * 100)) : 0
  if (saldo < 0) return { texto: `Excedido ${monto(-saldo, currency)}`, detalle: abonos, porcentaje, tono: 'warning' }
  if (saldo === 0 && pagado > 0) return { texto: 'Pagada', detalle: abonos, porcentaje, tono: 'success' }
  return { texto: `Falta ${monto(saldo, currency)}`, porcentaje,
           detalle: pagado > 0 ? `Abonado ${importe(pagado)} de ${importe(neto)}` : 'Sin abonos' }
}

// Debajo de la fecha: contado, cuando vence o cuantos dias lleva vencida.
export function condicionDe (factura) {
  if (factura.dias_de_atraso) {
    const dias = factura.dias_de_atraso
    return { texto: `${vencimiento(factura)} · ${dias} ${dias === 1 ? 'día' : 'días'}`, vencida: true }
  }
  return { texto: factura.es_credito ? vencimiento(factura) : 'Contado' }
}

// Las pildoras de la tabla; se prende una a la vez.
export const PILDORAS_DE_FACTURAS = [
  { valor: 'falta_pago', texto: 'Falta pago', color: 'error', icono: 'mdi-cash-remove',
    detalle: 'Facturas sin pagar del todo que ya hay que cobrar' },
  { valor: 'a_credito', texto: 'A crédito', color: 'teal', icono: 'mdi-calendar-clock',
    detalle: 'Facturas a crédito que todavía no vencen' },
  { valor: 'sunat', texto: 'Pendiente en SUNAT', color: 'warning', icono: 'mdi-alert-outline',
    detalle: 'No enviadas, por revisar en SOL, con la baja sin respuesta o una nota sin aceptar' },
]

const fallo = (titulo, porDefecto) => (error) => {
  Swal.fire({ icon: 'error', title: titulo, text: mensajeDeError(error, porDefecto) })
  return false
}

// Quita una orden ({ id, order_number }) de la factura. True si se hizo.
export async function desvincular (factura, orden) {
  const { isConfirmed } = await Swal.fire({
    title: '¿Desvincular esta orden?', icon: 'question', showCancelButton: true,
    html: `Se quitará <b>${orden.order_number}</b> de la factura <b>${factura.invoice_number || 'sin número'}</b>.`
      + '<br>La factura y sus abonos se conservan.',
    confirmButtonText: 'Sí, desvincular', cancelButtonText: 'Cancelar',
  })
  if (!isConfirmed) return false
  return BillingDataService.unlinkInvoice(factura.id, orden.id).then(() => {
    avisarHecho(`${orden.order_number} desvinculada`)
    return true
  }, fallo('No se desvinculó', 'No se pudo desvincular.'))
}

// Borra la factura con su PDF y sus abonos. True si se hizo.
export async function eliminar (factura) {
  const vinculadas = factura.ordenes_vinculadas.length
  const { isConfirmed } = await Swal.fire({
    title: '¿Eliminar esta factura?', icon: 'warning', showCancelButton: true,
    html: `<b>${factura.invoice_number || 'Sin número'}</b><br>`
      + (vinculadas ? `Está vinculada a ${vinculadas} ${vinculadas === 1 ? 'orden' : 'órdenes'}. ` : '')
      + 'Se eliminará la factura y todos sus abonos.',
    confirmButtonText: 'Sí, eliminar', cancelButtonText: 'Cancelar',
  })
  if (!isConfirmed) return false
  return BillingDataService.deleteInvoice(factura.id).then(() => {
    avisarHecho('Factura eliminada')
    return true
  }, fallo('No se eliminó', 'No se pudo eliminar.'))
}

// Vincula las ordenes a la factura, sin monto. True si se hizo.
export function vincular (factura, ordenes) {
  return BillingDataService.linkInvoice(factura.id, ordenes.map(o => o.id)).then(() => {
    avisarHecho(`${factura.invoice_number || 'Factura'} vinculada`)
    return true
  }, fallo('No se vinculó', 'No se pudo vincular.'))
}
