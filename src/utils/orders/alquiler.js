// RentalDetail.estado en el back. El color de la pildora del codigo y su leyenda.
export const ESTADOS_ALQUILER = {
  reservado: { texto: 'Reservado', varios: 'reservados', color: 'grey' },
  en_obra: { texto: 'En obra', varios: 'en obra', color: 'blue' },
  devuelto: { texto: 'Devuelto', varios: 'devueltos', color: 'green' },
  anulado: { texto: 'Anulado', varios: 'anulados', color: 'red' },
}

// "1 reservado · 2 en obra · 3 devueltos", en el orden del recorrido.
export function resumenPorEstado(lineas) {
  return Object.entries(ESTADOS_ALQUILER)
    .map(([estado, { texto, varios }]) => {
      const cuantos = lineas.filter(l => l.estado === estado).length
      return cuantos && `${cuantos} ${cuantos === 1 ? texto.toLowerCase() : varios}`
    })
    .filter(Boolean)
    .join(' · ')
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
