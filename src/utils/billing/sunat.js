// Los estados de un comprobante ante SUNAT, los mismos de sunat.Comprobante.Estado en el back.
export const POR_ENVIAR = 'por_enviar'
export const ENVIADA = 'enviada'
export const ACEPTADA = 'aceptada'
export const RECHAZADA = 'rechazada'
export const ANULADA = 'anulada'
export const REVISAR = 'revisar'

export const ESTADOS = {
  [POR_ENVIAR]: { texto: 'Por enviar', color: 'deep-orange', icono: 'mdi-send-clock-outline' },
  [ENVIADA]: { texto: 'Esperando a SUNAT', color: 'orange', icono: 'mdi-timer-sand' },
  [ACEPTADA]: { texto: 'Aceptada por SUNAT', color: 'green', icono: 'mdi-check-circle-outline' },
  [RECHAZADA]: { texto: 'Rechazada por SUNAT', color: 'red', icono: 'mdi-close-circle-outline' },
  [ANULADA]: { texto: 'Anulada', color: 'grey', icono: 'mdi-cancel' },
  [REVISAR]: { texto: 'Revisar en SOL', color: 'purple', icono: 'mdi-alert-outline' },
}
