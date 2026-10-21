<template>
  <tr :class="{ 'fila-con-error': error }">
    <td class="text-no-wrap"><drag-handle v-bind="asa" class="mr-1" /><strong>{{ item.internal_id }}</strong></td>
    <td>
      {{ item.name }}
      <v-text-field v-model="item.delivery_notes" placeholder="Sin observaciones" variant="plain"
                    density="compact" hide-details class="observaciones" />
      <div v-if="error" class="text-caption text-error">{{ error }}</div>
    </td>
    <td>{{ item.series || '—' }}</td>
    <td>
      <v-text-field v-model="item.departure_date" type="date" :max="hoy" :rules="[reglaNoFutura(hoy)]"
                    :hint="item.departure_date ? '' : salidaDe(item)" persistent-hint
                    variant="plain" density="compact" hide-details="auto" />
    </td>
    <td>
      <v-text-field v-model="item.expected_return_date" type="date" :min="item.departure_date || undefined"
                    :rules="[reglaNoAntesDe(item.departure_date)]"
                    variant="plain" density="compact" hide-details="auto" />
    </td>
    <td class="text-right">
      <v-btn icon size="x-small" variant="text" color="red" density="comfortable" @click="emit('borrar', indice)">
        <v-icon>mdi-delete</v-icon>
      </v-btn>
    </td>
  </tr>
</template>

<script setup>
import DragHandle from '@/components/shared/DragHandle.vue'
import { hoyISO } from '@/utils/dates'
import { reglaNoAntesDe, reglaNoFutura, salidaDe } from '@/utils/orders/alquiler'

// Una fila de FormOrderRental. Es su propio componente para que editarla no redibuje las demas.
defineProps({
  item: { type: Object, required: true },
  indice: { type: Number, required: true },
  error: { type: String, default: '' },
  // El asa(i) de useRowDrag.
  asa: { type: Object, required: true },
})
const emit = defineEmits(['borrar'])

const hoy = hoyISO()
</script>

<style scoped>
.observaciones :deep(input) {
  font-size: 0.75rem;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  padding-top: 0;
}
</style>
