<template>
  <div v-if="tarjetas.length" class="resumen">
    <button v-for="t in tarjetas" :key="t.id" type="button" class="hoja tarjeta" :class="`ntone-${t.tono}`"
            @click="t.id === 'vencidos' ? emit('vencidos') : emit('ir', t.ruta)">
      <span class="tarjeta-cabeza">
        <span class="tarjeta-icono"><v-icon size="18">{{ t.icono }}</v-icon></span>
        <span class="tarjeta-titulo">{{ t.titulo }}</span>
      </span>
      <span class="tarjeta-numero">{{ t.total }}</span>
      <span class="tarjeta-detalle">{{ t.detalle }}</span>
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue'

// Una tarjeta por cada cosa pendiente que el back le manda a este usuario (ya filtradas por su rol) y una
// para lo vencido. El numero grande se lee de un vistazo; un clic lleva a la lista ya filtrada.
const props = defineProps({
  bloques: { type: Array, default: () => [] },
  vencidos: { type: Object, default: null },
})
const emit = defineEmits(['ir', 'vencidos'])

const tarjetas = computed(() => [
  ...(props.vencidos?.total ? [{ id: 'vencidos', titulo: 'Vencidos', icono: 'mdi-calendar-alert', tono: 'crit',
                                 total: props.vencidos.total, detalle: props.vencidos.detalle, ruta: null }] : []),
  ...props.bloques.map(b => ({ ...b, detalle: b.items[0] ? `${b.items[0].titulo} · ${b.items[0].detalle}` : '' })),
])
</script>

<style scoped>
.resumen {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(13rem, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}
.tarjeta {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  padding: 1rem;
  text-align: left;
  cursor: pointer;
  transition: background-color 0.15s;
}
.tarjeta:hover { background: rgb(var(--v-theme-panel)); }
.tarjeta:focus-visible { outline: 2px solid rgb(var(--v-theme-seleccion)); outline-offset: 2px; }
.tarjeta-cabeza { display: flex; align-items: center; gap: 0.5rem; }
.tarjeta-icono {
  display: flex; align-items: center; justify-content: center;
  width: 2rem; height: 2rem; border-radius: 50%;
  background: var(--ntone-bg); color: var(--ntone-fg);
}
.tarjeta-titulo { font-size: 0.8125rem; font-weight: 600; }
.tarjeta-numero {
  font-size: 2rem; font-weight: 600; line-height: 1.1;
  font-variant-numeric: tabular-nums; color: var(--ntone-fg);
}
.tarjeta-detalle {
  font-size: 0.75rem; color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
</style>
