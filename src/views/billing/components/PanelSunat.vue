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
        {{ estado.texto || ESTADOS[estado.sunat].texto }}
      </div>
      <div v-if="estado.aviso" class="text-caption text-medium-emphasis mt-1">{{ estado.aviso }}</div>
      <template v-if="!propio">
        <div v-if="respuesta?.descripcion" class="text-caption mt-1">{{ respuesta.descripcion }}</div>
        <div v-for="nota in respuesta?.notas || []" :key="nota" class="text-caption text-medium-emphasis">{{ nota }}</div>
      </template>
      <!-- Con margen blanco: sin el, en modo oscuro los bordes del QR se pierden y no se lee. -->
      <div v-if="qr" class="d-inline-block bg-white pa-2 rounded mt-3">
        <v-img :src="qr" alt="QR de SUNAT" width="7rem" :title="`Consulta de ${numero} en SUNAT`" />
      </div>
    </div>
    <!-- Lo que falta con SUNAT, del comprobante o de lo suyo, como una fila mas: el color solo en el icono. -->
    <div v-for="a in avisos" :key="a.clave" class="aviso" :class="`ntone-${ESTADOS[a.estado].tono}`">
      <span class="aviso-icono"><v-icon size="18" :icon="ESTADOS[a.estado].icono" /></span>
      <div class="aviso-texto">
        <div class="font-weight-bold">{{ a.titulo }}</div>
        <div v-if="a.texto" class="text-medium-emphasis">{{ a.texto }}</div>
      </div>
      <v-btn v-if="a.boton" size="small" variant="tonal" class="text-none aviso-boton" :loading="ocupado === a.clave"
             :disabled="a.disabled" @click="emit('accion', a.clave)">{{ a.boton }}</v-btn>
    </div>
    <div v-for="[titulo, valor] in filas" :key="titulo" class="dato">
      <div class="font-weight-bold">{{ titulo }}</div>
      <div class="text-medium-emphasis">{{ valor }}</div>
    </div>
    <slot />
  </floating-side-panel>
</template>

<script setup>
import { computed, onBeforeUnmount, watch } from 'vue'
import FloatingSidePanel from '@/components/shared/FloatingSidePanel.vue'
import { useAppStore } from '@/stores/appStore'
import { ENVIADA, ESTADOS, POR_ENVIAR, RECHAZADA, REVISAR, avisoDelPlazo, fueraDePlazo, loQueDijo } from '@/utils/billing/sunat'
import { conAviso, enCurso, fallida, tareaDe, terminada } from '@/utils/uploadTasks'

// Un comprobante en el panel lateral: Ver informacion y lo recien emitido. Si tiene una tarea de envio, su
// estado manda; la rechazada al enviarla solo ofrece Corregir.
const props = defineProps({
  abierto: { type: Boolean, default: false },
  tipo: { type: String, required: true },  // el de la tarea: invoice, creditnote, dispatchguide
  id: { type: [Number, String], default: null },
  nombre: { type: String, required: true },
  numero: { type: String, default: '' },
  estadoSunat: { type: String, default: null },  // null mientras se lee
  reintentarHasta: { type: String, default: '' },
  respuesta: { type: Object, default: null },
  qr: { type: String, default: '' },
  filas: { type: Array, default: () => [] },
  acciones: { type: Array, default: () => [] },  // las del menu de la fila (accionesPara)
  // Si el formulario todavia tiene lo escrito para volver a abrirlo.
  corregible: { type: Boolean, default: false },
  // Lo que falta con SUNAT fuera del comprobante (su baja, sus notas): { clave, estado, titulo, texto, boton }.
  pendientes: { type: Array, default: () => [] },
  ocupado: { type: [String, Number], default: null },  // la clave cuyo boton espera
})
const emit = defineEmits(['cerrar', 'accion', 'tarea-terminada'])

const appStore = useAppStore()
const tarea = computed(() => props.id != null && tareaDe(appStore.uploadTasks, props.tipo, props.id))

const estado = computed(() => {
  const t = tarea.value
  if (t && fallida(t)) return { sunat: RECHAZADA }
  if (t && enCurso(t)) {
    return { sunat: ENVIADA, cargando: true, texto: 'Enviando a SUNAT…',
             aviso: 'Puedes cerrar: el aviso sigue en el panel de subidas.' }
  }
  if (props.estadoSunat == null) return { sunat: ENVIADA, cargando: true, texto: 'Leyendo…' }
  return { sunat: props.estadoSunat, aviso: t && conAviso(t) ? t.step : '' }
})

const puede = (clave) => props.acciones.some(a => a.clave === clave && !a.disabled)
const boton = (clave, texto) => (puede(clave) ? texto : '')
const propio = computed(() => {
  const t = tarea.value
  const dijo = loQueDijo(props.respuesta)
  if (t && fallida(t)) {
    return { clave: 'corregir', estado: RECHAZADA, titulo: 'SUNAT la rechazó',
             texto: `${t.error_msg} Corregir abre el formulario con lo escrito.`, boton: 'Corregir',
             disabled: !props.corregible }
  }
  if (t || props.estadoSunat == null) return null
  if (props.estadoSunat === POR_ENVIAR) {
    const vencida = fueraDePlazo(props.reintentarHasta)
    return { clave: vencida ? 'anular' : 'reintentar', estado: POR_ENVIAR, titulo: 'No llegó a SUNAT',
             texto: props.reintentarHasta ? avisoDelPlazo(props.reintentarHasta) : '',
             boton: vencida ? boton('anular', 'Anular') : boton('reintentar', 'Reintentar') }
  }
  if (props.estadoSunat === ENVIADA) {
    return { clave: 'consultar', estado: ENVIADA, titulo: 'Sin respuesta de SUNAT',
             texto: `SUNAT recibió la ${props.nombre.toLowerCase()}. Su respuesta está pendiente.`,
             boton: boton('consultar', 'Preguntar') }
  }
  if (props.estadoSunat === RECHAZADA) {
    return { clave: 'anular', estado: RECHAZADA, titulo: 'SUNAT la rechazó', texto: `${dijo} Corregir y emitir una nueva.`,
             boton: boton('anular', 'Anular') }
  }
  if (props.estadoSunat === REVISAR) {
    return { clave: 'anular', estado: REVISAR, titulo: 'SUNAT la rechazó al reintentar',
             texto: `${dijo} Pudo haberla recibido en el primer envío: verificar en SOL; si no figura, emitir una nueva.`,
             boton: boton('anular', 'Anular') }
  }
  return null
})
const avisos = computed(() => [...(propio.value ? [propio.value] : []), ...props.pendientes])

// Lo que tiene su boton en un aviso no se repite abajo; Ver informacion sobra porque esta abierto.
const todasLasAcciones = computed(() => {
  if (tarea.value && fallida(tarea.value)) return []
  const sobran = ['info', ...avisos.value.filter(a => a.boton).map(a => a.clave)]
  return props.acciones.filter(a => !sobran.includes(a.clave))
})

watch(() => tarea.value && terminada(tarea.value), (si) => { if (si) emit('tarea-terminada') })

// Lo que termino a la vista no vuelve a salir en el panel de subidas, tampoco en las otras pestañas.
function soltarTarea (id) {
  const t = id != null && tareaDe(appStore.uploadTasks, props.tipo, id)
  if (!t || enCurso(t)) return
  appStore.removeUploadTask(t.id, t.type)
  window.enviarProgresoWebSocket?.(t.id, 0, 'dismiss_task', t.code, 0, t.type)
}
const aLaVista = computed(() => (props.abierto ? props.id : null))
watch(aLaVista, (_, anterior) => soltarTarea(anterior))
onBeforeUnmount(() => soltarTarea(aLaVista.value))
</script>

<style scoped>
.dato { padding: 0.5rem 0; border-top: thin solid rgba(var(--v-border-color), var(--v-border-opacity)); font-size: 0.875rem; }
.dato:first-of-type { margin-top: 0.75rem; }
.aviso {
  display: flex; align-items: flex-start; gap: 0.75rem; padding: 0.75rem 0; margin-top: 0.75rem;
  border-top: thin solid rgba(var(--v-border-color), var(--v-border-opacity)); font-size: 0.875rem;
}
.aviso + .aviso { margin-top: 0; }
.aviso-icono {
  display: flex; align-items: center; justify-content: center; flex: 0 0 auto; width: 2rem; height: 2rem;
  border-radius: 50%; background: var(--ntone-bg); color: var(--ntone-fg);
}
.aviso-texto { flex: 1 1 auto; min-width: 0; }
/* Todos del mismo ancho: el texto del boton no mueve la fila. */
.aviso-boton { flex: 0 0 6.5rem; }
</style>
