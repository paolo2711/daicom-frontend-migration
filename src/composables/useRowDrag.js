import { computed, onBeforeUnmount, ref } from 'vue'

// El navegador no desplaza si un encabezado fijo tapa el borde: se desplaza aca.
const ZONA = 0.15        // del alto de la lista, junto a cada borde
const VELOCIDAD = 1.5    // altos de la lista por segundo, pegado al borde

function areaQueSeDesplaza(elemento) {
  for (let nodo = elemento?.parentElement; nodo; nodo = nodo.parentElement) {
    if (/(auto|scroll)/.test(getComputedStyle(nodo).overflowY) && nodo.scrollHeight > nodo.clientHeight) return nodo
  }
  return document.scrollingElement
}

function bordesDe(area) {
  if (area === document.scrollingElement) return { top: 0, bottom: window.innerHeight, height: window.innerHeight }
  return area.getBoundingClientRect()
}

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

  // Mover la lista es caro y los dragover llegan de a varios por cuadro: el
  // evento solo anota el cursor y se desplaza una vez por cuadro, segun el tiempo.
  let area = null
  let cursor = 0
  let antes = 0
  let cuadro = 0
  const anotar = (e) => { cursor = e.clientY }
  function desplazar(ahora) {
    const segundos = Math.min(ahora - antes, 100) / 1000
    antes = ahora
    const { top, bottom, height } = bordesDe(area)
    const zona = height * ZONA
    const arriba = (top + zona - cursor) / zona
    const abajo = (cursor - (bottom - zona)) / zona
    const fuerza = Math.min(1, Math.max(arriba, abajo))
    if (fuerza > 0) area.scrollTop += (arriba > 0 ? -1 : 1) * fuerza * height * VELOCIDAD * segundos
    cuadro = requestAnimationFrame(desplazar)
  }

  const terminar = () => {
    origen.value = null
    destino.value = null
    if (area) {
      document.removeEventListener('dragover', anotar)
      cancelAnimationFrame(cuadro)
    }
    area = null
  }
  onBeforeUnmount(terminar)

  const soltar = () => {
    const desde = origen.value
    const antesDe = destino.value
    terminar()
    if (desde === null || antesDe === null) return
    const hasta = antesDe > desde ? antesDe - 1 : antesDe
    if (hasta !== desde) mover(desde, hasta)
  }

  // Los mismos objetos por posicion: una fila que es su propio componente no se
  // redibuja por recibir manejadores nuevos.
  const guardado = (cache, crear) => (i) => {
    if (!cache.has(i)) cache.set(i, crear(i))
    return cache.get(i)
  }

  const asa = guardado(new Map(), (i) => ({
    draggable: 'true',
    onDragstart: (e) => {
      origen.value = i
      e.dataTransfer.effectAllowed = 'move'
      // Firefox no arrastra sin dato.
      e.dataTransfer.setData('text/plain', '')
      const fila = e.target.closest('[data-fila]')
      if (!fila) return
      area = areaQueSeDesplaza(fila)
      cursor = e.clientY
      antes = performance.now()
      document.addEventListener('dragover', anotar)
      cuadro = requestAnimationFrame(desplazar)
      const caja = fila.getBoundingClientRect()
      e.dataTransfer.setDragImage(fila, e.clientX - caja.left, e.clientY - caja.top)
    },
    onDragend: terminar,
  }))

  const claseDe = (i) => {
    if (origen.value === i) return 'fila-arrastrada'
    if (marca.value === i) return 'cae-antes'
    if (marca.value === i + 1 && i === lista.value.length - 1) return 'cae-despues'
    return ''
  }

  // Solo recibe filas levantadas de esta misma lista: un archivo u otra tabla no.
  const arrastrable = guardado(new Map(), (i) => ({
    'data-fila': '',
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
  }))

  // Clave estable de cada fila: con el indice como clave, al moverla su estado
  // (un menu abierto, un campo enfocado) se quedaria en la posicion.
  const claves = new WeakMap()
  let siguiente = 0
  const clave = (item) => {
    if (!claves.has(item)) claves.set(item, ++siguiente)
    return claves.get(item)
  }

  return { asa, arrastrable, claseDe, clave, mover }
}
