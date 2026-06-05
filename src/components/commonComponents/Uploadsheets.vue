<template>
  <span style="display: none;" data-component="UploadSheets-Controller"></span>
</template>

<script setup>
import { onMounted, onBeforeUnmount, getCurrentInstance } from 'vue'
import { useAppStore } from '@/stores/appStore'
import CertificateDataService from '@/services/certificates/certificateDataService'

const appStore = useAppStore()

const { appContext } = getCurrentInstance()
const $swal = appContext.config.globalProperties.$swal

function handleSheetStart(e) {
  const { id, code, file, password, native_filename } = e.detail
  const currentUser = JSON.parse(localStorage.getItem('user')) || {}

  // Registrar o resetear la tarea en el store
  const existingTask = appStore.uploadTasks.find(t => String(t.id) === String(id) && t.type === 'sheet')
  if (!existingTask) {
    appStore.addUploadTask({
      id, code, status: 'generating', progress: 0, attempts: 0,
      type: 'sheet', username: currentUser.username || 'unknown',
      step: 'Enviando Excel al servidor...', error_msg: ''
    })
  } else {
    appStore.updateUploadTask(id, 'sheet', { 
      status: 'generating', progress: 0, step: 'Enviando Excel al servidor...', error_msg: '' 
    })
  }

  // ✅ PUNTO ÚNICO DE CONSTRUCCIÓN DEL PAYLOAD
  // Si viene con `file` → subida manual desde el navegador → multipart FormData
  // Si viene con `native_filename` → proceso nativo desde el servidor → JSON plano
  let data
  if (file) {
    data = new FormData()
    data.append('file', file)
    data.append('password', password || '')
    data.append('related_certificate', id)
  } else {
    data = { related_certificate: id, native_filename }
  }

  CertificateDataService.buildPDF(data).catch((error) => {
    const errorMsg = error.response?.data?.error || 'Fallo de red al subir el documento.'
    appStore.updateUploadTask(id, 'sheet', { 
      status: 'error', progress: 0, step: '', error_msg: errorMsg 
    })
    window.dispatchEvent(new CustomEvent('sheet-preview-error', { detail: { cert_id: id } }))
  })
}

function handleCancelSheet(e) {
  const certId = e.detail.id
  if (window.cancelarSheetWebSocket) window.cancelarSheetWebSocket(certId)
  const task = appStore.uploadTasks.find(t => String(t.id) === String(certId) && t.type === 'sheet')
  if (task && window.enviarProgresoWebSocket) {
    window.enviarProgresoWebSocket(certId, 0, 'canceled', task.code, 0, 'sheet')
  }
}

function handleApproveSheet(e) {
  const { id, final_name, temp_url } = e.detail

  $swal.fire({ ...appStore.toastGuardando, title: 'Guardando en red local...' })

  CertificateDataService.patch(id, {
    status: 2, final_name, temp_url,
  }).then(() => {
    $swal.fire({ ...appStore.toastGuardadoExito, title: '¡Excel guardado!' })

    const currentUser = JSON.parse(localStorage.getItem('user')) || {}
    if (window.enviarNotificacionGlobal) {
      window.enviarNotificacionGlobal(currentUser.username, 'success', 'Excel Procesado', `El archivo ${final_name} se guardó en red.`)
    }
  }).catch((error) => {
    let errorMsg = 'No se pudo guardar en el disco de red.'
    if (error.response?.data?.error) {
      errorMsg = error.response.data.error
    }
    $swal.fire({ icon: 'error', title: 'Error al guardar', text: errorMsg, confirmButtonText: 'Entendido' })
  })
}

onMounted(() => {
  window.addEventListener('wss-sheet-start',          handleSheetStart)
  window.addEventListener('wss-cancel-sheet-action',  handleCancelSheet)
  window.addEventListener('wss-approve-sheet-action', handleApproveSheet)
})

onBeforeUnmount(() => {
  window.removeEventListener('wss-sheet-start',          handleSheetStart)
  window.removeEventListener('wss-cancel-sheet-action',  handleCancelSheet)
  window.removeEventListener('wss-approve-sheet-action', handleApproveSheet)
})
</script>