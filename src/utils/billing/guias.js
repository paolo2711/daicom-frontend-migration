import { ACEPTADA, ANULADA, ENVIADA, ESTADOS, POR_ENVIAR, RECHAZADA, REVISAR } from './sunat'

export { ACEPTADA, ANULADA, ENVIADA, ESTADOS, POR_ENVIAR, RECHAZADA, REVISAR }

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
