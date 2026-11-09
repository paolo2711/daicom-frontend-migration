<template>
  <tr :class="{ 'fila-con-error': error, 'fila-elegida': elegida }" class="fila-tarjeta" @click="emit('elegir')">
    <td class="text-no-wrap font-weight-bold">{{ eq.internal_id }}</td>
    <td class="text-break">
      <div class="font-weight-bold text-high-emphasis">{{ eq.name }}</div>
      <div v-if="detalle" class="text-caption text-medium-emphasis notas">{{ detalle }}</div>
      <div v-if="error" class="text-caption text-error">{{ error }}</div>
    </td>
    <td :class="{ 'text-medium-emphasis': !eq.departure_date }">{{ salidaDe(eq) }}</td>
    <td :class="{ 'text-medium-emphasis': !eq.expected_return_date }">
      {{ fechaCorta(eq.expected_return_date) || '—' }}
    </td>
    <td v-if="conEstado">
      <v-chip v-if="eq.estado" size="x-small" :color="ESTADOS_ALQUILER[eq.estado].color" variant="outlined" label>
        {{ ESTADOS_ALQUILER[eq.estado].texto }}
      </v-chip>
    </td>
    <td class="text-right">
      <v-btn v-if="seQuitaElAlquiler(eq)" icon="mdi-delete" variant="text" size="x-small" color="red"
             density="comfortable" title="Quitar" @click.stop="emit('borrar', indice)" />
    </td>
  </tr>
</template>

<script setup>
import { computed } from 'vue'
import { fechaCorta } from '@/utils/dates'
import { ESTADOS_ALQUILER, salidaDe, seQuitaElAlquiler } from '@/utils/orders/alquiler'

// Una fila de FormOrderRental, solo para leer: se edita en PanelOrderRental.
const props = defineProps({
  eq: { type: Object, required: true },
  indice: { type: Number, required: true },
  error: { type: String, default: '' },
  elegida: { type: Boolean, default: false },
  // Al ver uno guardado, la columna del estado.
  conEstado: { type: Boolean, default: false },
})
const emit = defineEmits(['elegir', 'borrar'])

const detalle = computed(() => [props.eq.series && `SN ${props.eq.series}`, props.eq.delivery_notes]
  .filter(Boolean).join(' · '))
</script>

<style scoped>
.notas { white-space: pre-line; }
</style>
