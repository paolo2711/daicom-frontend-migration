<template>
  <!-- El contador de caracteres dentro del campo (slot append-inner): flota en
       la esquina, asi no le quita ancho al texto, y aparece recien cerca del
       tope, mientras se escribe en ese campo. -->
  <span v-if="cerca" class="contador text-medium-emphasis text-no-wrap" :class="{ 'text-error': largo >= max }">
    {{ largo }}/{{ max }}
  </span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  valor: { type: String, default: '' },
  max: { type: Number, required: true },
})

// Desde que porcion del tope se muestra.
const AVISO_DESDE = 0.8

const largo = computed(() => (props.valor || '').length)
const cerca = computed(() => largo.value >= props.max * AVISO_DESDE)
</script>

<style scoped>
.contador {
  position: absolute;
  right: 0.5rem;
  bottom: 0.1rem;
  font-size: 0.65rem;
  line-height: 1;
  pointer-events: none;
  visibility: hidden;
}
.v-field--focused .contador { visibility: visible; }
</style>
