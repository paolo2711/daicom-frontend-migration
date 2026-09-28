// Certificate.CertificateStatus en el back.
export const BORRADOR = 1
export const EN_PROCESO = 2
export const EN_NUBE = 4
export const ANULADO = 5

// Lo mismo en la pildora del codigo, la leyenda y la ficha.
export const ESTADOS = {
  [BORRADOR]: { texto: 'Borrador (Sin Excel)', color: 'grey' },
  [EN_PROCESO]: { texto: 'En Proceso (Con Excel)', color: 'orange' },
  [EN_NUBE]: { texto: 'Listo (En Nube / QR)', color: 'green' },
  [ANULADO]: { texto: 'Anulado', color: 'red' },
}

export const estadoDe = (cert) => ESTADOS[cert?.status] || ESTADOS[BORRADOR]

// Firmar pone el QR y lo sube en el mismo paso: firmado es estar en la nube.
export function estaFirmado(cert) {
  return cert?.status === EN_NUBE
}
