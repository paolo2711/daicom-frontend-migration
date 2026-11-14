<template>
  <tr :class="{ 'fila-con-error': error, 'fila-elegida': elegida }" class="fila-tarjeta" @click="emit('elegir')">
    <td class="text-medium-emphasis">{{ indice + 1 }}</td>
    <td class="text-break">
      <div v-if="item.description" class="font-weight-bold text-high-emphasis">{{ item.description }}</div>
      <div v-else class="text-error">Falta la descripción</div>
      <div v-if="item.observations" class="text-caption text-medium-emphasis">{{ item.observations }}</div>
      <div v-if="error" class="text-caption text-error">{{ error }}</div>
    </td>
    <td class="text-right">{{ item.quantity }}</td>
    <td class="text-right" :class="{ 'text-error': !Number(item.unit_price) }">
      {{ Number(item.unit_price) ? importe(item.unit_price) : 'Falta' }}
    </td>
    <td><v-chip v-if="item.incluye_igv" size="x-small" variant="tonal">Incluido</v-chip>
      <span v-else class="text-caption text-medium-emphasis">Más IGV</span></td>
    <td class="text-right font-weight-medium">{{ importe(importeDelItem) }}</td>
    <td class="text-right">
      <v-btn icon="mdi-delete" variant="text" size="x-small" color="red" density="comfortable" title="Quitar"
             @click.stop="emit('borrar', indice)" />
    </td>
  </tr>
</template>

<script setup>
// Una fila de DialogEmitInvoice, solo para leer: se edita en PanelServiceItem. El importe lo calcula el back.
import { importe } from '@/utils/money'

defineProps({
  item: { type: Object, required: true },
  indice: { type: Number, required: true },
  importeDelItem: { type: [Number, String], default: 0 },
  error: { type: String, default: '' },
  elegida: { type: Boolean, default: false },
})
const emit = defineEmits(['elegir', 'borrar'])
</script>
