<template>
  <tr :class="{ 'fila-con-error': error, 'fila-elegida': elegida }" class="fila-de-equipo" @click="emit('elegir')">
    <td class="text-no-wrap">
      <drag-handle v-bind="asa" class="mr-1" @click.stop />
      <span v-if="eq.modo === 'existente'" class="font-weight-medium">{{ eq.registry_code }}</span>
      <span v-else-if="eq.certificate_type" class="numero-estimado">{{ estimado }}</span>
    </td>
    <td class="text-break">
      <div class="font-weight-bold text-high-emphasis">{{ eq.name }}</div>
      <div v-if="eq.comentario" class="text-caption text-medium-emphasis comentario">{{ eq.comentario }}</div>
      <div v-if="error" class="text-caption text-error">{{ error }}</div>
    </td>
    <td v-for="campo in CAMPOS" :key="campo" class="text-break">
      <span v-if="eq[campo]">{{ eq[campo] }}</span>
      <span v-else class="text-disabled text-no-wrap">No indica</span>
    </td>
    <td>
      <span v-if="tituloDelServicio">{{ tituloDelServicio }}</span>
      <span v-else class="text-error">Elegir servicio</span>
    </td>
    <td class="text-right">
      <v-btn icon="mdi-delete" variant="text" size="x-small" color="red" density="comfortable" title="Quitar"
             @click.stop="emit('borrar', indice)" />
    </td>
  </tr>
</template>

<script setup>
import { computed } from 'vue'
import DragHandle from '@/components/shared/DragHandle.vue'
import { tituloDe, useOrderServices } from '@/composables/useOrderServices'

// Una fila de FormOrderService, como sale en el PDF del ingreso mas el servicio. Se edita en PanelOrderService.
const props = defineProps({
  eq: { type: Object, required: true },
  indice: { type: Number, required: true },
  estimado: { type: String, default: '' },
  error: { type: String, default: '' },
  elegida: { type: Boolean, default: false },
  // El asa(i) de useRowDrag.
  asa: { type: Object, required: true },
})
const emit = defineEmits(['elegir', 'borrar'])

const CAMPOS = ['marca', 'modelo', 'serie']
const { opciones } = useOrderServices()
const tituloDelServicio = computed(() => tituloDe(props.eq, opciones.value))
</script>

<style scoped>
.fila-de-equipo { cursor: pointer; }
.fila-de-equipo > td { vertical-align: top; padding-top: 0.5rem !important; padding-bottom: 0.5rem !important; }
.fila-elegida > td { background: rgba(var(--v-theme-info), 0.14); }
.fila-elegida > td:first-child { box-shadow: inset 0.25rem 0 0 rgb(var(--v-theme-info)); }
.comentario { white-space: pre-line; }
</style>
