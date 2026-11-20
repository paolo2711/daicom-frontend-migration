import { ACEPTADA, ANULADA, ENVIADA, ESTADOS, POR_ENVIAR, RECHAZADA, REVISAR } from './sunat'

export { ACEPTADA, ANULADA, ENVIADA, ESTADOS, POR_ENVIAR, RECHAZADA, REVISAR }

export const FILTRO_DE_ESTADO = Object.entries(ESTADOS).map(([id, e]) => ({ id, name: e.texto }))

// El codigo de SUNAT para "Otros": con el se puede escribir cual es.
export const OTROS = '13'

// Anulada en la app, falta darla de baja en SOL (bajas_pendientes en el back).
export const bajaPendienteEnSol = (guia) => guia.estado === ANULADA && !guia.baja_en_sol

export const itemVacio = () => ({ descripcion: '', detalle: '', cantidad: 1, peso: '', unidad: 'NIU' })
// El largo que SUNAT recibe en la descripcion de un item (LARGO_ITEM del back).
export const LARGO_DE_LA_DESCRIPCION = 250
