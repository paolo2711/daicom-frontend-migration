<template>
  <tr :class="{ 'fila-con-error': error, 'fila-elegida': elegida }" class="fila-de-equipo" @click="emit('elegir')">
    <td class="text-no-wrap">
      <drag-handle v-bind="asa" class="mr-1" @click.stop />
      <span v-if="eq.registry_code" class="font-weight-medium">{{ eq.registry_code }}</span>
      <span v-else-if="eq.certificate_type" class="numero-estimado">{{ estimado }}</span>
    </td>
    <td class="text-break">
      <div class="font-weight-bold text-high-emphasis">{{ eq.name }}</div>
      <div v-if="eq.comentario" class="text-caption text-medium-emphasis comentario">{{ eq.comentario }}</div>
      <div v-if="error" class="text-caption text-error">{{ error }}</div>
    </td>
    <td class="text-truncate" :title="eq.lab_data?.name">{{ eq.lab_data?.code || eq.lab_data?.name || '—' }}</td>
    <td v-for="campo in CAMPOS" :key="campo" class="text-break">
      <span v-if="eq[campo]">{{ eq[campo] }}</span>
      <span v-else class="text-disabled text-no-wrap">No indica</span>
    </td>
    <td>
      <span v-if="tituloDelServicio">{{ tituloDelServicio }}</span>
      <span v-else class="text-error">Elegir servicio</span>
      <div v-if="otroTitular">
        <v-chip size="x-small" color="info" variant="tonal" prepend-icon="mdi-certificate-outline" class="titular mt-1"
                :title="`Certificado a nombre de ${eq.titular_data?.name}`">{{ eq.titular_data?.name }}</v-chip>
      </div>
    </td>
    <td class="text-right">
      <v-btn v-if="seQuita(eq)" icon="mdi-delete" variant="text" size="x-small" color="red" density="comfortable"
             title="Quitar" @click.stop="emit('borrar', indice)" />
    </td>
  </tr>
</template>

<script setup>
import { computed } from 'vue'
import DragHandle from '@/components/shared/DragHandle.vue'
import { seQuita, tituloDe, useOrderServices } from '@/composables/useOrderServices'

// Una fila de FormOrderService, como sale en el PDF del ingreso mas el servicio. Se edita en PanelOrderService.
const props = defineProps({
  eq: { type: Object, required: true },
  indice: { type: Number, required: true },
  estimado: { type: String, default: '' },
  error: { type: String, default: '' },
  elegida: { type: Boolean, default: false },
  // El cliente de la orden: el titular solo se muestra si es otro.
  cliente: { type: Object, default: null },
  // El asa(i) de useRowDrag.
  asa: { type: Object, required: true },
})
const emit = defineEmits(['elegir', 'borrar'])

const CAMPOS = ['marca', 'modelo', 'serie']
const { opciones } = useOrderServices()
const tituloDelServicio = computed(() => tituloDe(props.eq, opciones.value))
const otroTitular = computed(() => props.eq.titular && props.eq.titular !== props.cliente?.id)
</script>

<style scoped>
.fila-de-equipo { cursor: pointer; }
.fila-de-equipo > td {
  vertical-align: top;
  padding-top: 0.5rem !important;
  padding-bottom: 0.5rem !important;
  background: rgba(var(--v-theme-on-surface), 0.03);
  border-top: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-bottom: thin solid rgba(var(--v-border-color), var(--v-border-opacity)) !important;
}
.fila-de-equipo > td:first-child {
  border-left: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 0.75rem 0 0 0.75rem;
}
.fila-de-equipo > td:last-child {
  border-right: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 0 0.75rem 0.75rem 0;
}
.fila-elegida > td { background: rgba(var(--v-theme-info), 0.14); border-color: rgb(var(--v-theme-info)) !important; }
.titular { max-width: 12rem; }
.titular :deep(.v-chip__content) { display: block; overflow: hidden; text-overflow: ellipsis; }
.comentario { white-space: pre-line; }
</style>
