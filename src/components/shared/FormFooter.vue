<template>
  <v-card-actions class="px-6 pb-4 pt-2 border-t-thin flex-shrink-0">
    <div class="d-flex flex-wrap align-center ga-2 columna-de-trabajo">
      <slot name="inicio" />
      <v-spacer />
      <v-btn variant="flat" class="font-weight-bold px-4" @click="emit('cancelar')">Cancelar</v-btn>
      <v-btn v-if="vista" variant="tonal" class="font-weight-bold px-4" prepend-icon="mdi-file-eye-outline"
             :loading="vista.armando" :disabled="!listo" @click="vista.ver">Vista previa</v-btn>
      <slot name="extra" />
      <v-btn color="primary" variant="flat" class="font-weight-bold px-4" :prepend-icon="icono"
             :loading="ocupado" :disabled="!listo" @click="emit('confirmar')">{{ accion }}</v-btn>
    </div>
  </v-card-actions>

  <pdf-preview-dialog v-if="vista" :model-value="vista.abierta" :url="vista.url">
    <template #encabezado>
      <v-icon class="mr-2">mdi-file-eye-outline</v-icon>
      <span class="text-subtitle-1 font-weight-bold text-truncate">Vista previa · {{ titulo }}</span>
    </template>
    <template #acciones>
      <v-btn variant="text" class="mr-2 font-weight-bold" prepend-icon="mdi-pencil" :disabled="ocupado"
             @click="vista.cerrar">Seguir editando</v-btn>
      <v-btn color="primary" variant="flat" class="font-weight-bold px-4" :prepend-icon="iconoEnVista || icono"
             :loading="ocupado" @click="emit(accionEnVista ? 'confirmar-en-vista' : 'confirmar')">
        {{ accionEnVista || accion }}
      </v-btn>
    </template>
  </pdf-preview-dialog>
</template>

<script setup>
// El pie de un formulario: cancelar, vista previa y su accion principal, tambien desde la vista previa.
// `vista` es usePdfPreview en un reactive; sin ella no hay vista previa.
import PdfPreviewDialog from '@/components/shared/PdfPreviewDialog.vue'

defineProps({
  accion: { type: String, required: true },
  icono: { type: String, default: 'mdi-content-save' },
  listo: { type: Boolean, default: false },
  ocupado: { type: Boolean, default: false },
  vista: { type: Object, default: null },
  titulo: { type: String, default: '' },
  // Cuando desde la vista previa se confirma otra cosa que desde el pie.
  accionEnVista: { type: String, default: '' },
  iconoEnVista: { type: String, default: '' },
})
const emit = defineEmits(['cancelar', 'confirmar', 'confirmar-en-vista'])
</script>
