<template>
  <div>
    <v-slide-y-reverse-transition>
      <v-card v-if="tasks.length > 0"
              class="upload-manager-card panel-flotante"
              :class="{ raised: selectionActive }">

        <v-toolbar density="compact" flat
                   color="transparent"
                   @click="minimized = !minimized"
                   style="cursor: pointer;" class="panel-flotante__encabezado pl-3 pr-0">
          <v-progress-circular v-if="activeTasksCount > 0" indeterminate size="18" width="2" color="primary" class="mr-3"/>
          <v-icon v-else-if="errorTasksCount === tasks.length" color="error" class="mr-3">mdi-close-circle</v-icon>
          <v-icon v-else-if="successTasksCount === tasks.length" color="success" class="mr-3">mdi-check-circle</v-icon>
          <v-icon v-else color="warning" class="mr-3">mdi-alert-circle</v-icon>

          <span class="text-subtitle-2 font-weight-bold text-medium-emphasis text-truncate">{{ headerText }}</span>
          <v-spacer/>

          <!-- Acciones de lote: reintentar fallidos / limpiar completadas -->
          <v-menu location="top end" v-if="failedRetryableCount > 0 || completedCount > 0">
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
                        <v-icon size="small" :color="esConversion(task) ? 'green-darken-2' : 'red-darken-2'">
                          {{ esConversion(task) ? 'mdi-file-excel-box' : 'mdi-file-pdf-box' }}
                        </v-icon>
                      </v-avatar>
                    </template>

                    <v-list-item-title class="font-weight-medium text-caption">{{ task.code }}</v-list-item-title>
                    <v-list-item-subtitle 
                      style="font-size: 10px; max-width: 175px;" 
                      class="text-truncate"
                      :class="fallida(task) ? 'text-error font-weight-bold' : 'text-medium-emphasis'"
                      :title="getStatusText(task)"
                    >
                      {{ getStatusText(task) }}
                    </v-list-item-subtitle>

                    <template v-slot:append>
                      <div style="width: 72px; height: 36px; display: flex; justify-content: flex-end; align-items: center;">

                        <!-- Una fila fallida se queda hasta que alguien la resuelve, asi
                             que sus botones se ven siempre. Esconderlos tras el hover
                             tiene sentido mientras la subida corre, no despues. -->
                        <template v-if="fallida(task)">
                          <div class="d-flex align-center justify-end" style="gap: 4px;">

                            <v-tooltip v-if="task.is_cloud_error && task.offline_url" location="bottom">
                              <template v-slot:activator="{ props: tooltipProps }">
                                <v-btn v-bind="tooltipProps" icon variant="text" size="small" color="info" @click.stop="downloadOfflinePdf(task)">
                                  <v-icon>mdi-download</v-icon>
                                </v-btn>
                              </template>
                              <span>Descargar Rescate</span>
                            </v-tooltip>

                            <v-tooltip location="bottom">
                              <template v-slot:activator="{ props: tooltipProps }">
                                <v-btn v-if="reintentable(task)" v-bind="tooltipProps" icon variant="text" size="small" color="error" @click.stop="retryTask(task)">
                                  <v-icon>mdi-refresh</v-icon>
                                </v-btn>
                                <v-btn v-else v-bind="tooltipProps" icon variant="text" size="small" color="grey" @click.stop="removeTask(task)">
                                  <v-icon>mdi-close</v-icon>
                                </v-btn>
                              </template>
                              <span>{{ reintentable(task) ? 'Reintentar' : 'Quitar de la lista' }}</span>
                            </v-tooltip>

                          </div>
                        </template>

                        <template v-else-if="detenida(task)">
                          <template v-if="isHovering">
                            <v-tooltip location="bottom">
                              <template v-slot:activator="{ props: tooltipProps }">
                                <v-btn v-bind="tooltipProps" icon variant="text" size="small" color="grey" @click.stop="removeTask(task)">
                                  <v-icon>mdi-close</v-icon>
                                </v-btn>
                              </template>
                              <span>Limpiar de la lista</span>
                            </v-tooltip>
                          </template>
                          <v-icon v-else color="grey" size="24">
                            {{ task.status === 'discarded' ? 'mdi-file-remove-outline' : 'mdi-cancel' }}
                          </v-icon>
                        </template>

                        <template v-else-if="terminada(task)">
                          <template v-if="isHovering">
                            <v-tooltip location="bottom">
                              <template v-slot:activator="{ props: tooltipProps }">
                                <v-btn v-if="esperandoRevision(task)" v-bind="tooltipProps" icon variant="text" size="small" color="purple" @click.stop="openPreview(task)">
                                  <v-icon>mdi-eye</v-icon>
                                </v-btn>
                                <v-btn v-else-if="esConversion(task)" v-bind="tooltipProps" icon variant="text" size="small" color="purple" :href="task.url_base" target="_blank" :disabled="!task.url_base">
                                  <v-icon>mdi-file-pdf-box</v-icon>
                                </v-btn>
                                <v-btn v-else v-bind="tooltipProps" icon variant="text" size="small" color="purple" :href="`https://daicomperu.com/${task.uuid}`" target="_blank">
                                  <v-icon>mdi-cloud-check</v-icon>
                                </v-btn>
                              </template>
                              <span>{{ getActionText(task) }}</span>
                            </v-tooltip>
                          </template>
                          <template v-else>
                            <v-progress-circular v-if="task.status !== 'warning'" :model-value="100" color="success" size="28" width="3">
                              <v-icon size="small" color="success">mdi-check</v-icon>
                            </v-progress-circular>
                            <v-icon v-else color="warning" size="28">mdi-alert-circle</v-icon>
                          </template>
                        </template>

                        <template v-else>
                          <template v-if="isHovering && cancelable(task)">
                            <v-tooltip location="bottom">
                              <template v-slot:activator="{ props: tooltipProps }">
                                <v-btn v-if="esConversion(task)" v-bind="tooltipProps" icon variant="text" size="small" color="grey" @click.stop="cancelSheet(task)">
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
                                               :color="esConversion(task) ? 'amber-darken-2' : 'primary'"
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

    <v-dialog v-model="preview_modal" fullscreen persistent transition="dialog-bottom-transition">
      <v-card class="d-flex flex-column" style="height: 100vh; overflow: hidden; background-color: #525659;">
        <v-toolbar flat height="64" class="flex-grow-0 flex-shrink-0">
          <v-icon class="mr-2 d-none d-md-flex">mdi-file-pdf-box</v-icon>
          <span class="text-subtitle-1 font-weight-bold mr-4 d-none d-md-flex">Nombre:</span>
          
          <v-text-field v-model="preview_final_name" density="compact" variant="outlined" hide-details 
                        prepend-inner-icon="mdi-pencil" suffix=".pdf"
                        class="font-weight-bold" style="max-width: 700px; width: 100%;"/>        
          <v-spacer/>        
          <v-btn variant="text" @click="discardPreview" class="mr-2 font-weight-bold"
                 :color="isDark ? 'white' : 'grey-darken-3'" :disabled="guardando">
            <v-icon start>mdi-close</v-icon> Descartar
          </v-btn>

          <!-- El suelto no pertenece a ningun certificado: se lleva el PDF y listo. -->
          <v-btn v-if="preview_task?.type === 'suelto'" color="primary" variant="flat" @click="downloadPreview" class="font-weight-bold px-4">
            <v-icon start>mdi-download</v-icon> Descargar
          </v-btn>
          <v-btn v-else color="success" variant="flat" @click="approveSheet" class="font-weight-bold px-4"
                 :loading="guardando">
            <v-icon start>mdi-check-bold</v-icon> Aprobar y Guardar
          </v-btn>
        </v-toolbar>

        <!-- El guardado fallo: el PDF sigue en pantalla para reintentar sin regenerarlo.
             El flex va explicito: sin base auto, la franja colapsa a su padding. -->
        <v-alert v-if="preview_error" type="error" density="compact" variant="flat" tile
                 class="text-body-2" style="flex: 0 0 auto;">
          {{ preview_error }}
        </v-alert>

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
import { Toast } from '@/plugins/alerts'
import { useAppStore } from '@/stores/appStore'
import CertificateDataService from '@/services/certificates/certificateDataService'
import { cancelable, detenida, enCurso, esConversion, esperandoRevision, fallida, reintentable, terminada } from '@/utils/uploadTasks'

const appStore = useAppStore()
const theme    = useTheme()

const isDark = computed(() => theme.global.current.value.dark)

const minimized          = ref(false)
const preview_modal      = ref(false)
// { id, type, code, url } de la tarea abierta en el visor.
const preview_task       = ref(null)
const preview_url        = ref(null)
const preview_final_name = ref('')
const preview_error      = ref('')
const guardando          = ref(false)

const tasks = computed(() => appStore.uploadTasks)

// ¿Barra de seleccion activa? Para apartarse de ella en ventanas angostas.
const selectionActive = computed(() => appStore.selectionActive)

const activeTasksCount = computed(() => tasks.value.filter(enCurso).length)
const errorTasksCount = computed(() => tasks.value.filter(fallida).length)
// Cancelado NO es error: se cuenta aparte para no ensuciar el header.
const canceledTasksCount = computed(() =>
  tasks.value.filter(t => t.status === 'canceled').length
)
const discardedTasksCount = computed(() =>
  tasks.value.filter(t => t.status === 'discarded').length
)
// Un PDF sin revisar todavia no esta listo: tiene su propio segmento.
const porRevisarCount = computed(() => tasks.value.filter(esperandoRevision).length)
const successTasksCount = computed(() =>
  tasks.value.filter(t => terminada(t) && t.status !== 'warning' && !esperandoRevision(t)).length
)
const warningTasksCount = computed(() =>
  tasks.value.filter(t => t.status === 'warning').length
)
// Tareas terminadas (todo lo que no esta activo) -> se pueden limpiar.
const completedCount = computed(() => tasks.value.filter(t => !enCurso(t)).length)
const failedRetryableCount = computed(() => tasks.value.filter(reintentable).length)

// Header por segmentos: informa cada estado sin frases ambiguas.
const headerText = computed(() => {
  const parts = []
  if (activeTasksCount.value)   parts.push(`${activeTasksCount.value} en proceso`)
  if (porRevisarCount.value)    parts.push(`${porRevisarCount.value} por revisar`)
  if (successTasksCount.value)  parts.push(`${successTasksCount.value} ${successTasksCount.value === 1 ? 'lista' : 'listas'}`)
  if (warningTasksCount.value)  parts.push(`${warningTasksCount.value} con aviso`)
  if (errorTasksCount.value)    parts.push(`${errorTasksCount.value} ${errorTasksCount.value === 1 ? 'fallo' : 'fallos'}`)
  if (canceledTasksCount.value) parts.push(`${canceledTasksCount.value} cancelada${canceledTasksCount.value === 1 ? '' : 's'}`)
  if (discardedTasksCount.value) parts.push(`${discardedTasksCount.value} descartada${discardedTasksCount.value === 1 ? '' : 's'}`)
  return parts.join(' · ') || 'Sin tareas'
})

function getStatusText(task) {
  if (fallida(task)) return task.error_msg || 'Error de conexión / servidor';
  
  // 2. Mostrar el paso a paso dinámico
  if (task.step) return task.step; 

  // 3. Textos genéricos por defecto (Esto soluciona el texto borrado por el WebSocket)
  const maps = {
    sheet:  { generating: 'Procesando Excel...', success: 'Listo para revisión.', saving: 'Guardando...', saved: 'Guardado en el sistema', canceled: 'Cancelado por usuario.', discarded: 'Descartado.' },
    suelto: { generating: 'Procesando Excel...', success: 'Listo para descargar.', canceled: 'Cancelado por usuario.', discarded: 'Descartado.' },
    qr:    {
      generating: 'Iniciando proceso...', 
      uploading: 'Enviando a la red...',
      publishing: 'Publicando...',
      retrying: `Reintentando (${task.attempts || 0}/3)...`,
      success: '¡Completado!', 
      canceled: 'Cancelado por usuario.',
      cancelling: 'Cancelando...',
      warning: 'Subido a la nube. Falló la copia local (archivo abierto).'
    }
  };
  return maps[task.type]?.[task.status] || '';
}

function getActionText(task) {
  if (esperandoRevision(task)) return 'Revisar PDF'
  if (esConversion(task)) return task.url_base ? 'Ver PDF Base' : 'Guardado, preparando el enlace'
  return 'Ver PDF Subido'
}

// El PDF de rescate solo sirve mientras su fila este en el panel: cuando la fila
// se va nadie mas lo va a bajar, y en el servidor seria basura.
function soltarRescate(task) {
  if (task.offline_url) CertificateDataService.soltarTemporal(task.offline_url).catch(() => {})
}

function removeTask(task) {
  soltarRescate(task)
  appStore.removeUploadTask(task.id, task.type)
  if (window.enviarProgresoWebSocket) {
    window.enviarProgresoWebSocket(task.id, 0, 'dismiss_task', task.code, 0, task.type)
  }
}

function retryTask(task) {
  const evento = esConversion(task) ? 'wss-sheet-retry' : 'wss-qr-retry'
  window.dispatchEvent(new CustomEvent(evento, { detail: { id: task.id, tipo: task.type } }))
}

function downloadOfflinePdf(task) {
  if (!task.offline_url) return;
  window.open(task.offline_url, '_blank');
  removeTask(task);
}

function cancelQr(task) {
  if (task.status === 'canceled') {
    removeTask(task)
  } else {
    window.dispatchEvent(new CustomEvent('wss-qr-cancel', { detail: { id: task.id } }))
  }
}

function cancelSheet(task) {
  window.dispatchEvent(new CustomEvent('wss-sheet-cancel', { detail: { id: task.id, tipo: task.type } }))
  appStore.updateUploadTask(task.id, task.type, { status: 'canceled' })
}

// Quita las tareas terminadas (deja las activas). Sirve para el boton X y para
// "Limpiar completadas" del menu (este ultimo funciona aunque haya activas).
function clearCompleted() {
  const done = tasks.value.filter(t => !enCurso(t))
  done.forEach(t => {
    soltarRescate(t)
    appStore.removeUploadTask(t.id, t.type)
  })
  // Orden maestra para que las otras pantallas limpien lo terminado tambien.
  if (window.enviarProgresoWebSocket) {
    window.enviarProgresoWebSocket('all', 0, 'dismiss_all_done', 'all', 0, 'all')
  }
}

function retryAllFailed() {
  tasks.value.filter(reintentable).forEach(retryTask)
}

function closePanel() {
  clearCompleted()
  minimized.value = false
}

function openPreview(task) {
  // La tarea sigue viva mientras se revisa: es lo que mantiene la fila del
  // listado al dia hasta que el PDF se guarde de verdad.
  preview_task.value       = { id: task.id, type: task.type, code: task.code, url: task.url }
  // El ?v= evita que el navegador muestre el PDF anterior del mismo nombre.
  preview_url.value        = `${task.url}?v=${new Date().getTime()}`
  preview_final_name.value = task.url.split('/').pop().replace('.pdf', '')
  preview_error.value      = ''
  preview_modal.value      = true
}

// El temporal lo suelta el que termina de usarlo. Aprobar lo consume en el
// servidor y lo borra alla; descargar y descartar lo sueltan desde aca.
const releaseTemp = () =>
  CertificateDataService.soltarTemporal(preview_task.value.url).catch(() => {})

// Descartar deja el rastro a la vista. Descargar ya entrego lo suyo: la tarea
// se va, porque no queda nada a lo que volver.
function discardPreview() {
  const { id, type } = preview_task.value
  releaseTemp()
  appStore.updateUploadTask(id, type, { status: 'discarded', progress: 0, step: '', url: '' })
  preview_modal.value = false
}

// Por blob: es del mismo origen, asi que respeta el nombre elegido tambien en
// dev, donde el PDF lo sirve otro puerto.
async function downloadPreview() {
  try {
    const respuesta = await fetch(preview_url.value)
    const url = URL.createObjectURL(await respuesta.blob())
    const enlace = document.createElement('a')
    enlace.href = url
    enlace.download = preview_final_name.value + '.pdf'
    enlace.click()
    URL.revokeObjectURL(url)
  } catch {
    window.open(preview_url.value, '_blank')
  }
  releaseTemp()
  removeTask(preview_task.value)
  preview_modal.value = false
}

// El visor se cierra cuando el guardado confirma, no al apretar el boton: si
// falla, el PDF sigue en pantalla y el temporal sigue en el servidor.
async function approveSheet() {
  if (guardando.value) return
  const { id, type } = preview_task.value
  guardando.value = true
  preview_error.value = ''
  appStore.updateUploadTask(id, type, { status: 'saving', step: 'Guardando en red local...', error_msg: '' })

  try {
    const { data } = await CertificateDataService.patch(id, {
      status: 2,
      final_name: preview_final_name.value + '.pdf',
      temp_url: preview_task.value.url,
    })
    appStore.updateUploadTask(id, type, {
      status: 'saved', step: 'Guardado en el sistema', url_base: data?.uploaded_xls_url || '',
    })
    Toast.fire({ ...appStore.toastGuardadoExito, title: '¡Excel guardado!' })
    preview_modal.value = false
  } catch (error) {
    const datos = error.response?.data || {}
    const mensaje = datos.error || 'El disco de red no respondió.'

    if (datos.regenerar) {
      // El PDF ya no esta: no hay nada que revisar ni que guardar. La tarea cae
      // a error, que es donde el panel ofrece volver a convertir el Excel.
      appStore.updateUploadTask(id, type, { status: 'error', step: '', url: '', error_msg: mensaje })
      preview_modal.value = false
      return
    }

    // El temporal sigue en el servidor: se puede reintentar el guardado. El
    // motivo queda tambien en la fila, para que no se pierda al cerrar.
    appStore.updateUploadTask(id, type, { status: 'success', step: `No se guardó: ${mensaje}` })
    preview_error.value = mensaje
  } finally {
    guardando.value = false
  }
}
</script>

<style scoped>
.upload-manager-card {
  position: fixed !important;
  bottom: 24px;
  right: 24px;
  z-index: var(--z-panel-subidas);
  width: min(345px, calc(100vw - 32px));
  transition: bottom 0.2s ease;
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
