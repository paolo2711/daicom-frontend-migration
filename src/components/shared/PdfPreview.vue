<template>
  <!-- El visor es el del navegador: nitido, con zoom, busqueda e impresion. -->
  <div class="pdf-preview">
    <iframe v-if="url" :key="url" :src="ruta" :title="titulo" />
    <div v-else class="d-flex align-center justify-center fill-height text-caption text-medium-emphasis">
      Sin PDF
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  url: { type: String, default: '' },
  titulo: { type: String, default: 'PDF' },
  // La hoja abre ocupando el ancho del visor en vez de al 100 %.
  alAncho: { type: Boolean, default: false },
})

// Por su ruta, del mismo origen que la pagina: el back no deja mostrar sus
// archivos dentro de otro sitio (X-Frame-Options SAMEORIGIN).
const ruta = computed(() => {
  const url = new URL(props.url, window.location.origin)
  return `${url.pathname}${url.search}${props.alAncho ? '#view=FitH' : ''}`
})
</script>

<style scoped>
.pdf-preview {
  position: relative;
  width: 100%;
  min-height: 0;
}
.pdf-preview iframe {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border: none;
  display: block;
}
</style>
