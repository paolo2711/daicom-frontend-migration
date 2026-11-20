import { fechaCorta, hoyISO } from '@/utils/dates'

// Los estados de un comprobante ante SUNAT, los mismos de sunat.Comprobante.Estado en el back.
export const POR_ENVIAR = 'por_enviar'
export const ENVIADA = 'enviada'
export const ACEPTADA = 'aceptada'
export const RECHAZADA = 'rechazada'
export const ANULADA = 'anulada'
export const REVISAR = 'revisar'

export const ESTADOS = {
  [POR_ENVIAR]: { texto: 'No se envió', color: 'deep-orange', tono: 'warn', icono: 'mdi-send-clock-outline' },
  [ENVIADA]: { texto: 'Sin respuesta de SUNAT', color: 'orange', tono: 'warn', icono: 'mdi-timer-sand' },
  [ACEPTADA]: { texto: 'Aceptada por SUNAT', color: 'green', tono: 'teal', icono: 'mdi-check-circle-outline' },
  [RECHAZADA]: { texto: 'Rechazada por SUNAT', color: 'red', tono: 'crit', icono: 'mdi-close-circle-outline' },
  [ANULADA]: { texto: 'Anulada', color: 'grey', tono: 'blue', icono: 'mdi-cancel' },
  [REVISAR]: { texto: 'Revisar en SOL', color: 'purple', tono: 'purple', icono: 'mdi-alert-outline' },
}

// SUNAT recibe un comprobante hasta su `reintentar_hasta` (lo calcula el back); despues no se reintenta.
export const fueraDePlazo = (hasta) => Boolean(hasta) && hasta < hoyISO()
export const avisoDelPlazo = (hasta) => (fueraDePlazo(hasta)
  ? 'Venció el plazo de SUNAT. Se debe emitir una nueva.'
  : `Se puede reintentar hasta el ${fechaCorta(hasta)}.`)

// Lo que dijo SUNAT entre comillas y con su codigo; un aviso de APIsPERU, tal cual.
export const loQueDijo = (respuesta) => (respuesta?.codigo
  ? `Respuesta de SUNAT: «${respuesta.descripcion}» (${respuesta.codigo}).`
  : respuesta?.descripcion || '')

// La baja que SUNAT no acepto: lo que dijo y si la factura sigue vigente (lo confirma la consulta de validez).
export const rechazoDeLaBaja = (baja) => `${loQueDijo(baja)} ${baja.vigente
  ? 'La factura sigue vigente en SUNAT.' : 'Verificar el estado de la factura en SOL.'}`

// Una linea al terminar de emitir, reintentar o preguntar; vacia si quedo aceptada.
const AVISOS = {
  [POR_ENVIAR]: () => 'No llegó a SUNAT. Se puede reintentar desde su menú.',
  [ENVIADA]: () => 'SUNAT la recibió. Su respuesta está pendiente: se le puede preguntar desde su menú.',
  [RECHAZADA]: (respuesta) => `SUNAT la rechazó. ${loQueDijo(respuesta)}`,
  [REVISAR]: (respuesta) => `SUNAT la rechazó al reintentar. ${loQueDijo(respuesta)} Verificar en SOL si ya figura.`,
}
export const avisoDelEstado = (estado, respuesta) => AVISOS[estado]?.(respuesta) ?? ''
