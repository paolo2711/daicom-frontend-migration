import { ref } from 'vue'
import OrderDataService from '@/services/orders/orderDataService'

// Lo que se elige en cada equipo de una orden y el largo de lo que se anota al recibir, como
// lo define el back. Se pide una vez por pestaña: no cambia mientras se usa la app.
const opciones = ref([])
const largos = ref({})
const largoDeObservacion = ref(0)
let pedido = null

export function useOrderServices() {
  if (!pedido) {
    pedido = OrderDataService.servicios()
      .then(({ data }) => {
        opciones.value = data.opciones
        largos.value = data.largos_de_recepcion
        largoDeObservacion.value = data.largo_de_observacion
      })
      .catch(() => { pedido = null })
  }
  return { opciones, largos, largoDeObservacion }
}

const claveDe = (tipoServicio, tipoCertificado) => `${tipoServicio}-${tipoCertificado ?? ''}`

// La opcion de una fila; sin servicio elegido, ninguna.
export const opcionDe = (fila) => (fila.tipo_servicio ? claveDe(fila.tipo_servicio, fila.certificate_type) : null)

export const tituloDe = (fila, opciones) =>
  opciones.find(o => claveDe(o.tipo_servicio, o.certificate_type) === opcionDe(fila))?.title || ''

export const sinServicio = (filas) => filas.some(f => !f.tipo_servicio)

// Una linea guardada con certificado sale de la orden anulandolo o desvinculandolo.
export const seQuita = (fila) => !(fila.modo === 'linea' && fila.cert_id)

export function conOpcion(fila, clave, opciones) {
  const opcion = opciones.find(o => claveDe(o.tipo_servicio, o.certificate_type) === clave)
  if (!opcion) return
  fila.tipo_servicio = opcion.tipo_servicio
  fila.certificate_type = opcion.certificate_type
}

export const opcionPorClave = (clave) =>
  opciones.value.find(o => claveDe(o.tipo_servicio, o.certificate_type) === clave)

// Las que llevan certificado, para "Corregir tipo"; pide la lista si aun no llego.
export function opcionesConCertificado() {
  useOrderServices()
  return opciones.value.filter(o => o.certificate_type)
}

// Para un v-select: separadas las que llevan certificado de las que no.
export function itemsDeSeleccion(opciones) {
  const items = o => ({ value: claveDe(o.tipo_servicio, o.certificate_type), title: o.title })
  const con = opciones.filter(o => o.certificate_type)
  const sin = opciones.filter(o => !o.certificate_type)
  return [
    { type: 'subheader', title: 'Con certificado' }, ...con.map(items),
    { type: 'subheader', title: 'Sin certificado' }, ...sin.map(items),
  ]
}
