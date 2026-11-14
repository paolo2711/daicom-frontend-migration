<template>
  <v-navigation-drawer :model-value="Boolean(comprobante)" location="end" :width="ANCHO" :scrim="false" floating
                       class="border-s-thin">
    <div v-if="comprobante" class="d-flex flex-column ga-4 pa-4">
      <div class="d-flex align-start ga-2">
        <div class="flex-grow-1">
          <div class="text-subtitle-1 font-weight-bold">{{ comprobante.numero }}</div>
          <div class="text-caption text-medium-emphasis">{{ comprobante.cliente }}</div>
        </div>
        <v-btn icon="mdi-close" variant="text" size="small" density="comfortable" title="Cerrar"
               @click="emit('cerrar')" />
      </div>

      <div class="estado pa-3 rounded-lg">
        <div class="d-flex align-center ga-2 font-weight-bold" :class="`text-${estado.color}`">
          <v-progress-circular v-if="estado.enCurso" indeterminate size="18" width="2" />
          <v-icon v-else size="20">{{ estado.icono }}</v-icon>
          <span>{{ estado.texto }}</span>
        </div>
        <div class="text-caption text-medium-emphasis mt-1">{{ estado.detalle }}</div>
      </div>

      <div>
        <div v-for="[titulo, valor] in filas" :key="titulo" class="dato">
          <span class="text-medium-emphasis">{{ titulo }}</span><span>{{ valor }}</span>
        </div>
      </div>

      <div v-if="rechazada" class="d-flex">
        <v-btn color="primary" variant="flat" class="flex-grow-1 text-none" prepend-icon="mdi-pencil"
               :disabled="!corregible" @click="emit('corregir')">Corregir</v-btn>
      </div>
      <div v-else class="botones">
        <v-btn variant="outlined" class="text-none" prepend-icon="mdi-file-pdf-box" :disabled="!comprobante.pdf"
               @click="emit('ver-pdf')">Ver PDF</v-btn>
        <v-btn variant="outlined" class="text-none" prepend-icon="mdi-download" :disabled="!comprobante.pdf"
               @click="descargar(comprobante.pdf, comprobante.nombrePdf, 'el PDF')">Descargar</v-btn>
        <v-btn variant="outlined" class="text-none" prepend-icon="mdi-xml" :disabled="!comprobante.xml"
               @click="abrirEnOtraPestana(comprobante.xml)">XML</v-btn>
      </div>
    </div>
  </v-navigation-drawer>
</template>

<script setup>
import { computed } from 'vue'
import { useDownload } from '@/composables/useDownload'
import { enRem } from '@/composables/useSplitWidth'
import { useAppStore } from '@/stores/appStore'
import { abrirEnOtraPestana } from '@/utils/pdf'
import { enCurso, fallida } from '@/utils/uploadTasks'

// El comprobante recien emitido mientras SUNAT responde, al costado de su lista. Su estado sale de su tarea en el
// panel de subidas; `tipo` es el de esa tarea (invoice, dispatchguide).
const props = defineProps({
  comprobante: { type: Object, default: null },  // { id, numero, cliente, pdf, nombrePdf, xml }
  tipo: { type: String, required: true },
  filas: { type: Array, default: () => [] },
  // Si el formulario todavia tiene lo escrito para volver a abrirlo.
  corregible: { type: Boolean, default: false },
})
const emit = defineEmits(['cerrar', 'corregir', 'ver-pdf'])

const ANCHO = enRem(24)
const appStore = useAppStore()
const { descargar } = useDownload()

const tarea = computed(() => props.comprobante && appStore.uploadTasks.find(
  t => t.type === props.tipo && String(t.id) === String(props.comprobante.id)))
const rechazada = computed(() => Boolean(tarea.value && fallida(tarea.value)))

const estado = computed(() => {
  const t = tarea.value
  if (rechazada.value) {
    return { color: 'error', icono: 'mdi-close-circle-outline', texto: `Rechazada: ${t.error_msg}`,
             detalle: 'Corregir reabre el formulario con lo escrito.' }
  }
  if (!t || enCurso(t)) {
    return { color: 'info', enCurso: true, texto: 'Procesando en SUNAT…',
             detalle: 'Puedes cerrar: el aviso sigue abajo, en el panel de subidas.' }
  }
  if (t.status === 'success') {
    return { color: 'success', icono: 'mdi-check-circle-outline', texto: 'Aceptada por SUNAT',
             detalle: 'Con su QR y su constancia.' }
  }
  return { color: 'warning', icono: 'mdi-clock-alert-outline', texto: 'Pendiente en SUNAT', detalle: t.step }
})
</script>

<style scoped>
.estado { background: rgba(var(--v-theme-on-surface), 0.05); }
.dato { display: flex; justify-content: space-between; gap: 0.5rem; padding: 0.25rem 0; font-size: 0.875rem; }
.botones { display: grid; grid-auto-flow: column; grid-auto-columns: minmax(0, 1fr); gap: 0.5rem; }
</style>
