<template>
  <div class="d-flex align-center ga-1">
    <div class="text-body-2 text-truncate flex-grow-1" :title="[titulo, detalle].filter(Boolean).join(' · ')">
      {{ titulo }}
      <span v-if="detalle" class="text-caption text-medium-emphasis">{{ titulo && '· ' }}{{ detalle }}</span>
    </div>
    <v-btn v-if="pdf" icon="mdi-file-pdf-box" size="small" variant="text" title="Abrir" @click="abrirPdf(pdf)" />
    <v-btn v-if="accion" v-bind="ACCIONES[accion]" size="small" variant="text" @click="emit('quitar')" />
    <slot><span v-if="!accion" class="sin-accion" /></slot>
  </div>
</template>

<script setup>
import { abrirPdf } from '@/utils/pdf'
import { ACCIONES } from '@/utils/attachments'

// Un documento adjunto, en una linea. El slot es para otra accion, a la derecha; sin ninguna, su lugar queda libre.
defineProps({
  titulo: { type: String, default: '' },
  detalle: { type: String, default: '' },
  // Su direccion, o el archivo elegido que todavia no se sube.
  pdf: { type: [String, File], default: null },
  // Como se quita: lo vinculado se desvincula y sigue existiendo; lo subido se elimina.
  accion: { type: String, default: '', validator: a => !a || a in ACCIONES },
})
const emit = defineEmits(['quitar'])
</script>

<style scoped>
.sin-accion { flex: 0 0 2.5rem; }
</style>
