<template>
  <div>
    <v-slide-y-reverse-transition>
      <v-card v-if="tasks.length > 0"
              class="upload-manager-card overflow-hidden"
              :class="{ raised: selectionActive }">

        <!-- Header tema-aware: muestra el fondo del card (mica oscuro / azul-gris claro) -->
        <v-toolbar density="compact" flat
                   color="transparent"
                   @click="minimized = !minimized"
                   style="cursor: pointer;" class="upload-manager-header pl-3 pr-0">
          <v-progress-circular v-if="activeTasksCount > 0" indeterminate size="18" width="2" color="primary" class="mr-3"/>
          <v-icon v-else-if="errorTasksCount === tasks.length" color="error" class="mr-3">mdi-close-circle</v-icon>
          <v-icon v-else-if="successTasksCount === tasks.length" color="success" class="mr-3">mdi-check-circle</v-icon>
          <v-icon v-else color="warning" class="mr-3">mdi-alert-circle</v-icon>

          <span class="text-subtitle-2 font-weight-bold text-medium-emphasis text-truncate">{{ headerText }}</span>
          <v-spacer/>

          <!-- Acciones de lote: reintentar fallidos / limpiar completadas -->
          <v-menu location="top end" :z-index="100000" v-if="failedRetryableCount > 0 || completedCount > 0">
            <template v-slot:activator="{ props: mprops }">
              <v-btn v-bind="mprops" icon variant="text" size="small" @click.stop>
                <v-icon>mdi-dots-vertical</v-icon>
              </v-btn>
            </template>
            <v-list density="compact" min-width="220">
              <v-list-item v-if="failedRetryableCount > 0" @click="retryAllFailed">
                <template v-slot:prepend><v-icon size="small" color="error">mdi-refresh</v-icon></template>
                <v-list-item-title class="text-body-2">Reintentar fallidos ({{ failedRetryableCount }})</v-list-item-title>
              </v-list-item>
              <v-list-item v-if="completedCount > 0" @click="clearCompleted">
                <template v-slot:prepend><v-icon size="small">mdi-broom</v-icon></template>
                <v-list-item-title class="text-body-2">Limpiar completadas ({{ completedCount }})</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>

          <v-btn icon variant="text" size="small" @click.stop="minimized = !minimized" class="mr-1">
            <v-icon>{{ minimized ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
          </v-btn>
          <v-btn icon variant="text" size="small" class="ml-auto" @click.stop="closePanel" v-if="activeTasksCount === 0">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-toolbar>

        <v-expand-transition>
          <v-list v-show="!minimized" density="comfortable" class="pa-0 task-list-scroll"
                  :bg-color="isDark ? 'grey-darken-4' : 'white'">
            <template v-for="(task, index) in tasks" :key="task.id + task.type">
              <v-divider v-if="index > 0"></v-divider>
              
              <v-hover>
                <template v-slot:default="{ isHovering, props: hoverProps }">
                  <v-list-item class="px-3 py-3" v-bind="hoverProps">

                    <template v-slot:prepend>
                      <v-avatar size="32" class="mr-3" :color="isDark ? 'grey-darken-3' : 'grey-lighten-4'">
                        <v-icon size="small" :color="task.type === 'sheet' ? 'green-darken-2' : 'red-darken-2'">
                          {{ task.type === 'sheet' ? 'mdi-file-excel-box' : 'mdi-file-pdf-box' }}
                        </v-icon>
                      </v-avatar>
                    </template>

                    <v-list-item-title class="font-weight-medium text-caption">{{ task.code }}</v-list-item-title>
                    <v-list-item-subtitle 
                      style="font-size: 10px; max-width: 175px;" 
                      class="text-truncate"
                      :class="(task.status === 'error' || task.status === 'cloud_error') ? 'text-error font-weight-bold' : 'text-medium-emphasis'"
                      :title="getStatusText(task)"
                    >
                      {{ getStatusText(task) }}
                    </v-list-item-subtitle>

                    <template v-slot:append>
                      <div style="width: 72px; height: 36px; display: flex; justify-content: flex-end; align-items: center;">

                        <template v-if="task.status === 'error' || task.status === 'cloud_error'">
                          <template v-if="isHovering">
                            <div class="d-flex align-center justify-end" style="gap: 4px;">
                              
                              <v-tooltip v-if="task.is_cloud_error && task.offline_url" location="bottom" z-index="100000">
                                <template v-slot:activator="{ props: tooltipProps }">
                                  <v-btn v-bind="tooltipProps" icon variant="text" size="small" color="info" @click.stop="downloadOfflinePdf(task)">
                                    <v-icon>mdi-download</v-icon>
                                  </v-btn>
                                </template>
                                <span>Descargar Rescate</span>
                              </v-tooltip>

                              <v-tooltip location="bottom" z-index="100000">
                                <template v-slot:activator="{ props: tooltipProps }">
                                  <v-btn v-if="task.type === 'sheet' || task.source === 'manual'" v-bind="tooltipProps" icon variant="text" size="small" color="grey" @click.stop="discardTask(task)">
                                    <v-icon>mdi-close</v-icon>
                                  </v-btn>
                                  <v-btn v-else v-bind="tooltipProps" icon variant="text" size="small" color="error" @click.stop="retryQr(task)">
                                    <v-icon>mdi-refresh</v-icon>
                                  </v-btn>
                                </template>
                                <span>{{ (task.type === 'sheet' || task.source === 'manual') ? 'Descartar' : 'Reintentar' }}</span>
                              </v-tooltip>

                            </div>
                          </template>
                          <v-icon v-else color="error" size="24">mdi-alert-circle</v-icon>
                        </template>

                        <template v-else-if="task.status === 'canceled'">
                          <template v-if="isHovering">
                            <v-tooltip location="bottom" z-index="100000">
                              <template v-slot:activator="{ props: tooltipProps }">
                                <v-btn v-bind="tooltipProps" icon variant="text" size="small" color="grey" @click.stop="discardTask(task)">
                                  <v-icon>mdi-close</v-icon>
                                </v-btn>
                              </template>
                              <span>Limpiar de la lista</span>
                            </v-tooltip>
                          </template>
                          <v-icon v-else color="grey" size="24">mdi-cancel</v-icon>
                        </template>

                        <template v-else-if="task.status === 'success' || task.status === 'warning'">
                          <template v-if="isHovering">
                            <v-tooltip location="bottom" z-index="100000">
                              <template v-slot:activator="{ props: tooltipProps }">
                                <v-btn v-if="task.type === 'sheet'" v-bind="tooltipProps" icon variant="text" size="small" color="purple" @click.stop="openPreview(task)">
                                  <v-icon>mdi-eye</v-icon>
                                </v-btn>
                                <v-btn v-else v-bind="tooltipProps" icon variant="text" size="small" color="purple" :href="`https://daicomperu.com/${task.uuid}`" target="_blank">
                                  <v-icon>mdi-cloud-check</v-icon>
                                </v-btn>
                              </template>
                              <span>{{ task.type === 'sheet' ? 'Revisar PDF' : 'Ver PDF Subido' }}</span>
                            </v-tooltip>
                          </template>
                          <template v-else>
                            <v-progress-circular v-if="task.status === 'success'" :model-value="100" color="success" size="28" width="3">
                              <v-icon size="small" color="success">mdi-check</v-icon>
                            </v-progress-circular>
                            <v-icon v-else color="warning" size="28">mdi-alert-circle</v-icon>
                          </template>
                        </template>

                        <template v-else>
                          <template v-if="isHovering">
                            <v-tooltip location="bottom" z-index="100000">
                              <template v-slot:activator="{ props: tooltipProps }">
                                <v-btn v-if="task.type === 'sheet'" v-bind="tooltipProps" icon variant="text" size="small" color="grey" @click.stop="cancelSheet(task)">
                                  <v-icon>mdi-close</v-icon>
                                </v-btn>
                                <v-btn v-else v-bind="tooltipProps" icon variant="text" size="small" color="grey" @click.stop="cancelQr(task)">
                                  <v-icon>mdi-close</v-icon>
                                </v-btn>
                              </template>
                              <span>Cancelar</span>
                            </v-tooltip>
                          </template>
                          <v-progress-circular v-else
                                               :model-value="task.progress || 0"
                                               :color="task.type === 'sheet' ? 'amber-darken-2' : 'primary'"
                                               size="28" width="3">
                            <span style="font-size: 8px; font-weight: bold;" class="text-medium-emphasis">
                              {{ Math.round(task.progress || 0) }}%
                            </span>
                          </v-progress-circular>
                        </template>

                      </div>
                    </template>

                  </v-list-item>
                </template>
              </v-hover>
            </template>
          </v-list>
        </v-expand-transition>
      </v-card>
    </v-slide-y-reverse-transition>

    <v-dialog v-model="preview_modal" fullscreen persistent transition="dialog-bottom-transition" z-index="99999">
      <v-card class="d-flex flex-column" style="height: 100vh; overflow: hidden; background-color: #525659;">
        <v-toolbar flat height="64" class="flex-grow-0 flex-shrink-0">
          <v-icon class="mr-2 d-none d-md-flex">mdi-file-pdf-box</v-icon>
          <span class="text-subtitle-1 font-weight-bold mr-4 d-none d-md-flex">Nombre:</span>
          
          <v-text-field v-model="preview_final_name" density="compact" variant="outlined" hide-details 
                        prepend-inner-icon="mdi-pencil" suffix=".pdf"
                        class="font-weight-bold" style="max-width: 700px; width: 100%;"/>        
          <v-spacer/>        
          <v-btn variant="text" @click="preview_modal = false" class="mr-2 font-weight-bold" 
                 :color="isDark ? 'white' : 'grey-darken-3'">
            <v-icon start>mdi-close</v-icon> Descartar
          </v-btn>
          
          <v-btn color="success" variant="flat" @click="approveSheet" class="font-weight-bold px-4">
            <v-icon start>mdi-check-bold</v-icon> Aprobar y Guardar
          </v-btn>
        </v-toolbar>

        <div class="flex-grow-1" style="width: 100%; position: relative;">
          <iframe v-if="preview_url" :src="preview_url"
                  style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none; display: block;"/>
        </div>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useTheme } from 'vuetify'
import { useAppStore } from '@/stores/appStore'

const appStore = useAppStore()
const theme    = useTheme()

const isDark = computed(() => theme.global.current.value.dark)

const minimized          = ref(false)
const preview_modal      = ref(false)
const preview_url        = ref(null)
const preview_code       = ref('')
const preview_id         = ref(null)
const preview_final_name = ref('')
const preview_raw_url    = ref('')

const tasks = computed(() => appStore.uploadTasks)

// ¿Barra de seleccion activa? Para apartarse de ella en ventanas angostas.
const selectionActive = computed(() => appStore.selectionActive)

const ACTIVE = ['generating', 'uploading', 'retrying']

const activeTasksCount = computed(() =>
  tasks.value.filter(t => ACTIVE.includes(t.status)).length
)
// Cancelado NO es error: se cuenta aparte para no ensuciar el header.
const errorTasksCount = computed(() =>
  tasks.value.filter(t => ['error', 'cloud_error'].includes(t.status)).length
)
const canceledTasksCount = computed(() =>
  tasks.value.filter(t => t.status === 'canceled').length
)
const successTasksCount = computed(() =>
  tasks.value.filter(t => t.status === 'success').length
)
const warningTasksCount = computed(() =>
  tasks.value.filter(t => t.status === 'warning').length
)
// Tareas terminadas (todo lo que no esta activo) -> se pueden limpiar.
const completedCount = computed(() =>
  tasks.value.filter(t => !ACTIVE.includes(t.status)).length
)
// Fallidas que SI se pueden reintentar (solo QR; sheet/manual no).
const failedRetryableCount = computed(() =>
  tasks.value.filter(t => ['error', 'cloud_error'].includes(t.status) && t.type !== 'sheet' && t.source !== 'manual').length
)

// Header por segmentos: informa cada estado sin frases ambiguas.
const headerText = computed(() => {
  const parts = []
  if (activeTasksCount.value)   parts.push(`${activeTasksCount.value} en proceso`)
  if (successTasksCount.value)  parts.push(`${successTasksCount.value} ${successTasksCount.value === 1 ? 'lista' : 'listas'}`)
  if (warningTasksCount.value)  parts.push(`${warningTasksCount.value} con aviso`)
  if (errorTasksCount.value)    parts.push(`${errorTasksCount.value} ${errorTasksCount.value === 1 ? 'fallo' : 'fallos'}`)
  if (canceledTasksCount.value) parts.push(`${canceledTasksCount.value} cancelada${canceledTasksCount.value === 1 ? '' : 's'}`)
  return parts.join(' · ') || 'Sin tareas'
})

function getStatusText(task) {
  if (task.status === 'error' || task.status === 'cloud_error') return task.error_msg || 'Error de conexión / servidor';
  
  // 2. Mostrar el paso a paso dinámico
  if (task.step) return task.step; 

  // 3. Textos genéricos por defecto (Esto soluciona el texto borrado por el WebSocket)
  const maps = {
    sheet: { generating: 'Procesando Excel...', success: 'Listo para revisión.', canceled: 'Cancelado por usuario.' },
    qr:    { 
      generating: 'Iniciando proceso...', 
      uploading: 'Enviando a la red...', 
      retrying: `Reintentando (${task.attempts || 0}/3)...`, 
      success: '¡Completado!', 
      canceled: 'Cancelado por usuario.',
      warning: 'Subido a la nube. Falló la copia local (archivo abierto).'
    }
  };
  return maps[task.type]?.[task.status] || '';
}

function discardTask(task) {
  appStore.removeUploadTask(task.id, task.type)
  if (window.enviarProgresoWebSocket) {
    window.enviarProgresoWebSocket(task.id, 0, 'dismiss_task', task.code, 0, task.type)
  }
}

function retryQr(task) {
  window.dispatchEvent(new CustomEvent('wss-qr-retry', { detail: { id: task.id } }))
}

function downloadOfflinePdf(task) {
  if (!task.offline_url) return;

  let finalUrl = task.offline_url;
  if (finalUrl.startsWith('/')) {
    const base = ['localhost', '127.0.0.1'].includes(window.location.hostname)
      ? 'http://localhost:8000'
      : window.location.origin;
    finalUrl = base + finalUrl;
  }

  window.open(finalUrl, '_blank');
  discardTask(task);
}

function cancelQr(task) {
  if (task.status === 'canceled') {
    discardTask(task)
  } else {
    window.dispatchEvent(new CustomEvent('wss-qr-cancel', { detail: { id: task.id } }))
  }
}

function cancelSheet(task) {
  window.dispatchEvent(new CustomEvent('wss-cancel-sheet-action', { detail: { id: task.id } }))
  appStore.updateUploadTask(task.id, 'sheet', { status: 'canceled' })
}

// Quita las tareas terminadas (deja las activas). Sirve para el boton X y para
// "Limpiar completadas" del menu (este ultimo funciona aunque haya activas).
function clearCompleted() {
  const done = tasks.value.filter(t => !ACTIVE.includes(t.status))
  done.forEach(t => appStore.removeUploadTask(t.id, t.type))
  // Orden maestra para que las otras pantallas limpien lo terminado tambien.
  if (window.enviarProgresoWebSocket) {
    window.enviarProgresoWebSocket('all', 0, 'dismiss_all_done', 'all', 0, 'all')
  }
}

// Reintenta de una todas las fallidas reintentables (solo QR).
function retryAllFailed() {
  tasks.value
    .filter(t => ['error', 'cloud_error'].includes(t.status) && t.type !== 'sheet' && t.source !== 'manual')
    .forEach(t => window.dispatchEvent(new CustomEvent('wss-qr-retry', { detail: { id: t.id } })))
}

function closePanel() {
  clearCompleted()
  minimized.value = false
}

function openPreview(task) {
  let finalUrl = task.url
  if (['localhost', '127.0.0.1'].includes(window.location.hostname)) {
    finalUrl = 'http://localhost:8000' + finalUrl
  }
  preview_url.value        = `${finalUrl}?v=${new Date().getTime()}`
  preview_raw_url.value    = task.url
  preview_final_name.value = task.url.split('/').pop().replace('.pdf', '')
  preview_code.value       = task.code
  preview_id.value         = task.id
  preview_modal.value      = true
  discardTask(task)
}

function approveSheet() {
  if (!preview_id.value) return
  window.dispatchEvent(new CustomEvent('wss-approve-sheet-action', {
    detail: {
      id:         preview_id.value,
      final_name: preview_final_name.value + '.pdf',
      temp_url:   preview_raw_url.value,
    },
  }))
  preview_modal.value = false
}
</script>

<style scoped>
.upload-manager-card {
  position: fixed !important;
  bottom: 24px;
  right: 24px;
  z-index: 9999;
  /* Mismo material que el SelectionBar: tema-aware, radio 16, borde y sombra */
  border-radius: 16px !important;
  width: min(345px, calc(100vw - 32px));
  background: #dce4f0 !important;
  border: 1px solid rgba(0, 0, 0, 0.10) !important;
  box-shadow: 0 14px 40px rgba(0, 0, 0, 0.22) !important;
  overflow: hidden;
  transition: bottom 0.2s ease;
}
.v-theme--dark .upload-manager-card {
  background: #2c3849 !important;
  border-color: rgba(255, 255, 255, 0.12) !important;
  box-shadow: 0 14px 40px rgba(0, 0, 0, 0.60) !important;
}
/* Header apenas separado del listado (tema-aware) */
.upload-manager-header {
  border-bottom: 1px solid rgba(0, 0, 0, 0.07);
}
.v-theme--dark .upload-manager-header {
  border-bottom-color: rgba(255, 255, 255, 0.08);
}
/* En ventanas angostas, si hay barra de seleccion activa, se sube para no
   pisarla (la barra vive centrada abajo a ~32px + su alto). */
@media (max-width: 1264px) {
  .upload-manager-card.raised {
    bottom: 104px;
  }
}

.task-list-scroll {
  max-height: calc(100vh - 144px);
  overflow-y: auto;
  overflow-x: hidden;
}

.task-list-scroll::-webkit-scrollbar { width: 6px; }

.v-theme--light .task-list-scroll::-webkit-scrollbar-track  { background: transparent; }
.v-theme--light .task-list-scroll::-webkit-scrollbar-thumb  { background: #bdbdbd; border-radius: 10px; }
.v-theme--light .task-list-scroll::-webkit-scrollbar-thumb:hover { background: #9e9e9e; }

.v-theme--dark  .task-list-scroll::-webkit-scrollbar-track  { background: transparent; }
.v-theme--dark  .task-list-scroll::-webkit-scrollbar-thumb  { background: #555555; border-radius: 10px; }
.v-theme--dark  .task-list-scroll::-webkit-scrollbar-thumb:hover { background: #777777; }
</style>
