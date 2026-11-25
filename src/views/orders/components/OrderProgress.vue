<template>
  <div v-if="viva(orden) && orden.progreso.total" class="mx-auto w-75">
    <div class="text-caption mb-1 font-weight-medium text-center text-no-wrap text-medium-emphasis">
      {{ orden.progreso.listos }} / {{ orden.progreso.total }} {{ listos }}
    </div>
    <v-progress-linear :model-value="(orden.progreso.listos / orden.progreso.total) * 100" height="5" rounded
                       color="primary" bg-color="grey" bg-opacity="0.15" />
  </div>
  <span v-else class="text-grey">---</span>
</template>

<script setup>
import { viva } from '@/utils/orders/estado'

// La barra de una fila de ordenes: lineas listas sobre lineas vivas (progreso_de en el back).
defineProps({
  orden: { type: Object, required: true },
  // Como se lee la cuenta: "1 / 4 devueltos".
  listos: { type: String, required: true },
})
</script>
