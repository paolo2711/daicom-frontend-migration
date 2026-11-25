// RentalDetail.estado en el back. El color de la pildora del codigo y su leyenda.
export const ESTADOS_ALQUILER = {
  reservado: { texto: 'Reservado', color: 'grey' },
  en_obra: { texto: 'En obra', color: 'blue' },
  devuelto: { texto: 'Devuelto', color: 'green' },
  anulado: { texto: 'Anulado', color: 'red' },
}

// Los nombres de las tres fechas, iguales en todas las pantallas.
export const FECHAS_ALQUILER = {
  departure_date: 'Inicio',
  expected_return_date: 'Devolución pactada',
  actual_return_date: 'Volvió el',
}

// Las que "Ver y editar" corrige de una linea guardada; las mismas que FECHAS_EDITABLES en el back.
export const FECHAS_EDITABLES = {
  reservado: ['expected_return_date'],
  en_obra: ['departure_date', 'expected_return_date'],
  devuelto: [],
}

// En el formato de :rules de Vuetify. El back revisa lo mismo al guardar (orders/services.py).
export const reglaObligatoria = (valor) => Boolean(valor) || 'Obligatorio'
export const reglaNoAntesDe = (inicio) => (fecha) => !fecha || !inicio || fecha >= inicio || 'Es antes del inicio'

// Se quita lo reservado: una linea guardada solo si sigue reservada (quitar_alquiler en el back).
export const seQuitaElAlquiler = (fila) => fila.modo !== 'linea' || fila.estado === 'reservado'

// Lo que se puede hacer con los equipos de un alquiler; los campos de cada accion, en utils/actions.js.
const algunoEn = (estado) => (lineas) => lineas.some(l => l.estado === estado)

export const ACCIONES_ALQUILER = [
  {
    clave: 'ver', grupo: 'ver', varios: false,
    icono: 'mdi-eye', texto: 'Ver equipo',
  },
  {
    clave: 'inicio', grupo: 'trabajo', varios: true,
    icono: 'mdi-calendar-start', texto: 'Registrar inicio',
    visible: algunoEn('reservado'),
  },
  {
    clave: 'devolucion', grupo: 'trabajo', varios: true,
    icono: 'mdi-calendar-check', texto: 'Registrar devolución',
    visible: algunoEn('en_obra'),
  },
  {
    clave: 'deshacer-devolucion', grupo: 'trabajo', varios: true,
    icono: 'mdi-undo', texto: 'Deshacer devolución',
    visible: algunoEn('devuelto'),
  },
  {
    clave: 'quitar', grupo: 'peligro', varios: true,
    icono: 'mdi-minus-circle-outline', texto: 'Quitar de la orden',
    visible: algunoEn('reservado'),
  },
]
