import Swal from 'sweetalert2'
import BillingDataService from '@/services/billing/billingDataService'
import { avisoDelEstado } from '@/utils/billing/guias'
import { avisarHecho } from '@/utils/documents/avisos'
import { mensajeDeError } from '@/utils/errors'

// Lo que resuelve una guia pendiente, desde la tabla de Guias o desde Tus pendientes: el mismo aviso en las dos.
// Devuelven la guia o null.

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

// Al abrir Guias o Inicio, en segundo plano: un error no se muestra, la proxima vez se reintenta.
export const reintentarLasPendientes = () => BillingDataService.retryPendingDispatchGuides().catch(() => null)
