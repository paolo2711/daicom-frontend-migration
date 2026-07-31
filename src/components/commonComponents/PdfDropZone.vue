<template>
  <!-- Drop de PDF: overlay con marco punteado sobre el slot, valida y emite el File. -->
  <div
    class="pdf-drop-zone"
    @dragover.prevent="onDragOver"
    @dragleave.prevent="onDragLeave"
    @drop.prevent="onDrop"
  >
    <transition name="pdf-drop-fade">
      <div v-if="arrastrando" class="pdf-drop-overlay d-flex flex-column align-center justify-center">
        <v-icon size="48" color="primary">mdi-file-upload-outline</v-icon>
        <div class="text-body-1 font-weight-medium mt-2">{{ label }}</div>
      </div>
    </transition>

    <slot />
  </div>
</template>

<script setup>
import { ref } from 'vue'

defineProps({
  // Texto del overlay mientras se arrastra.
  label: { type: String, default: 'Suelta el PDF aquí' },
})
// 'file' = PDF válido soltado; 'invalid' = se soltó algo que no es PDF.
const emit = defineEmits(['file', 'invalid'])

const arrastrando = ref(false)

const onDragOver = (e) => {
  if (e.dataTransfer?.types?.includes('Files')) arrastrando.value = true
}

// Solo apagamos el overlay cuando el cursor sale DE VERDAD de la zona (no al
// pasar sobre un hijo): si relatedTarget no está dentro, o sale por los bordes.
const onDragLeave = (e) => {
  const zone = e.currentTarget
  const salio = !e.relatedTarget || !zone.contains(e.relatedTarget)
  if (salio) arrastrando.value = false
}

const onDrop = (e) => {
  arrastrando.value = false
  const file = e.dataTransfer?.files?.[0]
  if (!file || file.type !== 'application/pdf') {
    emit('invalid')
    return
  }
  emit('file', file)
}
</script>

<style scoped>
.pdf-drop-zone {
  position: relative;
}
.pdf-drop-overlay {
  position: absolute;
  inset: 8px;
  z-index: 20;
  border: 2px dashed rgb(var(--v-theme-primary));
  border-radius: 12px;
  background: rgba(var(--v-theme-primary), 0.06);
  backdrop-filter: blur(2px);
  pointer-events: none;
}
.pdf-drop-fade-enter-active,
.pdf-drop-fade-leave-active { transition: opacity 0.15s ease; }
.pdf-drop-fade-enter-from,
.pdf-drop-fade-leave-to { opacity: 0; }
</style>
