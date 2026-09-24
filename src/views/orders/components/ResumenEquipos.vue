<template>
  <span v-if="filas.length" class="text-body-2 text-medium-emphasis">
    <span class="font-weight-bold text-high-emphasis">{{ cuantosEquipos(filas.length) }}</span>
    <template v-if="porTipo"> · {{ resumenPorTipo(filas) }}</template>
  </span>
</template>

<script>
// "1 equipo", "3 equipos", "2 equipos añadidos". Tambien lo usa el aviso al guardar.
export function cuantosEquipos(n, participio = '') {
  const texto = `${n} ${n === 1 ? 'equipo' : 'equipos'}`
  if (!participio) return texto
  return `${texto} ${n === 1 ? participio : `${participio}s`}`
}
</script>

<script setup>
import { resumenPorTipo } from '@/utils/certificates/tipos'

defineProps({
  filas: { type: Array, required: true },
  // Solo servicio: el tipo decide de que serie sale el numero.
  porTipo: { type: Boolean, default: false },
})
</script>
