import CertificateDataService from '@/services/certificates/certificateDataService'
import { throttle } from '@/utils/throttle'

// Refresca la pildora de "pendientes de firma" con el numero real del server,
// con los avisos que pueden cambiarla y ningun otro.
export const AVISOS_QUE_LA_CAMBIAN = new Set(['RELOAD_TABLES', 'RELOAD_CERTIFICATES', 'cert_id'])
export const NOTIFICACIONES_QUE_LA_CAMBIAN = new Set(['firma_solicitada', 'qr_subido'])

let destino = null

const pedir = throttle(() => {
  const appStore = destino
  if (!appStore) return
  return CertificateDataService.getPendingSignaturesSummary()
    .then((r) => appStore.setPendingSignaturesCount(r.data.pending_signatures))
})

export function refreshPendingSignatures(appStore) {
  if (!appStore) return
  destino = appStore
  pedir()
}
