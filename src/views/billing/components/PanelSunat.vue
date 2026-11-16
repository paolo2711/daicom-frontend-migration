<template>
  <floating-side-panel :abierto="abierto" titulo="Más información" :acciones="todasLasAcciones"
                       @cerrar="emit('cerrar')" @accion="clave => emit('accion', clave)">
    <template #icono>
      <v-progress-circular v-if="estado.cargando" indeterminate size="18" width="2" color="primary" class="mr-3" />
      <v-icon v-else :color="ESTADOS[estado.sunat].color" class="mr-3">{{ ESTADOS[estado.sunat].icono }}</v-icon>
    </template>

    <div class="text-center">
      <div class="text-subtitle-1 font-weight-bold">{{ nombre }} electrónica</div>
      <div class="text-medium-emphasis">{{ numero }}</div>
      <div class="d-flex justify-center align-center ga-1 mt-2 text-body-2 font-weight-medium"
           :class="`text-${ESTADOS[estado.sunat].color}`">
        <v-progress-circular v-if="estado.cargando" indeterminate size="16" width="2" />
        <v-icon v-else size="18" :icon="ESTADOS[estado.sunat].icono" />
        {{ ESTADOS[estado.sunat].texto }}
      </div>
      <div v-if="estado.aviso" class="text-caption text-medium-emphasis mt-1">{{ estado.aviso }}</div>
      <div v-if="respuesta?.descripcion" class="text-caption mt-1">{{ respuesta.descripcion }}</div>
      <div v-for="nota in respuesta?.notas || []" :key="nota" class="text-caption text-medium-emphasis">{{ nota }}</div>
      <!-- Con margen blanco: sin el, en modo oscuro los bordes del QR se pierden y no se lee. -->
      <div v-if="qr" class="d-inline-block bg-white pa-2 rounded mt-3">
        <v-img :src="qr" alt="QR de SUNAT" width="7rem" :title="`Consulta de ${numero} en SUNAT`" />
      </div>
    </div>
    <div v-for="[titulo, valor] in filas" :key="titulo" class="dato">
      <div class="font-weight-bold">{{ titulo }}</div>
      <div class="text-medium-emphasis">{{ valor }}</div>
    </div>
    <slot />
  </floating-side-panel>
</template>

<script setup>
import { computed, watch } from 'vue'
import FloatingSidePanel from '@/components/shared/FloatingSidePanel.vue'
import { useAppStore } from '@/stores/appStore'
import { ENVIADA, ESTADOS, RECHAZADA } from '@/utils/billing/sunat'
import { enCurso, fallida, tareaDe, terminada } from '@/utils/uploadTasks'

// Un comprobante en el panel lateral: Ver informacion y lo recien emitido. Si tiene una tarea de envio, su
// estado manda; la rechazada al enviarla solo ofrece Corregir.
const props = defineProps({
  abierto: { type: Boolean, default: false },
  tipo: { type: String, required: true },  // el de la tarea: invoice, creditnote, dispatchguide
  id: { type: [Number, String], default: null },
  nombre: { type: String, required: true },
  numero: { type: String, default: '' },
  estadoSunat: { type: String, default: ENVIADA },
  respuesta: { type: Object, default: null },
  qr: { type: String, default: '' },
  filas: { type: Array, default: () => [] },
  acciones: { type: Array, default: () => [] },  // las del menu de la fila (accionesPara)
  // Si el formulario todavia tiene lo escrito para volver a abrirlo.
  corregible: { type: Boolean, default: false },
})
const emit = defineEmits(['cerrar', 'accion', 'tarea-terminada'])

const appStore = useAppStore()
const tarea = computed(() => props.id != null && tareaDe(appStore.uploadTasks, props.tipo, props.id))

const estado = computed(() => {
  const t = tarea.value
  if (t && fallida(t)) return { sunat: RECHAZADA, aviso: `${t.error_msg} Corregir reabre el formulario con lo escrito.` }
  if (t && enCurso(t)) return { sunat: ENVIADA, cargando: true, aviso: 'Puedes cerrar: el aviso sigue en el panel de subidas.' }
  return { sunat: props.estadoSunat, cargando: props.estadoSunat === ENVIADA }
})

// Ya abierto en el panel, Ver informacion y Preguntar a SUNAT sobran.
const SOBRAN = ['info', 'consultar']
const todasLasAcciones = computed(() => tarea.value && fallida(tarea.value)
  ? [{ clave: 'corregir', texto: 'Corregir', icono: 'mdi-pencil', grupo: 'trabajo', disabled: !props.corregible }]
  : props.acciones.filter(a => !SOBRAN.includes(a.clave)))

watch(() => tarea.value && terminada(tarea.value), (si) => { if (si) emit('tarea-terminada') })
</script>

<style scoped>
.dato { padding: 0.5rem 0; border-top: thin solid rgba(var(--v-border-color), var(--v-border-opacity)); font-size: 0.875rem; }
.dato:first-of-type { margin-top: 0.75rem; }
</style>
