<template>
  <div class="divisor-de-ancho" title="Arrastre para cambiar el ancho">
    <div ref="agarradera" class="agarradera">
      <v-icon size="14">mdi-drag-vertical</v-icon>
    </div>

    <teleport v-if="!visto && foco" to="body">
      <div class="guia-tapa" @click.stop @pointerdown.stop />
      <div class="guia-foco" :style="foco" />
      <v-card class="guia-tarjeta" :class="`guia-${lado}`" :style="tarjeta" rounded="xl" elevation="12">
        <div class="demo mb-4">
          <div class="demo-lista" />
          <div class="demo-barra"><v-icon size="12">mdi-drag-vertical</v-icon></div>
          <div class="demo-panel" />
        </div>
        <div class="text-subtitle-1 font-weight-bold mb-1">Ajusta el espacio a tu gusto</div>
        <div class="text-body-2 text-medium-emphasis">
          Arrastra la barra resaltada para darle más ancho a la lista o al panel. El ancho que elijas se queda guardado.
        </div>
        <div class="d-flex justify-end mt-4">
          <v-btn color="primary" variant="flat" class="text-none" @click="entendido">Entendido</v-btn>
        </div>
      </v-card>
    </teleport>
  </div>
</template>

<script setup>
// El divisor que se arrastra entre una lista y su panel. La primera vez lo resalta con una guia que solo se cierra
// con "Entendido"; queda vista en ese navegador para todas las pantallas.
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { enRem } from '@/composables/useSplitWidth'

const CLAVE = 'aviso.divisor'
// En rem: la tarjeta, lo que el foco rodea a la agarradera y lo que lo separa de la tarjeta.
const ANCHO_DE_TARJETA = 20
const HOLGURA = { lado: 0.5, alto: 2.5 }
const SEPARACION = 1.5

function leer () {
  try { return localStorage.getItem(CLAVE) === '1' } catch { return true }
}
const visto = ref(leer())
function entendido () {
  visto.value = true
  try { localStorage.setItem(CLAVE, '1') } catch { /* sin almacenamiento: vale para esta visita */ }
}

const agarradera = ref(null)
const caja = ref(null)
const medir = () => { caja.value = agarradera.value?.getBoundingClientRect() || null }

const foco = computed(() => caja.value && {
  left: `calc(${caja.value.left}px - ${HOLGURA.lado}rem)`, top: `calc(${caja.value.top}px - ${HOLGURA.alto}rem)`,
  width: `calc(${caja.value.width}px + ${2 * HOLGURA.lado}rem)`,
  height: `calc(${caja.value.height}px + ${2 * HOLGURA.alto}rem)`,
})
// A la derecha del divisor si entra; si no, a la izquierda.
const lado = computed(() => (caja.value && caja.value.right + enRem(SEPARACION + ANCHO_DE_TARJETA) > window.innerWidth
  ? 'izquierda' : 'derecha'))
const tarjeta = computed(() => caja.value && {
  width: `${ANCHO_DE_TARJETA}rem`,
  top: `${caja.value.top + caja.value.height / 2}px`,
  left: lado.value === 'derecha'
    ? `calc(${caja.value.right}px + ${SEPARACION}rem)`
    : `calc(${caja.value.left}px - ${SEPARACION + ANCHO_DE_TARJETA}rem)`,
})

onMounted(() => {
  if (visto.value) return
  requestAnimationFrame(medir)
  window.addEventListener('resize', medir)
  window.addEventListener('scroll', medir, { passive: true, capture: true })
})
onUnmounted(() => {
  window.removeEventListener('resize', medir)
  window.removeEventListener('scroll', medir, { capture: true })
})
</script>

<style scoped>
.divisor-de-ancho {
  align-self: stretch;
  width: 0.75rem;
  flex-shrink: 0;
  cursor: col-resize;
  touch-action: none;
  border-radius: 0.375rem;
}
.divisor-de-ancho:hover { background-color: rgba(var(--v-theme-primary), 0.08); }
/* La agarradera acompaña al bajar por la lista. */
.agarradera {
  position: sticky;
  top: 40vh;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 2.75rem;
  margin-top: 6rem;
  border-radius: 0.375rem;
  background: rgba(var(--v-theme-on-surface), 0.16);
  color: rgba(var(--v-theme-on-surface), 0.75);
}
.divisor-de-ancho:hover .agarradera { background: rgb(var(--v-theme-primary)); color: rgb(var(--v-theme-on-primary)); }
.guia-tapa { position: fixed; inset: 0; z-index: 2400; }
.guia-foco {
  position: fixed;
  z-index: 2401;
  pointer-events: none;
  border-radius: 0.75rem;
  outline: 0.125rem solid rgb(var(--v-theme-primary));
  /* El velo negro de los dialogos de Vuetify, en los dos temas. */
  box-shadow: 0 0 0 100vmax rgba(0, 0, 0, 0.55);
  animation: latir 1.6s ease-in-out infinite;
}
@keyframes latir { 50% { outline-offset: 0.25rem; } }
.guia-tarjeta { position: fixed; z-index: 2402; padding: 1.25rem; transform: translateY(-50%); overflow: visible; }
.guia-tarjeta::before {
  content: "";
  position: absolute;
  top: 50%;
  width: 0.875rem;
  height: 0.875rem;
  background: inherit;
  transform: translateY(-50%) rotate(45deg);
}
.guia-derecha::before { left: -0.4375rem; }
.guia-izquierda::before { right: -0.4375rem; }

.demo {
  display: flex;
  gap: 0.25rem;
  height: 4.5rem;
  padding: 0.5rem;
  border-radius: 0.75rem;
  background: rgba(var(--v-theme-on-surface), 0.06);
}
.demo-lista, .demo-panel { border-radius: 0.375rem; background: rgba(var(--v-theme-on-surface), 0.14); }
.demo-lista { width: 45%; animation: arrastrar 2.6s ease-in-out infinite; }
.demo-panel { flex: 1; background: rgba(var(--v-theme-primary), 0.25); }
.demo-barra {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 0.625rem;
  border-radius: 0.25rem;
  background: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
}
@keyframes arrastrar { 50% { width: 65%; } }
</style>
