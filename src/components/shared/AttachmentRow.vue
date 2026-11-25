<template>
  <div class="d-flex align-center">
    <div class="text-body-2 text-truncate flex-grow-1" :title="[titulo, detalle].filter(Boolean).join(' · ')">
      {{ titulo }}
      <span v-if="detalle" class="text-caption text-medium-emphasis">{{ titulo && '· ' }}{{ detalle }}</span>
    </div>
    <v-btn v-if="pdf" icon="mdi-file-pdf-box" v-bind="BOTON" title="Abrir" @click="abrirPdf(pdf)" />
    <div class="accion d-flex justify-center">
      <v-btn v-bind="{ ...BOTON, ...ACCIONES[accion] }" @click="emit('quitar')" />
    </div>
  </div>
</template>

<script setup>
import { abrirPdf } from '@/utils/pdf'
import { ACCIONES } from '@/utils/attachments'

// Un documento adjunto, en una linea.
defineProps({
  titulo: { type: String, default: '' },
  detalle: { type: String, default: '' },
  // Su direccion, o el archivo elegido que todavia no se sube.
  pdf: { type: [String, File], default: null },
  // Como se quita: lo vinculado se desvincula y sigue existiendo; lo subido se elimina.
  accion: { type: String, required: true, validator: a => a in ACCIONES },
})
const emit = defineEmits(['quitar'])

const BOTON = { size: 'small', variant: 'text', density: 'comfortable' }
</script>

<style scoped>
/* El ancho del boton que va al lado de un campo (AddNewButton), para que queden en la misma columna. */
.accion { flex: 0 0 2.5rem; }
</style>
