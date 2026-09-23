import { estaFirmado } from './estado'

// La entrega es la fecha, no una bandera aparte: sin fecha, no se entregó.
export function estaEntregado(cert) {
  return Boolean(cert?.sent_date)
}

// Solo se entrega lo que ya está firmado. Un borrador o un Excel recién
// convertido todavía no es un certificado: no hay nada que el cliente pueda
// haber recibido.
export function esEntregable(cert) {
  return estaFirmado(cert)
}
