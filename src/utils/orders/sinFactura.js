import Swal from 'sweetalert2'
import { Toast } from '@/plugins/alerts'
import OrderDataService from '@/services/orders/orderDataService'
import { mensajeDeError } from '@/utils/errors'

// Las dos formas de NO facturar una orden, y la de volver a facturarla. Son las
// marcas de /orders/marcar-comprobante.
export const SIN_COMPROBANTE = 'sin_comprobante'
export const SIN_CARGO = 'sin_cargo'
const CON_FACTURA = 'con_factura'

// Una orden con factura fiscal ya emitida no se puede marcar de ninguna de las
// dos formas: primero hay que desvincular esa factura.
export const puedeMarcarse = (orden) => !orden.facturas?.tiene_fiscal

// La marca que tienen todas, o null: con una mezcla no hay una sola que mostrar.
export function marcaDe(ordenes) {
  if (!ordenes.length) return null
  if (ordenes.every(o => o.requiere_pago === false)) return SIN_CARGO
  if (ordenes.every(o => o.wants_invoice === false)) return SIN_COMPROBANTE
  return null
}

// Una llamada para todas; la que no se puede no frena a las demas. True si alguna se marco.
async function aplicar (ordenes, marca, exito, cobro) {
  let respuesta
  try {
    respuesta = await OrderDataService.marcarComprobante(ordenes.map(o => o.id), marca, cobro)
  } catch (err) {
    Swal.fire('No se pudo', mensajeDeError(err, 'No se pudo marcar.'), 'error')
    return false
  }

  const { aplicadas, rechazos } = respuesta.data
  if (rechazos.length) {
    Swal.fire({
      icon: aplicadas ? 'warning' : 'error',
      title: aplicadas ? `${aplicadas} sí, ${rechazos.length} no` : 'No se pudo',
      html: rechazos.join('<br>'),
      confirmButtonText: 'Entendido',
    })
    return aplicadas > 0
  }
  Toast.fire({ timer: 2400, icon: 'success', title: exito })
  return true
}

// Se cobra pero no lleva factura: en que moneda y cuanto.
export const marcarSinComprobante = (orden, currency, amount) =>
  aplicar([orden], SIN_COMPROBANTE, 'Marcada sin comprobante', { currency, amount })

// Lo que tenga marcado sin comprobante. Siempre sin abonos: con ellos, el servidor no deja marcar sin cargo.
const loQueSeDescarta = (ordenes) => (ordenes.some(o => puedeMarcarse(o) && o.facturas?.no_factura)
  ? '<br><br>Se descarta su monto a cobrar sin comprobante.' : '')

// Sin cargo no pregunta moneda: no hay nada que cobrar, asi que no nace ninguna
// factura donde guardarla.
async function marcarSinCargo (ordenes) {
  const n = ordenes.length
  const r = await Swal.fire({
    title: n === 1 ? '¿Sin cargo?' : `¿Sin cargo las ${n}?`,
    html: 'No se va a cobrar: no se genera factura ni se pueden registrar abonos. '
        + 'Es para equipos propios o trabajos de cortesía.' + loQueSeDescarta(ordenes),
    icon: 'question', showCancelButton: true,
    confirmButtonText: 'Sí, sin cargo', cancelButtonText: 'Cancelar',
  })
  if (!r.isConfirmed) return false
  await aplicar(ordenes, SIN_CARGO, n === 1 ? 'Marcada sin cargo' : `${n} marcadas sin cargo`)
  return true
}

// Vuelve a lo normal: requiere factura fiscal.
async function quitar (ordenes) {
  const r = await Swal.fire({
    title: '¿Quitar la marca?',
    html: 'La orden vuelve a requerir factura y se descarta su monto a cobrar.',
    icon: 'question', showCancelButton: true,
    confirmButtonText: 'Sí, quitar', cancelButtonText: 'Cancelar',
  })
  if (!r.isConfirmed) return false
  await aplicar(ordenes, CON_FACTURA, 'Marca quitada')
  return true
}

// Elegir la marca que ya tienen todas la quita y vuelven a requerir factura.
// Devuelve si se confirmo: las que cambiaron hay que repintarlas aunque otra
// haya fallado.
export function alternarMarca (clave, ordenes) {
  return marcaDe(ordenes) === clave ? quitar(ordenes) : marcarSinCargo(ordenes)
}
