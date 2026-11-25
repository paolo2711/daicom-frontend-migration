<template>
  <tr :class="{ 'fila-con-error': error, 'fila-elegida': elegida }" class="fila-tarjeta" @click="emit('elegir')">
    <td><equipment-photo :foto="eq.foto" /></td>
    <td><equipment-code :codigo="eq.internal_id" :estado="ESTADOS_ALQUILER[eq.estado]" /></td>
    <td class="text-break">
      <div class="font-weight-bold text-high-emphasis">{{ eq.name }}</div>
      <div v-if="eq.detalle" class="text-caption text-medium-emphasis">{{ eq.detalle }}</div>
      <div v-if="eq.delivery_notes" class="text-caption text-medium-emphasis notas">{{ eq.delivery_notes }}</div>
      <div v-if="error" class="text-caption text-error">{{ error }}</div>
    </td>
    <td :class="{ 'text-medium-emphasis': !eq.departure_date }">{{ fechaCorta(eq.departure_date) || '—' }}</td>
    <td class="text-right">
      <v-btn v-if="seQuitaElAlquiler(eq)" icon="mdi-delete" variant="text" size="x-small" color="red"
             density="comfortable" title="Quitar" @click.stop="emit('borrar', indice)" />
    </td>
  </tr>
</template>

<script setup>
import EquipmentCode from '@/components/shared/EquipmentCode.vue'
import EquipmentPhoto from '@/components/shared/EquipmentPhoto.vue'
import { fechaCorta } from '@/utils/dates'
import { ESTADOS_ALQUILER, seQuitaElAlquiler } from '@/utils/orders/alquiler'

// Una fila de FormOrderRental, solo para leer: se edita en PanelOrderRental.
defineProps({
  eq: { type: Object, required: true },
  indice: { type: Number, required: true },
  error: { type: String, default: '' },
  elegida: { type: Boolean, default: false },
})
const emit = defineEmits(['elegir', 'borrar'])
</script>

<style scoped>
.notas { white-space: pre-line; }
</style>
