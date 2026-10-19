import { computed, ref } from 'vue'

// Reordenar una lista arrastrando sus filas. Solo el asa levanta la fila, asi
// los campos de adentro siguen seleccionando texto con el mouse.
export function useRowDrag(lista) {
  const origen = ref(null)
  // Donde caeria: antes de la fila con ese indice; lista.length es al final.
  const destino = ref(null)
  // Justo encima o debajo de si misma no se mueve: ahi no se marca nada.
  const marca = computed(() =>
    destino.value === origen.value || destino.value === origen.value + 1 ? null : destino.value)

  const mover = (desde, hasta) => {
    const [fila] = lista.value.splice(desde, 1)
    lista.value.splice(hasta, 0, fila)
  }

  const terminar = () => {
    origen.value = null
    destino.value = null
  }

  const soltar = () => {
    const desde = origen.value
    const antesDe = destino.value
    terminar()
    if (desde === null || antesDe === null) return
    const hasta = antesDe > desde ? antesDe - 1 : antesDe
    if (hasta !== desde) mover(desde, hasta)
  }

  const asa = (i) => ({
    draggable: 'true',
    onDragstart: (e) => {
      origen.value = i
      e.dataTransfer.effectAllowed = 'move'
      // Firefox no arrastra sin dato.
      e.dataTransfer.setData('text/plain', '')
      const fila = e.target.closest('[data-fila]')
      if (!fila) return
      const caja = fila.getBoundingClientRect()
      e.dataTransfer.setDragImage(fila, e.clientX - caja.left, e.clientY - caja.top)
    },
    onDragend: terminar,
  })

  // Solo recibe filas levantadas de esta misma lista: un archivo u otra tabla no.
  const arrastrable = (i) => ({
    'data-fila': '',
    class: {
      'fila-arrastrada': origen.value === i,
      'cae-antes': marca.value === i,
      'cae-despues': marca.value === i + 1 && i === lista.value.length - 1,
    },
    onDragover: (e) => {
      if (origen.value === null) return
      e.preventDefault()
      e.dataTransfer.dropEffect = 'move'
      const { top, height } = e.currentTarget.getBoundingClientRect()
      destino.value = e.clientY < top + height / 2 ? i : i + 1
    },
    onDragleave: (e) => {
      if (!e.currentTarget.contains(e.relatedTarget)) destino.value = null
    },
    onDrop: (e) => {
      if (origen.value === null) return
      e.preventDefault()
      soltar()
    },
  })

  // Clave estable de cada fila: con el indice como clave, al moverla su estado
  // (un menu abierto, un campo enfocado) se quedaria en la posicion.
  const claves = new WeakMap()
  let siguiente = 0
  const clave = (item) => {
    if (!claves.has(item)) claves.set(item, ++siguiente)
    return claves.get(item)
  }

  return { asa, arrastrable, clave, mover }
}
