// Certificate.CertificateStatus en el back.
const FIRMADO = 3
export const EN_NUBE = 4
export const ANULADO = 5

export function estaFirmado(cert) {
  return cert?.status === FIRMADO || cert?.status === EN_NUBE
}
