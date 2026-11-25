import { computed, onUnmounted, ref, watch } from 'vue'
import { debounce } from '@/utils/debounce'

export const enRem = (rem) => rem * parseFloat(getComputedStyle(document.documentElement).fontSize)

// Lo minimo que necesita la lista sin barra horizontal: se la deja sin ancho un
// instante, se mide lo que pide su tabla y se devuelve, antes de que se pinte.
function minimoDeLaLista (caja) {
  const envoltura = caja.querySelector('.v-table__wrapper')
  if (!envoltura) return 0
  const bordes = caja.offsetWidth - envoltura.clientWidth
  const antes = caja.style.width
  caja.style.width = '0'
  const tabla = envoltura.scrollWidth
  caja.style.width = antes
  return tabla + bordes
}

// El ancho de una lista con un panel al lado, en % del espacio: se elige arrastrando el divisor y se recuerda en ese
// navegador con `clave`. Siempre dentro de los limites: lo que pide la lista y, si no entran los dos, el del panel.
export function useSplitWidth (clave, { inicial = 40, minimoDelPanel = 20 } = {}) {
  const contenedor = ref(null)
  const lista = ref(null)
  const divisor = ref(null)
  const arrastrando = ref(false)

  function leer () {
    try {
      const valor = Number(localStorage.getItem(clave))
      return valor > 0 && valor < 100 ? valor : inicial
    } catch {
      return inicial
    }
  }
  const elegido = ref(leer())
  const limites = ref({ minimo: 0, maximo: 100 })
  const dentro = (valor) => Math.min(limites.value.maximo, Math.max(limites.value.minimo, valor))
  const ancho = computed(() => dentro(elegido.value))
  watch(elegido, debounce((valor) => {
    try { localStorage.setItem(clave, String(valor)) } catch { /* sin almacenamiento: vale para esta visita */ }
  }))

  // Sin divisor no hay panel al lado; sin ancho, la lista esta en una pestaña que no se ve.
  function medirLimites () {
    const total = contenedor.value?.offsetWidth
    if (!divisor.value || !total) return
    const enPorcentaje = (medida) => (medida / total) * 100
    limites.value = {
      minimo: Math.ceil(enPorcentaje(minimoDeLaLista(lista.value)) * 10) / 10,
      maximo: Math.floor(enPorcentaje(total - divisor.value.$el.offsetWidth - enRem(minimoDelPanel)) * 10) / 10,
    }
  }
  // La lista cambia de tamaño con la ventana, sus filas y lo que se abre en ellas.
  const medidor = new ResizeObserver(() => { if (!arrastrando.value) medirLimites() })
  watch(lista, (el, antes) => {
    if (antes) medidor.unobserve(antes)
    if (el) medidor.observe(el)
  }, { flush: 'post' })
  onUnmounted(() => medidor.disconnect())

  function empezarArrastre (e) {
    const agarrado = e.currentTarget
    const zona = contenedor.value.getBoundingClientRect()
    arrastrando.value = true
    agarrado.setPointerCapture(e.pointerId)
    const mover = (ev) => {
      elegido.value = dentro(Math.round(((ev.clientX - zona.left) / zona.width) * 1000) / 10)
    }
    const soltar = () => {
      arrastrando.value = false
      medirLimites()
      agarrado.removeEventListener('pointermove', mover)
      agarrado.removeEventListener('pointerup', soltar)
      agarrado.removeEventListener('pointercancel', soltar)
    }
    agarrado.addEventListener('pointermove', mover)
    agarrado.addEventListener('pointerup', soltar)
    agarrado.addEventListener('pointercancel', soltar)
  }

  return { contenedor, lista, divisor, ancho, arrastrando, empezarArrastre, enRem }
}
