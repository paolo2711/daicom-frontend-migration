<template>
  <div class="d-flex flex-column ga-2">
    <div class="text-caption text-medium-emphasis">{{ etiqueta }}</div>
    <pdf-drop-zone :accept="accept" :label="esImagen ? 'Suelta la imagen aquí' : 'Suelta el PDF aquí'"
                   @file="soltado" @invalid="invalido = true">
      <div class="vista d-flex align-center justify-center rounded-lg"
           :class="{ 'bg-white': esImagen && vista, 'zona-de-archivos': !hayArchivo }">
        <v-img v-if="esImagen && vista" :src="vista" contain max-height="9rem" class="w-100" />
        <div v-else-if="hayArchivo" class="d-flex flex-column align-center ga-1 text-medium-emphasis">
          <v-icon size="40">mdi-file-pdf-box</v-icon>
          <span class="text-caption">{{ elegido ? elegido.name : 'Archivo actual' }}</span>
        </div>
        <div v-else class="d-flex flex-column align-center ga-1 text-disabled">
          <v-icon size="40">{{ icono }}</v-icon>
          <span class="text-caption">Arrastra el archivo aquí</span>
        </div>
      </div>
    </pdf-drop-zone>
    <div v-if="invalido" class="text-caption text-error">Ese archivo no es del tipo que va aquí.</div>
    <div class="d-flex align-center ga-2">
      <v-btn variant="tonal" size="small" :prepend-icon="hayArchivo ? 'mdi-swap-horizontal' : 'mdi-upload'"
             :disabled="disabled" @click="selector.click()">{{ hayArchivo ? 'Cambiar' : 'Subir' }}</v-btn>
      <v-btn v-if="actual && !esImagen" variant="text" size="small" prepend-icon="mdi-open-in-new" :href="actual"
             target="_blank">Ver el actual</v-btn>
      <span v-if="elegido" class="text-caption text-warning">Sin guardar</span>
    </div>
    <input ref="selector" type="file" :accept="accept" hidden @change="elegir">
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import PdfDropZone from '@/components/commonComponents/PdfDropZone.vue'

// Un archivo de la configuracion con su vista previa: el elegido o, si no hay, el guardado (`actual`).
// Una imagen se ve sobre blanco, tambien en oscuro: sale impresa en papel.
const elegido = defineModel({ type: [File, null], default: null })
const props = defineProps({
  etiqueta: { type: String, required: true },
  actual: { type: String, default: '' },
  accept: { type: String, default: 'image/png, image/jpeg' },
  icono: { type: String, default: 'mdi-image-outline' },
  disabled: { type: Boolean, default: false },
})

const selector = ref(null)
const esImagen = computed(() => props.accept.startsWith('image'))
const local = ref('')
const vista = computed(() => local.value || props.actual)
const hayArchivo = computed(() => Boolean(elegido.value || props.actual))

const invalido = ref(false)
function soltado (archivo) {
  invalido.value = false
  elegido.value = archivo
}
function elegir (e) {
  invalido.value = false
  elegido.value = e.target.files[0] || null
  e.target.value = ''
}
watch(elegido, (archivo) => {
  if (local.value) URL.revokeObjectURL(local.value)
  local.value = archivo && esImagen.value ? URL.createObjectURL(archivo) : ''
})
onBeforeUnmount(() => { if (local.value) URL.revokeObjectURL(local.value) })
</script>

<style scoped>
.vista {
  height: 10rem;
  padding: 0.5rem;
}
.vista:not(.zona-de-archivos) {
  background: rgba(var(--v-theme-on-surface), 0.04);
  border: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
}
</style>
