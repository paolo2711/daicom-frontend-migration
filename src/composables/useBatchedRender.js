import { computed, nextTick, ref, watch } from 'vue'

// Lo que puede durar una tanda sin que la pantalla se sienta trabada (web.dev, "Optimize long tasks").
const MS_POR_TANDA = 50
const PRIMERA_TANDA = 5

const trasPintar = () => new Promise(listo => requestAnimationFrame(() => setTimeout(listo)))
// Safari no tiene scheduler.yield.
const ceder = () => (globalThis.scheduler?.yield ? globalThis.scheduler.yield() : new Promise(listo => setTimeout(listo)))

// Cuantas filas de `filas` se dibujan. Una lista nueva se arma por tandas, cediendo al navegador entre
// una y otra; la tanda se ajusta a lo que tarda esta PC. Armada, sigue a la lista tal cual.
export function useBatchedRender(filas) {
  const hasta = ref(0)
  const listo = ref(false)
  let vuelta = 0

  async function armar () {
    const mia = ++vuelta
    listo.value = filas.value.length <= PRIMERA_TANDA
    hasta.value = 0
    if (listo.value) return
    await trasPintar()
    let tanda = PRIMERA_TANDA
    while (mia === vuelta && hasta.value < filas.value.length) {
      const inicio = performance.now()
      hasta.value = Math.min(hasta.value + tanda, filas.value.length)
      await nextTick()
      tanda = Math.max(1, Math.round(tanda * MS_POR_TANDA / Math.max(performance.now() - inicio, 1)))
      await ceder()
    }
    if (mia === vuelta) listo.value = true
  }

  watch(filas, armar, { immediate: true })

  const visibles = computed(() => (listo.value ? filas.value : filas.value.slice(0, hasta.value)))
  return { visibles, hasta, listo }
}
