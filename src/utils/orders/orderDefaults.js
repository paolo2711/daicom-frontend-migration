import { sinPendientes } from '@/utils/orders/documentos'
import { SERVICIO } from '@/utils/orders/estado'

// La version del JSON de una orden sin guardar. Un campo nuevo sube el segundo numero; si cambia la forma de uno que
// ya estaba, en la orden o en sus filas, sube el primero.
export const CURRENT_ORDER_SCHEMA = '1.0'

// Un equipo nuevo de una orden de servicio, y de una de alquiler.
export const equipoDeServicio = () => ({
  modo: 'nuevo',
  name: '',
  lab: null,
  lab_data: null,
  tipo_servicio: null,
  certificate_type: null,
})
export const equipoDeAlquiler = () => ({
  modo: 'nuevo',
  equipment_id: null,
  internal_id: '',
  name: '',
  detalle: '',
  foto: '',
  departure_date: null,
  expected_return_date: null,
  delivery_notes: '',
})

const orderDefaultJSON = () => {
  const { cotizaciones, valorizaciones, guias } = sinPendientes()
  return {
    client: null,
    client_order_reference: '',
    observaciones: '',
    items: [],
    vinculos: { cotizaciones, valorizaciones, guias },
  }
}

// Una a medias de ese tipo: lo que falte, en ella o en sus filas, sale de los valores por defecto.
export const ordenDe = (guardada, tipo) => {
  const orden = { ...orderDefaultJSON(), ...guardada }
  const equipo = tipo === SERVICIO ? equipoDeServicio : equipoDeAlquiler
  return { ...orden, items: orden.items.map(item => ({ ...equipo(), ...item })) }
}
