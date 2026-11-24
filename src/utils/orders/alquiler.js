// `estado` lo manda el back (RentalDetail.estado); aca se decide como se ve.
export const ESTADOS_ALQUILER = {
  reservado: { texto: 'RESERVADO', color: 'grey' },
  en_obra:   { texto: 'EN OBRA',   color: 'blue-darken-1' },
  devuelto:  { texto: 'DEVUELTO',  color: 'success' },
  anulado:   { texto: 'ANULADO',   color: 'red-darken-2' },
}

// Los nombres de las tres fechas, iguales en todas las pantallas.
export const FECHAS_ALQUILER = {
  departure_date: 'Inicio',
  expected_return_date: 'Devolución pactada',
  actual_return_date: 'Volvió el',
}

// Reglas de las fechas de una linea, en el formato de :rules de Vuetify (true o
// el mensaje). El back revisa lo mismo al guardar (orders/services.py).
export const reglaNoFutura = (hoy) => (fecha) => !fecha || fecha <= hoy || 'No puede ser a futuro'
export const reglaNoAntesDe = (inicio) => (fecha) => !fecha || !inicio || fecha >= inicio || 'Es antes del inicio'

// Se quita lo reservado: una linea guardada solo si sigue reservada (quitar_alquiler en el back).
export const seQuitaElAlquiler = (fila) => fila.modo !== 'linea' || fila.estado === 'reservado'
