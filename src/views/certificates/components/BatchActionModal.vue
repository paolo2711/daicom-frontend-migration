<template>
  <v-dialog v-model="dialog" max-width="850" class="dialog-premium" persistent>
    <v-card @keydown.enter="confirmarConEnter">
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
          type="info" density="compact" variant="tonal" class="mb-4 rounded-lg text-caption"
        >
          <div class="mb-1">
            <span class="font-weight-bold">Se buscan en</span>
            <code class="ruta">H:\Certificados Nativos\</code>
            <span class="text-medium-emphasis">— subcarpeta Acreditados, No Acreditados u Operatividad según el tipo.</span>
          </div>
          <div class="mb-1">
            <span class="font-weight-bold">Se imprime la hoja</span>
            <code class="ruta">CERTIFICADO</code>
            <span class="text-medium-emphasis">en los acreditados y la</span>
            <code class="ruta">hoja 3</code>
            <span class="text-medium-emphasis">en los demás.</span>
          </div>
          <div class="text-medium-emphasis">
            Si el archivo no aparece, puede adjuntarlo: un Excel para convertir, o un PDF ya hecho.
          </div>
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
            <tr v-else v-for="item in items" :key="item.id" :class="{ 'fila-bloqueada': item.disabled }">
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
              <td class="font-weight-medium">{{ item.registry_code }}</td>
              <td class="text-caption">{{ item.equipment }}</td>

              <td class="text-center">
                <v-chip :color="estadoPrevio(item).color" size="x-small" variant="tonal">
                  {{ estadoPrevio(item).texto }}
                </v-chip>
              </td>

              <td class="text-center">
                <div class="d-flex align-center justify-center">
                  <v-icon :color="validacion(item).color" size="small" :title="validacion(item).titulo">
                    {{ validacion(item).icono }}
                  </v-icon>

                  <template v-if="action === 'excel'">
                    <v-btn v-if="estaAdjuntado(item)" icon variant="text" size="small" color="grey" class="ml-1"
                           title="Quitar el archivo adjuntado" @click.stop="discardExcel(item)">
                      <v-icon>mdi-close</v-icon>
                    </v-btn>
                    <v-menu v-else location="bottom end">
                      <template v-slot:activator="{ props }">
                        <v-btn v-bind="props" icon variant="text" size="small" color="primary" class="ml-1"
                               title="Adjuntar archivo" @click.stop>
                          <v-icon>mdi-upload</v-icon>
                        </v-btn>
                      </template>
                      <v-list density="compact" class="py-1">
                        <v-list-item prepend-icon="mdi-file-excel" @click="openManualUpload(item)">
                          <v-list-item-title class="font-weight-medium">Adjuntar Excel</v-list-item-title>
                          <v-list-item-subtitle class="text-caption">Se convierte a PDF</v-list-item-subtitle>
                        </v-list-item>
                        <v-list-item prepend-icon="mdi-file-pdf-box" @click="openPdfBaseUpload(item)">
                          <v-list-item-title class="font-weight-medium">Adjuntar PDF ya hecho</v-list-item-title>
                          <v-list-item-subtitle class="text-caption">Queda listo para firmar</v-list-item-subtitle>
                        </v-list-item>
                      </v-list>
                    </v-menu>
                  </template>

                  <template v-else-if="action === 'qr'">
                    <v-btn v-if="item.validation_status === 'manual_pdf'" icon variant="text" size="small" color="grey" class="ml-1"
                           title="Quitar el PDF adjuntado" @click.stop="discardManualPdf(item)">
                      <v-icon>mdi-close</v-icon>
                    </v-btn>
                    <v-btn v-else icon variant="text" size="small" color="primary" class="ml-1"
                           title="Adjuntar PDF firmado" @click.stop="openManualPdfUpload(item)">
                      <v-icon>mdi-upload</v-icon>
                    </v-btn>
                  </template>
                </div>
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
          color="primary"
          class="font-weight-bold px-4 text-white"
          variant="flat"
          @click="confirmAction"
          :loading="is_processing"
          :disabled="!puedeConfirmar"
        >
          <v-icon start>{{ modalConfig.actionIcon }}</v-icon> Continuar
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { Toast } from '@/plugins/alerts'
import { ref, computed, getCurrentInstance } from 'vue'
import { useAppStore } from '@/stores/appStore'
import BaseModalHeader from '@/components/commonComponents/BaseModalHeader.vue'
import CertificateDataService from '@/services/certificates/certificateDataService.js'
import { defineAsyncComponent } from 'vue'
import { tieneExcelBase } from '@/utils/certificates/excelBase'
import { alPresionarEnter } from '@/utils/keyboard'

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
const force_select = ref(false)

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



// Ahora es válido simplemente si el usuario marcó al menos una fila
const hayItemsValidos = computed(() => selected_items.value.length > 0)

// Una sola condición para el botón y para el Enter, así no se separan.
const puedeConfirmar = computed(() =>
  !loading_validation.value && !is_processing.value && hayItemsValidos.value
)

const confirmarConEnter = alPresionarEnter(() => {
  if (puedeConfirmar.value) confirmAction()
})

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

const open = async (actionType, selectedCerts, forceSelect = false) => {
  action.value = actionType
  selected_items.value = []
  force_select.value = forceSelect

  items.value = selectedCerts.map(cert => {
    let disabled = false
    let already_has_it = false

    if (actionType === 'excel') {
      if (tieneExcelBase(cert)) {
        already_has_it = true // Ya tiene Excel adjuntado (chip "Tiene Excel")
      }
    } else if (actionType === 'qr') {
      if (!tieneExcelBase(cert)) {
        disabled = true // Le falta Excel (Bloqueado)
      } else if (cert.uploaded) {
        already_has_it = true // Ya está en Nube (Permitido pero Desmarcado)
      }
    } else if (actionType === 'notify') {
      if (!tieneExcelBase(cert)) {
        disabled = true // Bloqueado: Le falta el Excel base
      } else if (cert.signature_requested) {
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
      // forceSelect: el usuario pidió explícitamente esta acción para este certificado puntual
      // (ej. botón "Reemplazar"), así que ignoramos already_has_it y lo marcamos igual.
      if (!item.disabled && (forceSelect || !item.already_has_it)) {
        selected_items.value.push(item.id)
      }
    })
  }

  dialog.value = true

  if (actionType === 'excel') {
    validarExcelsEnServidor()
  }
}

const abrirAdjuntar = (item, modo) => loadSheetModalRef.value?.open(item, modo)

const openManualUpload    = (item) => abrirAdjuntar(item, 'excel')
const openPdfBaseUpload   = (item) => abrirAdjuntar(item, 'pdf-base')
const openManualPdfUpload = (item) => abrirAdjuntar(item, 'pdf')

// En la accion Excel se puede adjuntar el Excel o el PDF ya hecho.
const ADJUNTADO = {
  manual:          { icono: 'mdi-file-excel',   titulo: 'Excel adjuntado, se convertirá al continuar' },
  manual_pdf_base: { icono: 'mdi-file-pdf-box', titulo: 'PDF adjuntado, se guardará al continuar' },
}
const estaAdjuntado = (item) => item.validation_status in ADJUNTADO
const iconoAdjunto  = (item) => (ADJUNTADO[item.validation_status] || {}).icono || 'mdi-paperclip'
const tituloAdjunto = (item) => (ADJUNTADO[item.validation_status] || {}).titulo || ''

// Tres colores en toda la tabla: el de la accion para lo que ya esta hecho o
// listo, rojo solo para lo que bloquea, gris para lo demas.
const NEUTRO = 'grey'

const estadoPrevio = (item) => {
  const hecho = modalConfig.value.color

  if (action.value === 'excel') {
    return item.already_has_it
      ? { texto: 'Tiene Excel', color: hecho }
      : { texto: 'Sin Excel', color: NEUTRO }
  }

  if (action.value === 'qr') {
    if (item.disabled) return { texto: 'Sin Excel', color: 'error' }
    return item.already_has_it
      ? { texto: 'En Nube', color: hecho }
      : { texto: 'Con PDF', color: NEUTRO }
  }

  if (item.signature_requested) return { texto: 'Notificado', color: hecho }
  if (item.disabled) return { texto: 'Sin Excel', color: 'error' }
  return { texto: item.already_has_it ? 'En Nube' : 'Con PDF', color: NEUTRO }
}

const validacion = (item) => {
  const listo = modalConfig.value.color

  if (action.value === 'excel') {
    if (estaAdjuntado(item)) {
      return { icono: iconoAdjunto(item), color: listo, titulo: tituloAdjunto(item) }
    }
    return item.validation_status === 'found'
      ? { icono: 'mdi-check-circle', color: listo, titulo: 'Encontrado en el servidor' }
      : { icono: 'mdi-close-circle', color: 'error', titulo: 'No está en el servidor' }
  }

  if (action.value === 'qr') {
    if (item.validation_status === 'manual_pdf') {
      return { icono: 'mdi-file-pdf-box', color: listo, titulo: 'PDF firmado adjuntado' }
    }
    return item.disabled
      ? { icono: 'mdi-close-circle', color: 'error', titulo: 'No tiene certificado base' }
      : { icono: 'mdi-check-circle', color: listo, titulo: 'Listo para firmar' }
  }

  if (!item.disabled) return { icono: 'mdi-bell-check', color: listo, titulo: 'Apto para notificar' }
  if (item.signature_requested) return { icono: 'mdi-minus-circle', color: NEUTRO, titulo: 'Ya tiene una solicitud activa' }
  return { icono: 'mdi-close-circle', color: 'error', titulo: 'No tiene certificado base' }
}

const discardManualPdf = (item) => {
  item.validation_status = 'pending'
  item.file = null
  item.disabled = !tieneExcelBase(item)
  if (item.disabled) {
    selected_items.value = selected_items.value.filter(id => id !== item.id)
  }
}

// El modo lo decide el modal de adjuntar, no la accion: en Excel se puede
// adjuntar el Excel a convertir o el PDF ya hecho.
const ESTADO_POR_MODO = { excel: 'manual', 'pdf-base': 'manual_pdf_base', pdf: 'manual_pdf' }

const onFileAttached = (payload) => {
  const item = items.value.find(i => i.id === payload.id)
  if (item) {
    item.validation_status = ESTADO_POR_MODO[payload.modo] || 'manual'
    item.file = payload.file
    item.password = payload.modo === 'excel' ? payload.password : ''
    item.disabled = false

    // marca check automatico para agilizar proceso
    if (!selected_items.value.includes(item.id)) {
      selected_items.value.push(item.id)
    }
  }
}

const discardExcel = (item) => {
  // Si el servidor ya tenía un excel nativo para este item, lo recuperamos automáticamente.
  // Si no, queda sin excel disponible (igual que un manual_pdf descartado en QR).
  item.validation_status = item.native_filename ? 'found' : 'not_found'
  item.file = null
  item.password = ''
  item.disabled = !item.native_filename

  if (item.disabled) {
    selected_items.value = selected_items.value.filter(id => id !== item.id)
  } else if (!selected_items.value.includes(item.id)) {
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
        
        if (tieneExcelBase(item) && !force_select.value) {
          item.already_has_it = true // Ya tiene Excel (Permitido pero desmarcado)
        } else {
          selected_items.value.push(item.id) // Nuevo o forzado (Marcado)
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

const guardarPdfsBase = async (certs) => {
  Toast.fire({ ...appStore.toastGuardando, title: 'Guardando los PDF...' })

  const fallados = []
  for (const cert of certs) {
    const formData = new FormData()
    formData.append('file', cert.file)
    try {
      await CertificateDataService.subirPdfBase(cert.id, formData)
    } catch (error) {
      fallados.push(`${cert.registry_code}: ${error.response?.data?.error || 'no se pudo subir'}`)
    }
  }

  if (fallados.length) {
    $swal.fire({
      icon: 'error', title: 'Algunos PDF no se guardaron',
      html: fallados.join('<br>'), confirmButtonText: 'Entendido'
    })
    return
  }

  Toast.fire({
    ...appStore.toastGuardadoExito,
    title: certs.length === 1 ? 'PDF guardado, listo para firmar' : `${certs.length} PDF guardados, listos para firmar`
  })
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
      Toast.fire({ ...appStore.toastGuardadoExito, title: '¡Solicitud Registrada!' })
      emit('clearSelection')
      close()
    } 
    
    else if (action.value === 'qr') {
      aptos.forEach(cert => {
        if (cert.validation_status === 'manual_pdf' && cert.file) {
          window.dispatchEvent(new CustomEvent('wss-manual-pdf-upload', { detail: { certificate: cert, file: cert.file } }))
        } else {
          window.dispatchEvent(new CustomEvent('wss-qr-start', { detail: { certificate: cert } }))
        }
      })
      Toast.fire({ timer: 4000,
        icon: 'info', title: `Procesando ${aptos.length} firmas/subidas en segundo plano...`
      })
      emit('clearSelection')
      close()
    }

    else if (action.value === 'excel') {
      // El PDF ya hecho no se convierte: se guarda directo y no pasa por la cola.
      const yaHechos  = aptos.filter(c => c.validation_status === 'manual_pdf_base')
      const aConvertir = aptos.filter(c => c.validation_status !== 'manual_pdf_base')

      aConvertir.forEach(cert => {
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

      if (aConvertir.length) {
        Toast.fire({ timer: 3000,
          icon: 'success', title: `Enviando ${aConvertir.length} archivos a procesar...`
        })
      }

      if (yaHechos.length) await guardarPdfsBase(yaHechos)

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

<style scoped>
.fila-bloqueada {
  opacity: 0.55;
}

.ruta {
  background: rgba(var(--v-theme-on-surface), 0.06);
  border-radius: 4px;
  padding: 1px 5px;
  margin: 0 2px;
  font-size: 0.95em;
  font-weight: 600;
  white-space: nowrap;
}
</style>