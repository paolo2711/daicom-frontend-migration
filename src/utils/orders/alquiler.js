import { diasEntre, fechaCorta, hoyISO } from '@/utils/dates'

// `estado` lo manda el back (RentalDetail.estado); aca se decide como se ve.
export const ESTADOS_ALQUILER = {
  reservado: { texto: 'RESERVADO', color: 'grey' },
  en_obra:   { texto: 'EN OBRA',   color: 'blue-darken-1' },
  devuelto:  { texto: 'DEVUELTO',  color: 'success' },
  anulado:   { texto: 'ANULADO',   color: 'red-darken-2' },
}

// Los nombres de las tres fechas, iguales en todas las pantallas.
export const FECHAS_ALQUILER = {
  departure_date: 'Salió el',
  expected_return_date: 'Devolución pactada',
  actual_return_date: 'Volvió el',
}

export function salidaDe(linea) {
  if (linea.departure_date) return fechaCorta(linea.departure_date)
  return linea.estado === 'anulado' ? 'No salió' : 'Aún no sale'
}

const dias = (n) => `${n} ${n === 1 ? 'día' : 'días'}`

// Un alquiler cuenta al menos un dia, aunque vuelva el mismo dia.
export function duracionDe(linea) {
  if (linea.estado === 'en_obra') {
    return `${dias(Math.max(1, diasEntre(linea.departure_date, hoyISO())))} fuera`
  }
  if (linea.estado === 'devuelto') {
    return `Duró ${dias(Math.max(1, diasEntre(linea.departure_date, linea.actual_return_date)))}`
  }
  return ''
}
