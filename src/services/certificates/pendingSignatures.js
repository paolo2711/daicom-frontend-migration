import CertificateDataService from '@/services/certificates/certificateDataService'
import { debounce } from '@/utils/debounce'

// Refresca la pildora de "pendientes de firma" con el numero real del server.
// Se llama cuando algo puede haber cambiado ese conteo (recarga de certificados,
// actualizacion de fila, o una notificacion de firma solicitada/firmada).
//
// Con freno: una tanda de avisos la pide una vez y no una por aviso.
let destino = null

const pedir = debounce(() => {
  const appStore = destino
  if (!appStore) return
  CertificateDataService.getPendingSignaturesSummary()
    .then((r) => appStore.setPendingSignaturesCount(r.data.pending_signatures))
    .catch(() => {})
}, 400)

export function refreshPendingSignatures(appStore) {
  if (!appStore) return
  destino = appStore
  pedir()
}
