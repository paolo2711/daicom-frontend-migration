// Los estados de una guia, los mismos de DispatchGuide.Estado en el back.
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

// Lo que se avisa despues de emitir o reintentar si no quedo aceptada; vacio si si.
const AVISOS = {
  [POR_ENVIAR]: () => 'SUNAT no respondió: queda por enviar y se reintentará sola.',
  [ENVIADA]: () => 'SUNAT todavía no responde: ábrala más tarde para ver si la aceptó.',
  [RECHAZADA]: (guia) => `SUNAT la rechazó: ${guia.respuesta.descripcion}`,
  [REVISAR]: (guia) => guia.respuesta.descripcion,
}
export const avisoDelEstado = (guia) => AVISOS[guia.estado]?.(guia) ?? ''

export const FILTRO_DE_ESTADO = Object.entries(ESTADOS).map(([id, e]) => ({ id, name: e.texto }))

// El codigo de SUNAT para "Otros": con el se puede escribir cual es.
export const OTROS = '13'

// Anulada en la app, falta darla de baja en SOL (bajas_pendientes en el back).
export const bajaPendienteEnSol = (guia) => guia.estado === ANULADA && !guia.baja_en_sol

export const itemVacio = () => ({ descripcion: '', detalle: '', cantidad: 1, peso: '', unidad: 'NIU' })
