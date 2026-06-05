<template>
  <div>
    <v-slide-y-reverse-transition>
      <v-card v-if="tasks.length > 0"
              class="upload-manager-card elevation-10 rounded-lg overflow-hidden"
              :color="isDark ? 'grey-darken-4' : 'white'"
              width="345">

        <v-toolbar density="compact" flat
                   :color="isDark ? 'grey-darken-3' : 'grey-lighten-3'"
                   @click="minimized = !minimized"
                   style="cursor: pointer;" class="pl-3 pr-0">
          <v-progress-circular v-if="activeTasksCount > 0" indeterminate size="18" width="2" color="primary" class="mr-3"/>
          <v-icon v-else-if="errorTasksCount === tasks.length" color="error" class="mr-3">mdi-close-circle</v-icon>
          <v-icon v-else-if="successTasksCount === tasks.length" color="success" class="mr-3">mdi-check-circle</v-icon>
          <v-icon v-else color="warning" class="mr-3">mdi-alert-circle</v-icon>
          
          <span class="text-subtitle-2 font-weight-bold text-medium-emphasis">{{ headerText }}</span>
          <v-spacer/>
          
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
              <v-list-item class="px-3 py-3">

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
                  :class="task.status === 'error' ? 'text-error font-weight-bold' : 'text-medium-emphasis'"
                  :title="getStatusText(task)"
                >
                  {{ getStatusText(task) }}
                </v-list-item-subtitle>

                <template v-slot:append>
                  <v-hover>
                    <template v-slot:default="{ isHovering, props: hoverProps }">
                      <div v-bind="hoverProps" style="width: 36px; height: 36px; display: flex; justify-content: center; align-items: center;">

                        <template v-if="task.status === 'error'">
                          <template v-if="isHovering">
                            <v-tooltip location="bottom" z-index="100000">
                              <template v-slot:activator="{ props: tooltipProps }">
                                <v-btn v-if="task.type === 'sheet'" v-bind="tooltipProps" icon variant="text" size="small" color="grey" @click.stop="discardTask(task)">
                                  <v-icon>mdi-close</v-icon>
                                </v-btn>
                                <v-btn v-else v-bind="tooltipProps" icon variant="text" size="small" color="error" @click.stop="retryQr(task)">
                                  <v-icon>mdi-refresh</v-icon>
                                </v-btn>
                              </template>
                              <span>{{ task.type === 'sheet' ? 'Descartar' : 'Reintentar subida' }}</span>
                            </v-tooltip>
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

                        <template v-else-if="task.status === 'success'">
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
                          <v-progress-circular v-else :model-value="100" color="success" size="28" width="3">
                            <v-icon size="small" color="success">mdi-check</v-icon>
                          </v-progress-circular>
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
                  </v-hover>
                </template>

              </v-list-item>
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

const tasks = computed(() => {
  return appStore.uploadTasks
})

const activeTasksCount = computed(() =>
  tasks.value.filter(t => ['generating', 'uploading', 'retrying'].includes(t.status)).length
)
const errorTasksCount = computed(() =>
  tasks.value.filter(t => ['error', 'canceled'].includes(t.status)).length
)
const successTasksCount = computed(() =>
  tasks.value.filter(t => t.status === 'success').length
)
const headerText = computed(() => {
  const total = tasks.value.length
  if (activeTasksCount.value > 0)           return `Procesando ${activeTasksCount.value}...`
  if (successTasksCount.value === total)     return 'Tareas completadas con éxito'
  if (errorTasksCount.value   === total)     return 'Error en todas las tareas.'
  return `Fallaron ${errorTasksCount.value} tareas de ${total}.`
})

function getStatusText(task) {
  // 1. Prioridad máxima: Mostrar el error real del backend
  if (task.status === 'error') return task.error_msg || 'Error de conexión / servidor';
  
  // 2. Mostrar el paso a paso dinámico
  if (task.step) return task.step; 

  // 3. Textos genéricos por defecto si el backend no mandó nada
  const maps = {
    sheet: { generating: 'Procesando Excel...', success: 'Listo para revisión.', canceled: 'Cancelado por usuario.' },
    qr:    { generating: 'Iniciando proceso...', uploading: 'Enviando a la red...', retrying: `Reintentando (${task.attempts || 0}/3)...`, success: '¡Completado!', canceled: 'Cancelado por usuario.' }
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

function closePanel() {
  const done = tasks.value.filter(t => !['generating', 'uploading', 'retrying'].includes(t.status))
  done.forEach(t => appStore.removeUploadTask(t.id, t.type))
  
  // Enviamos una única orden maestra para que las otras pantallas limpien todo
  if (window.enviarProgresoWebSocket) {
    window.enviarProgresoWebSocket('all', 0, 'dismiss_all_done', 'all', 0, 'all')
  }
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
  border-radius: 8px !important;
  overflow: hidden;
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
