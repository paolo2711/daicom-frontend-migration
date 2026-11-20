import Swal from 'sweetalert2'
import BillingDataService from '@/services/billing/billingDataService'
import { ANULADA, avisoDelEstado, rechazoDeLaBaja } from '@/utils/billing/sunat'
import { avisarHecho } from '@/utils/documents/avisos'
import { mensajeDeError } from '@/utils/errors'

// Lo que resuelve un comprobante pendiente, desde su tabla o desde Tus pendientes: el mismo aviso en las dos.
// Devuelven el comprobante o null.

const fallo = (titulo, porDefecto) => (error) => {
  Swal.fire({ icon: 'error', title: titulo, text: mensajeDeError(error, porDefecto) })
  return null
}

export function registrarBajaEnSol (id, numero) {
  return BillingDataService.confirmBajaEnSol(id).then(({ data }) => {
    avisarHecho(`${numero}: baja en SOL registrada`)
    return data
  }, fallo('No se registró', 'No se pudo registrar la baja.'))
}

export function reintentarEnvio (id, numero) {
  return BillingDataService.retryDispatchGuide(id).then(({ data }) => {
    avisarHecho(`${numero} reintentada`, { warning: avisoDelEstado(data.estado, data.respuesta) || data.warning })
    return data
  }, fallo('No se reintentó', 'No se pudo reintentar el envío.'))
}

export function reintentarFactura (id, numero) {
  return BillingDataService.retryInvoice(id).then(({ data }) => {
    avisarHecho(`${numero} reintentada`, { warning: avisoDelEstado(data.estado_sunat, data.respuesta) })
    return data
  }, fallo('No se reintentó', 'No se pudo reintentar el envío.'))
}

// Preguntar a SUNAT, a mano: despues de enviarlo ya no se le pregunta sola.
export function preguntarGuia (id, numero) {
  return BillingDataService.consultDispatchGuide(id).then(({ data }) => {
    avisarHecho(`${numero}: consultada a SUNAT`, { warning: avisoDelEstado(data.estado, data.respuesta) || data.warning })
    return data
  }, fallo('No se consultó', 'No se pudo preguntar a SUNAT.'))
}

export function preguntarFactura (id, numero) {
  return BillingDataService.consultInvoice(id).then(({ data }) => {
    const baja = data.respuesta?.baja
    const warning = data.baja_en_proceso ? 'SUNAT recibió la baja. Su respuesta está pendiente.'
      : (baja?.codigo && data.estado_sunat !== ANULADA ? `SUNAT no aceptó la baja. ${rechazoDeLaBaja(baja)}` : '')
    avisarHecho(`${numero}: consultada a SUNAT`, { warning })
    return data
  }, fallo('No se consultó', 'No se pudo preguntar a SUNAT.'))
}

export function reintentarNota (nota) {
  return BillingDataService.retryCreditNote(nota.id).then(({ data }) => {
    const enviada = data.notas.find(n => n.id === nota.id)
    avisarHecho(`${nota.numero} reintentada`, { warning: avisoDelEstado(enviada?.estado, enviada?.respuesta) })
    return data
  }, fallo('No se reintentó', 'No se pudo reintentar el envío.'))
}
