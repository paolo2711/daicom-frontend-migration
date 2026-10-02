import OrderDataService from '@/services/orders/orderDataService'
import { ANULADO } from '@/utils/certificates/estado'

// Los equipos de la orden abierta en la tabla de ordenes, en `fila[campo]`: los
// certificados de un servicio o las lineas de un alquiler.
//
// Un pedido a la vez por orden. Lo que llega mientras tanto se junta y sale en
// uno solo al terminar el anterior: una respuesta vieja nunca pisa a una nueva.
export function useOrderItems(orders, campo) {
  const pendientes = new Map()

  const filaDe = (orderId) => orders.value.find(o => String(o.id) === String(orderId))

  // Todos los de la orden. `mostrarCarga` deja la tabla en "Cargando..."
  // mientras: cuando la abre el usuario, no cuando la refresca un aviso.
  function cargarItems(orderId, { mostrarCarga = false } = {}) {
    if (!orderId) return
    const fila = filaDe(orderId)
    if (mostrarCarga && fila) fila[campo] = null
    encolar(orderId, { todos: true })
  }

  // Solo los certificados que cambiaron. Si alguno entro o salio de la orden,
  // o paso a anulado (va al final), se recarga entera.
  function actualizarItems(orderId, ids) {
    if (!orderId || !ids.length) return
    encolar(orderId, { ids })
  }

  // Las filas de la lista recargada son objetos nuevos y llegan sin sus
  // equipos: la abierta muestra los que ya tenia mientras se refrescan.
  function reemplazarOrdenes(nuevas, abierta) {
    const anteriores = filaDe(abierta)?.[campo]
    orders.value = nuevas
    const fila = filaDe(abierta)
    if (!fila) return
    fila[campo] = anteriores
    cargarItems(abierta)
  }

  function encolar(orderId, pedido) {
    const clave = String(orderId)
    let estado = pendientes.get(clave)
    if (!estado) {
      estado = { todos: false, ids: new Set(), corriendo: false }
      pendientes.set(clave, estado)
    }
    if (pedido.todos) estado.todos = true
    else pedido.ids.forEach(id => estado.ids.add(String(id)))
    if (!estado.corriendo) correr(clave, estado)
  }

  async function correr(clave, estado) {
    estado.corriendo = true
    while (estado.todos || estado.ids.size) {
      const todos = estado.todos
      const ids = [...estado.ids]
      estado.todos = false
      estado.ids.clear()
      if (todos) await traerTodos(clave)
      else if (!(await parchear(clave, ids))) estado.todos = true
    }
    pendientes.delete(clave)
  }

  async function traerTodos(orderId) {
    try {
      const { data } = await OrderDataService.getEquipos(orderId)
      const fila = filaDe(orderId)
      if (fila) fila[campo] = data || []
    } catch {
      const fila = filaDe(orderId)
      if (fila && fila[campo] == null) fila[campo] = []
    }
  }

  // true si alcanzo con reemplazar filas; false si hay que recargar la orden.
  async function parchear(orderId, ids) {
    if (!Array.isArray(filaDe(orderId)?.[campo])) return true

    let data
    try {
      ({ data } = await OrderDataService.getEquipos(orderId, ids))
    } catch {
      // Sin respuesta no hay nada que aplicar: el proximo aviso vuelve a pedir.
      return true
    }

    const actuales = filaDe(orderId)?.[campo]
    if (!Array.isArray(actuales)) return true
    const posicion = new Map(actuales.map((item, i) => [String(item.id), i]))
    const llegaron = new Set(data.map(item => String(item.id)))
    const indice = (item) => posicion.get(String(item.id))

    if (data.some(item => indice(item) === undefined)) return false          // entro
    if (ids.some(id => posicion.has(id) && !llegaron.has(id))) return false  // salio
    if (data.some(item => (item.status === ANULADO) !== (actuales[indice(item)].status === ANULADO))) return false

    // La fila entera: un dato que dejo de venir (el dueño, por ejemplo) no queda pegado.
    data.forEach(item => actuales.splice(indice(item), 1, item))
    return true
  }

  return { cargarItems, actualizarItems, reemplazarOrdenes }
}
