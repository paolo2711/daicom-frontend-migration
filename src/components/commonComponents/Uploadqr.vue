<template>
  <span style="display: none;" data-component="UploadQR-Controller"></span>
</template>

<script setup>
import { onMounted, onBeforeUnmount } from 'vue'
import { useAppStore } from '@/stores/appStore'
import certificateDataService from '@/services/certificates/certificateDataService'


const appStore = useAppStore()

const abortControllers = {}

function getTask(certId) {
  return appStore.uploadTasks.find(
    t => String(t.id) === String(certId) && t.type === 'qr'
  )
}

function isCancelled(certId) {
  const t = getTask(certId)
  return !t || t.status === 'canceled'
}

function sendWSProgress(certId, progress, status, code, attempts) {
  if (window.enviarProgresoWebSocket) {
    window.enviarProgresoWebSocket(certId, progress, status, code, attempts, 'qr')
  }
}

function handleQRStart(e) {
  const { certificate } = e.detail
  const currentUser = JSON.parse(localStorage.getItem('user')) || {}
  const username = currentUser.username || 'unknown'

  const exists = getTask(certificate.id)
  if (exists) {
    appStore.updateUploadTask(certificate.id, 'qr', { status: 'generating', progress: 5, attempts: 0, username })
  } else {
    appStore.addUploadTask({
      id: certificate.id, code: certificate.registry_code,
      status: 'generating', progress: 5, attempts: 0,
      username, type: 'qr',
    })
  }

  sendWSProgress(certificate.id, 5, 'generating', certificate.registry_code, 0)
  processQR(certificate.id)
}

function handleQRCancel(e) {
  const certId = e.detail.id
  if (abortControllers[certId]) {
    abortControllers[certId].abort()
    delete abortControllers[certId]
  }
  const code = (getTask(certId) || {}).code || 'Desconocido'
  appStore.updateUploadTask(certId, 'qr', { status: 'canceled', progress: 0 })
  sendWSProgress(certId, 0, 'canceled', code, 0)
}

function handleQRRetry(e) {
  const certId = e.detail.id
  appStore.updateUploadTask(certId, 'qr', { status: 'generating', progress: 5, attempts: 0 })
  processQR(certId)
}

async function processQR(certId) {
  if (isCancelled(certId)) return

  const controller = new AbortController()
  abortControllers[certId] = controller

  const getCode     = () => (getTask(certId) || {}).code     || ''
  const getAttempts = () => (getTask(certId) || {}).attempts || 0

  try {
    appStore.updateUploadTask(certId, 'qr', { status: 'generating', progress: 15, step: 'Generando y Firmando PDF...' })
    sendWSProgress(certId, 15, 'generating', getCode(), getAttempts())

    // El backend ahora hace todo el trabajo pesado, incluyendo la subida.
    // Solo esperamos a que termine. Los WebSockets irán actualizando la barra.
    const generated_qr = await certificateDataService.generateQR(certId)
    
    if (isCancelled(certId)) return

    // Extraer la data sin importar si Axios la desempaquetó o no
    const responseData = generated_qr.data || generated_qr;

    // Evaluamos el status real basado estrictamente en el flag del backend
    const finalStatus = responseData.warning === true ? 'warning' : 'success';
    const finalStep   = responseData.success || '¡Completado!';

    appStore.updateUploadTask(certId, 'qr', { 
      status: finalStatus, 
      progress: 100, 
      uuid: responseData.uuid,
      step: finalStep
    })
    sendWSProgress(certId, 100, finalStatus, getCode(), getAttempts())

  } catch (error) {
    if (isCancelled(certId) || error.name === 'AbortError') return

    // Desempaquetado a prueba de balas para Axios
    const responseData = error.response?.data || error.response || {};
    const errorMsg = responseData.error || error.message || 'Error de conexión / Timeout';
    const currentTask = getTask(certId)

    if (currentTask && currentTask.attempts < 2 && !responseData.error) {
      // Solo reintenta si es fallo de red, no si el backend devolvió un error lógico (ej: .pfx dañado)
      appStore.updateUploadTask(certId, 'qr', { status: 'retrying', attempts: currentTask.attempts + 1, step: 'Fallo de red, reintentando...' })
      sendWSProgress(certId, 5, 'retrying', getCode(), currentTask.attempts + 1)
      setTimeout(() => { processQR(certId) }, 3000)
    } else if (currentTask) {
      const responseData = error.response?.data || error.response || {};
      const errorMsg = responseData.error || error.message || 'Error de conexión / Timeout';
      const isCloudError = !!responseData.is_cloud_error;
      const offlineUrl = responseData.offline_url || null;

      appStore.updateUploadTask(certId, 'qr', {
        status: 'error',
        error_msg: errorMsg,
        step: '',
        is_cloud_error: isCloudError,
        offline_url: offlineUrl
      })

      if (window.enviarProgresoWebSocket) {
        window.enviarProgresoWebSocket(certId, 0, 'error', getCode(), currentTask.attempts, 'qr', '', errorMsg, isCloudError, offlineUrl)
      }
    }
  }
}

function handleManualPdfStart(e) {
  const { certificate, file } = e.detail
  const currentUser = JSON.parse(localStorage.getItem('user')) || {}
  const username = currentUser.username || 'unknown'

  const exists = getTask(certificate.id)
  if (exists) {
    appStore.updateUploadTask(certificate.id, 'qr', {
      status: 'uploading', progress: 50, attempts: 0,
      username, source: 'manual', step: 'Subiendo PDF rescatado a la nube...'
    })
  } else {
    appStore.addUploadTask({
      id: certificate.id, code: certificate.registry_code,
      status: 'uploading', progress: 50, attempts: 0,
      username, type: 'qr', source: 'manual', step: 'Subiendo PDF rescatado a la nube...'
    })
  }

  sendWSProgress(certificate.id, 50, 'uploading', certificate.registry_code, 0)
  processManualPdf(certificate.id, file)
}

async function processManualPdf(certId, file) {
  if (isCancelled(certId)) return
  const getCode = () => (getTask(certId) || {}).code || ''

  try {
    const formData = new FormData();
    formData.append('file', file);
    
    // NOTA: Asegúrate de tener este método en tu certificateDataService.js
    const response = await certificateDataService.manualCloudUpload(certId, formData);
    
    const responseData = response.data || response;
    const finalStatus = responseData.warning === true ? 'warning' : 'success';
    const finalStep   = responseData.success || 'Subida manual exitosa';

    appStore.updateUploadTask(certId, 'qr', { 
      status: finalStatus, progress: 100, uuid: responseData.uuid, step: finalStep
    })
    sendWSProgress(certId, 100, finalStatus, getCode(), 0)

  } catch (error) {
    if (isCancelled(certId)) return
    const errorMsg = error.response?.data?.error || error.message || 'Error de conexión / Nube caída';
    appStore.updateUploadTask(certId, 'qr', { status: 'error', error_msg: errorMsg, step: '' })
    if (window.enviarProgresoWebSocket) {
      window.enviarProgresoWebSocket(certId, 0, 'error', getCode(), 0, 'qr', '', errorMsg)
    }
  }
}

onMounted(() => {
  window.addEventListener('wss-qr-start',  handleQRStart)
  window.addEventListener('wss-qr-cancel', handleQRCancel)
  window.addEventListener('wss-qr-retry',  handleQRRetry)
  window.addEventListener('wss-manual-pdf-upload', handleManualPdfStart)
})

onBeforeUnmount(() => {
  window.removeEventListener('wss-qr-start',  handleQRStart)
  window.removeEventListener('wss-qr-cancel', handleQRCancel)
  window.removeEventListener('wss-qr-retry',  handleQRRetry)
  window.removeEventListener('wss-manual-pdf-upload', handleManualPdfStart)
})
</script>