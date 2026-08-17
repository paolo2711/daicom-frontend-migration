<template>
  <!-- Zona de drop: overlay con marco punteado sobre el slot, valida y emite el/los File(s). -->
  <div
    class="pdf-drop-zone"
    @dragover.prevent="onDragOver"
    @dragleave.prevent="onDragLeave"
    @drop.prevent="onDrop"
  >
    <transition name="pdf-drop-fade">
      <div v-if="arrastrando" class="pdf-drop-overlay d-flex flex-column align-center justify-center">
        <v-icon size="48" color="primary">{{ icon }}</v-icon>
        <div class="text-body-1 font-weight-medium mt-2">{{ label }}</div>
      </div>
    </transition>

    <slot />
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  // Texto del overlay mientras se arrastra.
  label:    { type: String,  default: 'Suelta el PDF aquí' },
  // Mime aceptado: exacto ('application/pdf') o comodin ('image/*'). '*' = todo.
  accept:   { type: String,  default: 'application/pdf' },
  // Permite soltar varios archivos.
  multiple: { type: Boolean, default: false },
  icon:     { type: String,  default: 'mdi-file-upload-outline' },
})
// 'file' = primer archivo valido (compat); 'files' = todos los validos; 'invalid' = nada valido.
const emit = defineEmits(['file', 'files', 'invalid'])

const arrastrando = ref(false)

const acepta = (file) => {
  const a = props.accept
  if (!a || a === '*') return true
  if (a.endsWith('/*')) return file.type.startsWith(a.slice(0, -1)) // 'image/*' -> 'image/'
  return file.type === a
}

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
  const soltados = Array.from(e.dataTransfer?.files || [])
  const validos = soltados.filter(acepta)
  if (validos.length === 0) {
    emit('invalid')
    return
  }
  emit('file', validos[0])
  emit('files', props.multiple ? validos : [validos[0]])
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
