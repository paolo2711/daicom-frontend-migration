<template>
  <tr :class="{ 'fila-con-error': error, 'fila-elegida': elegida, 'fila-grupo': grupo }" class="fila-tarjeta"
      @click="emit('elegir')">
    <td class="text-no-wrap">
      <drag-handle v-bind="asa" @click.stop />
      <v-btn icon="mdi-chevron-up" variant="text" size="x-small" density="comfortable" :disabled="primera" title="Subir"
             @click.stop="emit('mover', indice, -1)" />
      <v-btn icon="mdi-chevron-down" variant="text" size="x-small" density="comfortable" :disabled="ultima" title="Bajar"
             @click.stop="emit('mover', indice, 1)" />
    </td>
    <template v-if="grupo">
      <td colspan="6" class="font-weight-bold">
        <v-icon size="small" class="mr-1">mdi-format-list-group</v-icon>
        <span v-if="fila.description" class="titulo-de-grupo">{{ fila.description }}</span>
        <span v-else class="text-error">Falta el título del grupo</span>
        <div v-if="error" class="text-caption text-error font-weight-regular">{{ error }}</div>
      </td>
    </template>
    <template v-else>
      <td class="text-medium-emphasis">{{ numero }}</td>
      <td class="text-break">
        <span v-if="fila.description" class="font-weight-bold text-high-emphasis">{{ fila.description }}</span>
        <span v-else class="text-error">Falta la descripción</span>
        <v-chip v-if="fila.accreditation" size="x-small" variant="tonal" class="ml-1">{{ fila.accreditation }}</v-chip>
        <div v-if="fila.observations" class="text-caption text-medium-emphasis">{{ fila.observations }}</div>
        <div v-if="error" class="text-caption text-error">{{ error }}</div>
      </td>
      <td class="text-right">{{ fila.quantity }}</td>
      <td>{{ fila.unit }}</td>
      <td class="text-right" :class="{ 'text-error': !Number(fila.unit_price) }">
        {{ Number(fila.unit_price) ? importe(fila.unit_price) : 'Falta' }}
        <div v-if="fila.incluye_igv" class="text-caption text-medium-emphasis">Incluye IGV</div>
      </td>
      <td class="text-right font-weight-medium">{{ importe(importeDeLaFila) }}</td>
    </template>
    <td class="text-right">
      <v-btn icon="mdi-delete" variant="text" size="x-small" color="red" density="comfortable" title="Quitar"
             @click.stop="emit('borrar', indice)" />
    </td>
  </tr>
</template>

<script setup>
// Una fila de la cotizacion o valorizacion, solo para leer: se edita en el panel de la derecha.
import { computed } from 'vue'
import DragHandle from '@/components/shared/DragHandle.vue'
import { esGrupo } from '@/utils/documents/quoteDefaults'
import { importe } from '@/utils/money'

const props = defineProps({
  fila: { type: Object, required: true },
  indice: { type: Number, required: true },
  numero: { type: Number, default: null },
  importeDeLaFila: { type: [Number, String], default: 0 },
  primera: { type: Boolean, default: false },
  ultima: { type: Boolean, default: false },
  error: { type: String, default: '' },
  elegida: { type: Boolean, default: false },
  // El asa(i) de useRowDrag.
  asa: { type: Object, required: true },
})
const emit = defineEmits(['elegir', 'mover', 'borrar'])

const grupo = computed(() => esGrupo(props.fila))
</script>

<style scoped>
.fila-grupo > td { background-color: rgba(var(--v-theme-primary), 0.06); }
/* Como sale en el PDF; lo guardado queda como se escribio. */
.titulo-de-grupo { text-transform: uppercase; }
</style>
