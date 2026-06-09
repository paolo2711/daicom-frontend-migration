<template>
  <v-dialog v-model="dialog" max-width="850" class="dialog-premium" persistent>
    <v-card>
      <base-modal-header 
        :title="modalConfig.title" 
        :icon="modalConfig.icon" 
        :iconColor="modalConfig.color"
        @close="close"
      >
        <span 
          class="font-weight-bold ml-1" 
          :class="selected_items.length > 0 ? 'text-primary' : 'text-error'"
        >
          {{ selected_items.length }} {{ selected_items.length <= 1 ? 'seleccionado' : 'seleccionados' }} de {{ items.length }}
        </span>
      </base-modal-header>

      <v-card-text class="pt-4 pb-2">
        <h3 class="text-subtitle-1 font-weight-bold mb-2" style="line-height: 1.2;">
          {{ modalConfig.subtitle }}
        </h3>
        
        <v-alert 
          v-if="action === 'excel'" 
          type="info" density="compact" variant="tonal" border="start" class="mb-4 rounded-lg text-caption font-weight-medium"
        >
          NOTA: Los archivos se extraerán directamente del servidor local a no ser que se adjunten manualmente.
        </v-alert>

        <v-table density="compact" class="border rounded-lg bg-surface mt-2" style="max-height: 350px; overflow-y: auto;">
          <thead>
            <tr>
              <th class="text-center" style="width: 50px;">
                <v-checkbox
                  :model-value="isAllSelected"
                  :indeterminate="isSomeSelected"
                  @click="toggleSelectAll"
                  density="compact"
                  hide-details
                  color="primary"
                  :disabled="loading_validation"
                ></v-checkbox>
              </th>
              <th class="text-left font-weight-bold">Código</th>
              <th class="text-left font-weight-bold">Equipo y Marca</th>
              <th class="text-center font-weight-bold">Estado Previo</th>
              <th class="text-center font-weight-bold">Validación</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading_validation">
              <td colspan="5" class="text-center py-6">
                <v-progress-circular indeterminate color="primary" size="32" class="mb-2"></v-progress-circular>
                <div class="text-caption text-medium-emphasis">Escaneando servidor local...</div>
              </td>
            </tr>
            <tr v-else v-for="item in items" :key="item.id">
              <td class="text-center">
                <v-checkbox
                  v-model="selected_items"
                  :value="item.id"
                  :disabled="item.disabled"
                  density="compact"
                  hide-details
                  color="primary"
                ></v-checkbox>
              </td>
              <td class="font-weight-medium" :class="{'text-decoration-line-through text-grey': item.disabled}">{{ item.registry_code }}</td>
              <td class="text-caption" :class="{'text-grey': item.disabled}">{{ item.equipment }}</td>
              
              <td class="text-center">
                <template v-if="action === 'excel'">
                  <v-chip v-if="item.already_has_it" color="info" size="x-small" variant="tonal">Tiene Excel</v-chip>
                  <v-chip v-else color="grey" size="x-small" variant="tonal">Sin Excel</v-chip>
                </template>
                <template v-else-if="action === 'qr'">
                  <v-chip v-if="item.disabled" color="error" size="x-small" variant="tonal">Sin Excel</v-chip>
                  <v-chip v-else-if="item.already_has_it" color="success" size="x-small" variant="tonal">En Nube</v-chip>
                  <v-chip v-else color="info" size="x-small" variant="tonal">Con PDF</v-chip>
                </template>
                <template v-else>
                  <v-chip v-if="item.disabled" color="warning" size="x-small" variant="tonal">Notificado</v-chip>
                  <v-chip v-else-if="item.already_has_it" color="success" size="x-small" variant="tonal">En Nube</v-chip>
                  <v-chip v-else color="grey" size="x-small" variant="tonal">Sin subir</v-chip>
                </template>
              </td>

              <td class="text-center">
                <template v-if="action === 'excel'">
                  <div v-if="['found', 'manual'].includes(item.validation_status)" class="d-flex align-center justify-center">
                    <v-icon v-if="item.validation_status === 'found'" color="success" size="small" title="Encontrado en Servidor">mdi-check-circle</v-icon>
                    <v-icon v-else color="info" size="small" title="Adjuntado Manualmente">mdi-paperclip</v-icon>
                    <v-btn icon variant="text" size="small" color="error" class="ml-1" title="Descartar Excel" @click.stop="discardExcel(item)">
                      <v-icon>mdi-close</v-icon>
                    </v-btn>
                  </div>
                  
                  <div v-else-if="item.validation_status === 'discarded'" class="d-flex align-center justify-center">
                    <v-btn icon variant="text" size="small" color="primary" title="Adjuntar Manualmente" @click.stop="openManualUpload(item)">
                      <v-icon>mdi-upload</v-icon>
                    </v-btn>
                    <v-btn icon variant="text" size="small" color="success" title="Restaurar del Servidor" @click.stop="restoreNative(item)">
                      <v-icon>mdi-backup-restore</v-icon>
                    </v-btn>
                  </div>
                  
                  <v-btn v-else icon variant="text" size="small" color="primary" title="Adjuntar Manualmente" @click.stop="openManualUpload(item)">
                    <v-icon>mdi-upload</v-icon>
                  </v-btn>
                </template>

                <template v-else-if="action === 'qr'">
                  <v-icon v-if="!item.disabled || item.already_has_it" color="success" size="small">mdi-check-circle</v-icon>
                  <v-icon v-else color="error" size="small" title="Falta Excel">mdi-close-circle</v-icon>
                </template>

                <template v-else>
                  <v-icon v-if="!item.disabled" color="blue-darken-1" size="small" title="Apto para notificar">mdi-bell-check</v-icon>
                  <v-icon v-else color="grey" size="small" title="Ya tiene una solicitud activa">mdi-minus-circle</v-icon>
                </template>
              </td>
            </tr>
          </tbody>
        </v-table>
      </v-card-text>

      <v-card-actions class="px-6 pb-4 pt-2">
              <load-sheet ref="loadSheetModalRef" @file-attached="onFileAttached" />
        <v-spacer/>
        <v-btn variant="flat" class="font-weight-bold mr-3 px-4" @click="close" :disabled="is_processing">Cancelar</v-btn>
        <v-btn 
          :color="modalConfig.color" 
          class="font-weight-bold px-4 text-white" 
          variant="flat" 
          @click="confirmAction"
          :loading="is_processing"
          :disabled="loading_validation || !hayItemsValidos"
        >
          <v-icon start>{{ modalConfig.actionIcon }}</v-icon> Continuar
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, getCurrentInstance } from 'vue'
import { useAppStore } from '@/stores/appStore'
import BaseModalHeader from '@/components/commonComponents/BaseModalHeader.vue'
import CertificateDataService from '@/services/certificates/certificateDataService.js'
import { defineAsyncComponent } from 'vue'

const LoadSheet = defineAsyncComponent(() => import('@/views/certificates/components/LoadSheet.vue'))

const emit = defineEmits(['clearSelection', 'reloadListComponent'])
const { appContext } = getCurrentInstance()
const $swal = appContext.config.globalProperties.$swal
const appStore = useAppStore()

const dialog = ref(false)
const action = ref('') // 'excel', 'qr', 'notify'
const items = ref([])
const selected_items = ref([]) // IDs de los checkboxes marcados
const loading_validation = ref(false)
const is_processing = ref(false)
const loadSheetModalRef = ref(null)

const configMap = {
  excel: {
    title: 'Auto-Carga de Excels Nativos',
    icon: 'mdi-folder-search',
    color: 'green-darken-2',
    subtitle: 'Se generarán los PDFs para los siguientes certificados:',
    actionIcon: 'mdi-server-network'
  },
  qr: {
    title: 'Firma Múltiple y Código QR',
    icon: 'mdi-qrcode-scan',
    color: 'primary',
    subtitle: 'Se firmarán en lote los siguientes certificados:',
    actionIcon: 'mdi-pen'
  },
  notify: {
    title: 'Solicitar Firma a Gerencia',
    icon: 'mdi-bell-ring',
    color: 'orange-darken-2',
    subtitle: 'Se registrará la solicitud de firma para los siguientes equipos:',
    actionIcon: 'mdi-send-check'
  }
}

const modalConfig = computed(() => configMap[action.value] || configMap.excel)

import { watch } from 'vue'

const tieneExcelSubido = (cert) => {
  return cert.uploaded_xls && cert.uploaded_xls !== '0' && cert.uploaded_xls !== 'False' && cert.uploaded_xls !== 'false'
}

// Ahora es válido simplemente si el usuario marcó al menos una fila
const hayItemsValidos = computed(() => selected_items.value.length > 0)

const isAllSelected = computed(() => {
  const validItems = items.value.filter(i => !i.disabled)
  return validItems.length > 0 && selected_items.value.length === validItems.length
})

const isSomeSelected = computed(() => {
  const validItems = items.value.filter(i => !i.disabled)
  return selected_items.value.length > 0 && selected_items.value.length < validItems.length
})

const toggleSelectAll = () => {
  if (isAllSelected.value) {
    // Si todo lo válido estaba seleccionado, lo vaciamos
    selected_items.value = []
  } else {
    // MAGIA UX: Si marca el general de la cabecera, forzamos la selección 
    // de TODO lo que no esté bloqueado (incluso los que ya estaban listos)
    selected_items.value = items.value.filter(i => !i.disabled).map(i => i.id)
  }
}

const open = async (actionType, selectedCerts) => {
  action.value = actionType
  selected_items.value = []

  items.value = selectedCerts.map(cert => {
    let disabled = false
    let already_has_it = false

    if (actionType === 'qr') {
      if (!tieneExcelSubido(cert)) {
        disabled = true // Le falta Excel (Bloqueado)
      } else if (cert.uploaded) {
        already_has_it = true // Ya está en Nube (Permitido pero Desmarcado)
      }
    } else if (actionType === 'notify') {
      if (cert.signature_requested) {
        disabled = true // 2da: Ya notificado (Bloqueado, no se puede hacer spam)
      } else if (cert.uploaded) {
        already_has_it = true // 1ra: Ya está en nube, pero podría ser corrección (Permitido pero Desmarcado)
      }
    }

    return {
      ...cert,
      equipment: `${cert.equipment} ${cert.brand}`.trim(),
      validation_status: 'pending',
      disabled,
      already_has_it
    }
  })

  // Preseleccionar los "Nuevos" y válidos para QR y Notify
  if (actionType !== 'excel') {
    items.value.forEach(item => {
      if (!item.disabled && !item.already_has_it) {
        selected_items.value.push(item.id)
      }
    })
  }

  dialog.value = true

  if (actionType === 'excel') {
    validarExcelsEnServidor()
  }
}

const openManualUpload = (item) => {
  if (loadSheetModalRef.value) {
    loadSheetModalRef.value.open(item)
  }
}

const onFileAttached = (payload) => {
  const item = items.value.find(i => i.id === payload.id)
  if (item) {
    item.validation_status = 'manual'
    item.disabled = false
    item.file = payload.file
    item.password = payload.password
    
    // marca check automatico para agilizar proceso
    if (!selected_items.value.includes(item.id)) {
      selected_items.value.push(item.id)
    }
  }
}

const discardExcel = (item) => {
  if (item.validation_status === 'found') {
    item.validation_status = 'discarded'
  } else if (item.validation_status === 'manual') {
    item.validation_status = item.native_filename ? 'discarded' : 'not_found'
    item.file = null
    item.password = ''
  }
  item.disabled = true
  selected_items.value = selected_items.value.filter(id => id !== item.id)
}

const restoreNative = (item) => {
  item.validation_status = 'found'
  item.disabled = false
  item.file = null
  item.password = ''
  if (!selected_items.value.includes(item.id)) {
    selected_items.value.push(item.id)
  }
}

const validarExcelsEnServidor = async () => {
  loading_validation.value = true
  try {
    const ids = items.value.map(i => i.id)
    const response = await CertificateDataService.scanNativeExcels(ids)
    
    const resultados = response.data
    items.value.forEach(item => {
      const info = resultados.find(r => r.id === item.id)
      
      if (info && info.status === 'found') {
        item.validation_status = 'found'
        item.native_filename = info.filename
        
        if (tieneExcelSubido(item)) {
          item.already_has_it = true // Ya tiene Excel (Permitido pero desmarcado)
        } else {
          selected_items.value.push(item.id) // Nuevo (Marcado)
        }
      } else {
        item.validation_status = info ? info.status : 'not_found'
        item.disabled = true // No se encontró o hubo conflicto (Bloqueado)
      }
    })
  } catch (error) {
    console.error("Error escaneando disco H:", error)
    $swal.fire({ icon: 'error', title: 'Error de Conexión', text: 'No se pudo acceder a la carpeta de red.' })
  } finally {
    loading_validation.value = false
  }
}

const confirmAction = async () => {
  if (is_processing.value) return
  is_processing.value = true

  try {
    // Usamos EXACTAMENTE los IDs que el usuario dejó marcados
    const aptos = items.value.filter(i => selected_items.value.includes(i.id))
    
    if (action.value === 'notify') {
      const ids = aptos.map(i => i.id)
      await CertificateDataService.requestBatchSignatures(ids)
      $swal.fire({ ...appStore.ToastGuardadoExito, title: '¡Solicitud Registrada!' })
      emit('clearSelection')
      close()
    } 
    
    else if (action.value === 'qr') {
      aptos.forEach(cert => {
        window.dispatchEvent(new CustomEvent('wss-qr-start', { detail: { certificate: cert } }))
      })
      $swal.fire({
        toast: true, position: 'top-end', showConfirmButton: false, timer: 4000,
        icon: 'info', title: `Procesando ${aptos.length} firmas en segundo plano...`
      })
      emit('clearSelection')
      close()
    }

    else if (action.value === 'excel') {
      aptos.forEach(cert => {
        // soporte hibrido para carga en lote de nativos y manuales en un solo foreach
        window.dispatchEvent(new CustomEvent('wss-sheet-start', { 
          detail: { 
            id: cert.id, 
            code: cert.registry_code,
            native_filename: cert.native_filename,
            file: cert.file,
            password: cert.password
          } 
        }))
      })

      $swal.fire({
        toast: true, position: 'top-end', showConfirmButton: false, timer: 3000,
        icon: 'success', title: `Enviando ${aptos.length} archivos a procesar...`
      })
      emit('clearSelection')
      close()
    }

  } catch (error) {
    $swal.fire({ icon: 'error', title: 'Error', text: 'Hubo un problema al ejecutar la acción.' })
  } finally {
    is_processing.value = false
  }
}

const close = () => {
  dialog.value = false
  items.value = []
}

defineExpose({ open })
</script>