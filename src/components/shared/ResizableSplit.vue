<template>
  <div v-if="mdAndUp" ref="contenedor" class="d-flex align-start" :class="{ 'sin-seleccion': arrastrando }">
    <div ref="lista" class="flex-shrink-0" :style="{ width: `${ancho}%` }">
      <slot />
    </div>
    <split-divider @pointerdown="empezarArrastre" />
    <div class="lado flex-grow-1">
      <slot name="lado" />
    </div>
  </div>
  <div v-else ref="apilado">
    <slot />
    <v-dialog v-model="abierto" fullscreen transition="dialog-bottom-transition">
      <div class="bg-background fill-height overflow-y-auto pa-2">
        <slot name="lado" />
      </div>
    </v-dialog>
  </div>
</template>

<script setup>
// Una lista con un panel al lado que se ensancha arrastrando el divisor. En pantalla angosta, el panel se abre
// a pantalla completa mientras `abierto`; lo cierra el mismo panel.
import { onUnmounted, ref, watch } from 'vue'
import { useDisplay } from 'vuetify'
import SplitDivider from '@/components/shared/SplitDivider.vue'
import { useSplitWidth } from '@/composables/useSplitWidth'

const props = defineProps({
  // Con que nombre se recuerda el ancho en esta pantalla.
  clave: { type: String, required: true },
  // % de la lista al principio; el panel no baja de `minimoDelPanel` rem.
  inicial: { type: Number, default: 65 },
  minimoDelPanel: { type: Number, default: 22 },
})
// Lo que mide la lista en rem, para que muestre mas o menos columnas.
const anchoDeLaLista = defineModel('anchoDeLaLista', { type: Number, default: 0 })
const abierto = defineModel('abierto', { type: Boolean, default: false })

const { mdAndUp } = useDisplay()
const { contenedor, lista, ancho, arrastrando, empezarArrastre, enRem } =
  useSplitWidth(props.clave, { inicial: props.inicial, minimoDelPanel: props.minimoDelPanel })
const minimo = `${props.minimoDelPanel}rem`

const apilado = ref(null)
const medir = (px) => { anchoDeLaLista.value = Math.round(px / enRem(1)) }
const medidor = new ResizeObserver(([{ borderBoxSize: [caja] }]) => medir(caja.inlineSize))
watch(() => lista.value || apilado.value, (el, antes) => {
  if (antes) medidor.unobserve(antes)
  if (!el) return
  medir(el.offsetWidth)
  medidor.observe(el)
}, { flush: 'post' })
onUnmounted(() => medidor.disconnect())
</script>

<style scoped>
.lado { min-width: v-bind(minimo); }
</style>
