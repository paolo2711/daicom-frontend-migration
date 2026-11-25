import { ACEPTADA, ANULADA, ENVIADA, ESTADOS, POR_ENVIAR, RECHAZADA, REVISAR } from './sunat'

export { ACEPTADA, ANULADA, ENVIADA, ESTADOS, POR_ENVIAR, RECHAZADA, REVISAR }

export const FILTRO_DE_ESTADO = Object.entries(ESTADOS).map(([id, e]) => ({ id, name: e.texto }))

// El codigo de SUNAT para "Otros": con el se puede escribir cual es.
export const OTROS = '13'

// Anulada en la app, falta darla de baja en SOL (bajas_pendientes en el back).
export const bajaPendienteEnSol = (guia) => guia.estado === ANULADA && !guia.baja_en_sol

// La version de lo que guarda el formulario. Un campo nuevo sube el segundo numero; si cambia la forma de uno que ya
// estaba, en el o en sus items, sube el primero.
export const CURRENT_DISPATCH_GUIDE_SCHEMA = '1.0'

export const itemVacio = () => ({ descripcion: '', detalle: '', cantidad: 1, peso: '', unidad: 'NIU' })
// El largo que SUNAT recibe en la descripcion de un item (LARGO_ITEM del back).
export const LARGO_DE_LA_DESCRIPCION = 250
