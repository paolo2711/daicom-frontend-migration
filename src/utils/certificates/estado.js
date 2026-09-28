// Certificate.CertificateStatus en el back.
export const BORRADOR = 1
export const EN_PROCESO = 2
export const EN_NUBE = 4
export const ANULADO = 5

// Firmar pone el QR y lo sube en el mismo paso: firmado es estar en la nube.
export function estaFirmado(cert) {
  return cert?.status === EN_NUBE
}
