// Estados del certificado (Certificate.CertificateStatus en el back).
const FIRMADO = 3
const EN_NUBE = 4

// La entrega es la fecha, no una bandera aparte: sin fecha, no se entregó.
export function estaEntregado(cert) {
  return Boolean(cert?.sent_date)
}

// Solo se entrega lo que ya está firmado. Un borrador o un Excel recién
// convertido todavía no es un certificado: no hay nada que el cliente pueda
// haber recibido.
export function esEntregable(cert) {
  return cert?.status === FIRMADO || cert?.status === EN_NUBE
}
