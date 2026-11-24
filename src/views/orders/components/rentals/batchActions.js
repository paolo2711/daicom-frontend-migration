import { BLOQUEA, HECHO, NEUTRO } from '@/utils/batchLevels'
import { fechaCorta } from '@/utils/dates'
import { FECHAS_ALQUILER } from '@/utils/orders/alquiler'

// Los pasos de los equipos de un alquiler en BatchActionDialog. El back revisa lo mismo al guardar (orders/services.py).

const AHORA = {
  reservado: () => 'Reservado',
  en_obra: (linea) => `En obra desde ${fechaCorta(linea.departure_date)}`,
  devuelto: (linea) => `Devuelto ${fechaCorta(linea.actual_return_date)}`,
}

// Por que no: no le toca ese paso, o algo lo impide.
const noLeToca = (titulo) => ({ icono: 'mdi-minus-circle', nivel: NEUTRO, titulo })
const impedida = (titulo) => ({ icono: 'mdi-close-circle', nivel: BLOQUEA, titulo })

const YA_VOLVIO = noLeToca('Ya se devolvió')

// `porQueNo(linea, elegido)`: uno de esos dos, o nada; `resultado`: como queda la que se puede.
const paso = ({ porQueNo, resultado, ...accion }) => ({
  color: 'primary',
  ...accion,
  ahora: (linea) => AHORA[linea.estado](linea),
  impide: (linea, elegido) => Boolean(porQueNo(linea, elegido)),
  validacion: (linea, elegido) =>
    porQueNo(linea, elegido) || { icono: 'mdi-check-circle', nivel: HECHO, titulo: resultado },
})

export const PASOS = {
  inicio: paso({
    titulo: 'Registrar inicio',
    icono: 'mdi-calendar-start',
    descripcion: 'Cada equipo pasa a estar en obra y sus días se cuentan desde esa fecha.',
    verbo: 'Registrar',
    fecha: { label: FECHAS_ALQUILER.departure_date, vacia: true },
    hecho: 'Inicio registrado',
    resultado: 'Queda en obra',
    porQueNo: ({ estado, expected_return_date: pactada }, { fecha }) => {
      if (estado === 'devuelto') return YA_VOLVIO
      if (estado === 'en_obra') return noLeToca('Ya tiene inicio')
      return fecha && pactada && pactada < fecha ? impedida(`Su devolución pactada es el ${fechaCorta(pactada)}`) : null
    },
  }),

  devolucion: paso({
    titulo: 'Registrar devolución',
    icono: 'mdi-calendar-check',
    descripcion: 'Cada equipo queda devuelto y vuelve a estar disponible en el inventario.',
    verbo: 'Registrar',
    fecha: { label: FECHAS_ALQUILER.actual_return_date, permiteFutura: false },
    hecho: 'Devolución registrada',
    resultado: 'Queda devuelto',
    porQueNo: ({ estado, departure_date: inicio }, { fecha }) => {
      if (estado === 'devuelto') return YA_VOLVIO
      if (estado === 'reservado') return noLeToca('No tiene inicio')
      return fecha && fecha < inicio ? impedida(`Su inicio es el ${fechaCorta(inicio)}`) : null
    },
  }),

  'deshacer-devolucion': paso({
    titulo: 'Deshacer devolución',
    icono: 'mdi-undo',
    descripcion: 'Se borra la fecha en que volvió cada equipo, que figura en obra otra vez.',
    verbo: 'Deshacer',
    hecho: 'Devolución deshecha',
    resultado: 'Vuelve a estar en obra',
    porQueNo: ({ estado }) => (estado === 'devuelto' ? null : noLeToca('No está devuelto')),
  }),

  quitar: paso({
    titulo: 'Quitar de la orden',
    icono: 'mdi-minus-circle-outline',
    descripcion: 'Cada equipo sale de la orden y vuelve a estar disponible en el inventario.',
    verbo: 'Quitar',
    hecho: 'Quitado de la orden',
    resultado: 'Sale de la orden',
    porQueNo: ({ estado }) => {
      if (estado === 'devuelto') return YA_VOLVIO
      return estado === 'en_obra' ? impedida('Está en obra: registra su devolución') : null
    },
  }),
}
