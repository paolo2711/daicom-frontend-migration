import { ref, watch } from 'vue'
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

// El ancho de una lista con un panel al lado: se elige arrastrando el divisor, en % del espacio, y se recuerda
// en ese navegador con `clave`. La lista no se angosta hasta desplazarse de costado y el panel no baja de `minimo`.
export function useSplitWidth (clave, { inicial = 40, minimoDelPanel = 20 } = {}) {
  const contenedor = ref(null)
  const lista = ref(null)
  const arrastrando = ref(false)

  function leer () {
    try {
      const valor = Number(localStorage.getItem(clave))
      return valor > 0 && valor < 100 ? valor : inicial
    } catch {
      return inicial
    }
  }
  const ancho = ref(leer())
  watch(ancho, debounce((valor) => {
    try { localStorage.setItem(clave, String(valor)) } catch { /* sin almacenamiento: vale para esta visita */ }
  }))

  function empezarArrastre (e) {
    const divisor = e.currentTarget
    const zona = contenedor.value.getBoundingClientRect()
    const enPorcentaje = (medida) => (medida / zona.width) * 100
    const minimo = Math.ceil(enPorcentaje(minimoDeLaLista(lista.value)) * 10) / 10
    const maximo = Math.floor(enPorcentaje(zona.width - divisor.offsetWidth - enRem(minimoDelPanel)) * 10) / 10
    arrastrando.value = true
    divisor.setPointerCapture(e.pointerId)
    const mover = (ev) => {
      const porcentaje = Math.round(enPorcentaje(ev.clientX - zona.left) * 10) / 10
      ancho.value = Math.min(maximo, Math.max(minimo, porcentaje))
    }
    const soltar = () => {
      arrastrando.value = false
      divisor.removeEventListener('pointermove', mover)
      divisor.removeEventListener('pointerup', soltar)
      divisor.removeEventListener('pointercancel', soltar)
    }
    divisor.addEventListener('pointermove', mover)
    divisor.addEventListener('pointerup', soltar)
    divisor.addEventListener('pointercancel', soltar)
  }

  return { contenedor, lista, ancho, arrastrando, empezarArrastre, enRem }
}
