import Swal from 'sweetalert2'
import BillingDataService from '@/services/billing/billingDataService'
import { avisoDelEstado } from '@/utils/billing/guias'
import { ACEPTADA } from '@/utils/billing/sunat'
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
    avisarHecho(`${numero} reintentada`, { warning: avisoDelEstado(data) || data.warning })
    return data
  }, fallo('No se reintentó', 'No se pudo reintentar el envío.'))
}

export function reintentarFactura (id, numero) {
  return BillingDataService.retryInvoice(id).then(({ data }) => {
    avisarHecho(`${numero} reintentada`, { warning: data.estado_sunat === ACEPTADA ? '' : data.respuesta?.descripcion })
    return data
  }, fallo('No se reintentó', 'No se pudo reintentar el envío.'))
}

// Al abrir Guias o Inicio, en segundo plano: un error no se muestra, la proxima vez se reintenta.
export const reintentarLasPendientes = () => BillingDataService.retryPendingDispatchGuides().catch(() => null)
export const reintentarLasFacturasPendientes = () => BillingDataService.retryPendingInvoices().catch(() => null)
