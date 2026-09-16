<template>
  <span style="display: none;" data-component="UploadQR-Controller"></span>
</template>

<script setup>
import { onMounted, onBeforeUnmount } from 'vue'
import { useAppStore } from '@/stores/appStore'
import certificateDataService from '@/services/certificates/certificateDataService'


const appStore = useAppStore()

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
  const { certificate, fechaFirma = '' } = e.detail
  const currentUser = JSON.parse(localStorage.getItem('user')) || {}
  const username = currentUser.username || 'unknown'

  // Viaja en la tarea para que el reintento use la misma fecha que el original.
  const exists = getTask(certificate.id)
  if (exists) {
    appStore.updateUploadTask(certificate.id, 'qr', { status: 'generating', progress: 5, attempts: 0, username, fecha_firma: fechaFirma })
  } else {
    appStore.addUploadTask({
      id: certificate.id, code: certificate.registry_code,
      status: 'generating', progress: 5, attempts: 0,
      username, type: 'qr', fecha_firma: fechaFirma,
    })
  }

  sendWSProgress(certificate.id, 5, 'generating', certificate.registry_code, 0)
  processQR(certificate.id)
}

// El pedido de cancelar va al servidor, que es quien firma y sube. La tarea no
// se da por cancelada hasta que el conteste: puede haber alcanzado a subirla.
function handleQRCancel(e) {
  const certId = e.detail.id
  if (window.cancelarEnServidor) window.cancelarEnServidor('cancel_qr', certId)
  appStore.updateUploadTask(certId, 'qr', { status: 'cancelling', step: 'Cancelando...' })
}

function handleQRRetry(e) {
  const certId = e.detail.id
  appStore.updateUploadTask(certId, 'qr', { status: 'generating', progress: 5, attempts: 0 })
  processQR(certId)
}

async function processQR(certId) {
  if (isCancelled(certId)) return

  const getCode     = () => (getTask(certId) || {}).code     || ''
  const getAttempts = () => (getTask(certId) || {}).attempts || 0

  try {
    appStore.updateUploadTask(certId, 'qr', { status: 'generating', progress: 15, step: 'Generando y Firmando PDF...' })
    sendWSProgress(certId, 15, 'generating', getCode(), getAttempts())

    // Firmar y subir lo hace el servidor; la barra la mueven sus avisos por WebSocket.
    const generated_qr = await certificateDataService.generateQR(certId, (getTask(certId) || {}).fecha_firma)

    if (isCancelled(certId)) return

    const responseData = generated_qr.data || generated_qr;

    // Llego a tiempo: no se publico nada y el archivo subido ya se borro.
    if (responseData.cancelado) {
      appStore.updateUploadTask(certId, 'qr', { status: 'canceled', progress: 0, step: '' })
      sendWSProgress(certId, 0, 'canceled', getCode(), 0)
      return
    }

    const finalStatus = responseData.warning === true ? 'warning' : 'success';
    const finalStep   = responseData.success || '¡Completado!';
    // El cancelar llego con el documento ya publicado: gana lo que paso de verdad.
    const tarde = (getTask(certId) || {}).status === 'cancelling';

    appStore.updateUploadTask(certId, 'qr', {
      status: finalStatus,
      progress: 100,
      uuid: responseData.uuid,
      step: tarde ? 'Ya se había subido.' : finalStep
    })
    sendWSProgress(certId, 100, finalStatus, getCode(), getAttempts())

  } catch (error) {
    if (isCancelled(certId)) return

    const responseData = error.response?.data || error.response || {};
    const errorMsg = responseData.error || error.message || 'Error de conexión / Timeout';
    const currentTask = getTask(certId)
    if (!currentTask) return

    // Un error con mensaje del servidor no se reintenta solo: el problema no es
    // la red y volver a intentarlo da lo mismo.
    if (currentTask.attempts < 2 && !responseData.error) {
      appStore.updateUploadTask(certId, 'qr', { status: 'retrying', attempts: currentTask.attempts + 1, step: 'Fallo de red, reintentando...' })
      sendWSProgress(certId, 5, 'retrying', getCode(), currentTask.attempts + 1)
      setTimeout(() => { processQR(certId) }, 3000)
      return
    }

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