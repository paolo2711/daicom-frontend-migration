import CertificateDataService from '@/services/certificates/certificateDataService'

// Refresca la pildora de "pendientes de firma" con el numero real del server.
// Se llama cuando algo puede haber cambiado ese conteo (recarga de certificados,
// actualizacion de fila, o una notificacion de firma solicitada/firmada).
export function refreshPendingSignatures(appStore) {
  if (!appStore) return
  CertificateDataService.getPendingSignaturesSummary()
    .then((r) => appStore.setPendingSignaturesCount(r.data.pending_signatures))
    .catch(() => {})
}
