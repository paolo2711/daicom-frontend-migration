<template>
  <span v-if="filas.length" class="text-body-2 text-medium-emphasis">
    <span class="font-weight-bold text-high-emphasis">{{ cuantos }}</span>
    <template v-if="porTipo && resumenPorTipo(filas)"> · {{ resumenPorTipo(filas) }}</template>
  </span>
</template>

<script setup>
import { computed } from 'vue'
import { resumenPorTipo } from '@/utils/certificates/tipos'

const props = defineProps({
  filas: { type: Array, required: true },
  // Solo servicio: el tipo decide de que serie sale el numero.
  porTipo: { type: Boolean, default: false },
})

const cuantos = computed(() => `${props.filas.length} ${props.filas.length === 1 ? 'equipo' : 'equipos'}`)
</script>
