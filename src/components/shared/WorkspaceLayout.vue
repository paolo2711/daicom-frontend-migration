<template>
  <!-- Prioridad: la lista siempre y la mas grande; el detalle al lado si cabe, si no encima
       mientras esta abierto; el apoyo a la izquierda o en una franja arriba. -->
  <div class="espacio-de-trabajo" :style="grilla">
    <section v-if="$slots.apoyo" class="hoja hoja-de-apoyo" style="grid-area: apoyo;">
      <slot name="apoyo" :apilado="disposicion === 'tres'" />
    </section>

    <section class="hoja d-flex flex-column overflow-hidden" style="grid-area: lista;">
      <slot name="lista" />
    </section>

    <section v-if="detalleAlLado" class="hoja hoja-de-apoyo d-flex flex-column overflow-hidden" style="grid-area: detalle;">
      <slot v-if="detalleAbierto" name="detalle" />
      <slot v-else name="sin-detalle" />
    </section>

    <template v-else-if="detalleAbierto">
      <div class="velo" @click="emit('cerrar')" />
      <section class="detalle-encima hoja hoja-de-apoyo d-flex flex-column overflow-hidden">
        <slot name="detalle" />
      </section>
    </template>
  </div>
</template>

<script setup>
import { computed, useSlots } from 'vue'
import { useDisplay } from 'vuetify'

// Pantalla de trabajo en tres zonas que se adapta al ancho con los cortes de Vuetify:
// tres desde xl, dos desde lg, una abajo.
defineProps({
  detalleAbierto: { type: Boolean, default: false },
})
const emit = defineEmits(['cerrar'])

const { xlAndUp, lgAndUp } = useDisplay()
const conApoyo = Boolean(useSlots().apoyo)
const disposicion = computed(() => {
  if (xlAndUp.value && conApoyo) return 'tres'
  return lgAndUp.value ? 'dos' : 'una'
})
const detalleAlLado = computed(() => disposicion.value !== 'una')

const GRILLAS = {
  tres: { columnas: '20rem minmax(0, 1fr) 24rem', zonas: ['apoyo lista detalle'] },
  dos: { columnas: 'minmax(0, 1fr) 24rem', zonas: conApoyo ? ['apoyo apoyo', 'lista detalle'] : ['lista detalle'] },
  una: { columnas: 'minmax(0, 1fr)', zonas: conApoyo ? ['apoyo', 'lista'] : ['lista'] },
}
const grilla = computed(() => {
  const { columnas, zonas } = GRILLAS[disposicion.value]
  return {
    gridTemplateColumns: columnas,
    gridTemplateAreas: zonas.map(z => `"${z}"`).join(' '),
    gridTemplateRows: zonas.length > 1 ? 'auto minmax(0, 1fr)' : 'minmax(0, 1fr)',
  }
})
</script>

<style scoped>
.espacio-de-trabajo {
  display: grid;
  gap: 0.75rem;
  flex-grow: 1;
  min-height: 0;
}
.velo {
  position: fixed;
  inset: 0;
  z-index: 9;
  background: rgba(0, 0, 0, 0.4);
}
.detalle-encima {
  position: fixed;
  top: 1rem;
  right: 1rem;
  bottom: 1rem;
  width: 24rem;
  max-width: calc(100vw - 2rem);
  z-index: 10;
}
</style>
