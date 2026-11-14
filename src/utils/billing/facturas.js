import Swal from 'sweetalert2'
import BillingDataService from '@/services/billing/billingDataService'
import { avisarHecho } from '@/utils/documents/avisos'
import { mensajeDeError } from '@/utils/errors'
import { importe, monto } from '@/utils/money'
import { vencimiento } from '@/utils/orders/cobro'
import { ABONADO, ANULADA, CREDITO, DEUDA, EN_PROCESO, ESTADOS, EXCEDIDO, PAGADO, tonoDe } from '@/utils/orders/estado'
import { ESTADOS as ESTADOS_SUNAT, POR_ENVIAR, REVISAR } from '@/utils/billing/sunat'

// Lo de una factura que comparten la pestaña Facturas y el panel de la orden.

export function estadoDe (factura) {
  const estado = ESTADOS[factura.estado] ? factura.estado : DEUDA
  return { ...tonoDe(estado), texto: ESTADOS[estado].texto }
}

// El icono de la pildora: de donde salio la factura. Lleva una alerta si falta algo con SUNAT.
export const TIPOS = {
  emitida: { texto: 'Emitida en la plataforma', icono: 'mdi-send-outline' },
  keyfacil: { texto: 'Subida de KeyFacil', icono: 'mdi-file-upload-outline' },
  interna: { texto: 'Sin comprobante', icono: 'mdi-lock-outline' },
  alerta: { texto: 'Falta algo con SUNAT', icono: 'mdi-alert' },
}
export function tipoDe (factura) {
  if (!factura.es_fiscal) return TIPOS.interna
  if (!factura.estado_sunat) return TIPOS.keyfacil
  if ([POR_ENVIAR, REVISAR].includes(factura.estado_sunat)) {
    return { ...TIPOS.alerta, texto: ESTADOS_SUNAT[factura.estado_sunat].texto }
  }
  if (factura.baja_en_proceso) return { ...TIPOS.alerta, texto: 'Baja en proceso: esperando a SUNAT' }
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
export const UNIDAD_DE_FACTURA = 'und'

export const FORMA_DE_PAGO = { EFECTIVO: 'efectivo', BILLETERA: 'billetera virtual', TRANSFERENCIA: 'transferencia' }

export const FILTRO_DE_ESTADO =[EN_PROCESO, DEUDA, CREDITO, ABONADO, PAGADO, EXCEDIDO, ANULADA]
  .map(id => ({ id, name: ESTADOS[id].texto }))

// El contenedor sin comprobante nace en 0 hasta su primer abono.
export const montoDe = (factura) => (factura.amount > 0 ? factura.amount : null)

export const anulada = (factura) => factura.status === ANULADA

// La columna Cobro: cuanto falta, lo abonado de lo que el cliente paga y la barra. La sin comprobante, lo cobrado.
export function cobroDe (factura) {
  const { por_cobrar: neto, total_pagado: pagado, saldo_pendiente: saldo, currency } = factura
  const abonos = `${factura.cantidad_de_abonos} ${factura.cantidad_de_abonos === 1 ? 'abono' : 'abonos'}`
  if (anulada(factura)) return { texto: 'Anulada', detalle: pagado > 0 ? abonos : '', porcentaje: null }
  if (!factura.es_fiscal) {
    return { texto: pagado > 0 ? `Cobrado ${monto(pagado, currency)}` : 'Sin abonos', detalle: '', porcentaje: null }
  }
  const porcentaje = neto > 0 ? Math.min(100, Math.round((pagado / neto) * 100)) : 0
  if (saldo < 0) return { texto: `Excedido ${monto(-saldo, currency)}`, detalle: abonos, porcentaje, tono: 'warning' }
  if (saldo === 0 && pagado > 0) return { texto: 'Pagada', detalle: abonos, porcentaje, tono: 'success' }
  return { texto: `Falta ${monto(saldo, currency)}`, porcentaje,
           detalle: pagado > 0 ? `Abonado ${importe(pagado)} de ${importe(neto)}` : 'Sin abonos' }
}

// Debajo de la fecha: contado, cuando vence o cuantos dias lleva vencida.
export function condicionDe (factura) {
  if (!factura.es_fiscal) return { texto: '' }
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
    detalle: 'Por enviar, por revisar en SOL o con la baja en proceso' },
]

const fallo = (titulo, porDefecto) => (error) => {
  Swal.fire({ icon: 'error', title: titulo, text: mensajeDeError(error, porDefecto) })
  return false
}

// Quita una orden de la factura; si era la ultima, el back borra la factura. True si se hizo.
export async function desvincular (factura, orden) {
  const { isConfirmed } = await Swal.fire({
    title: '¿Desvincular esta orden?', icon: 'question', showCancelButton: true,
    html: `Se quitará <b>${orden.order_number}</b> de la factura <b>${factura.invoice_number || 'sin número'}</b>.`
      + '<br>La factura y sus abonos se conservan.',
    confirmButtonText: 'Sí, desvincular', cancelButtonText: 'Cancelar',
  })
  if (!isConfirmed) return false
  return BillingDataService.deleteInvoice(factura.id, orden.order_id).then(() => {
    avisarHecho(`${orden.order_number} desvinculada`)
    return true
  }, fallo('No se desvinculó', 'No se pudo desvincular.'))
}

// Vincula las ordenes a la factura, sin monto. True si se hizo.
export function vincular (factura, ordenes) {
  return BillingDataService.linkInvoice(factura.id, ordenes.map(o => o.id)).then(() => {
    avisarHecho(`${factura.invoice_number || 'Factura'} vinculada`)
    return true
  }, fallo('No se vinculó', 'No se pudo vincular.'))
}
