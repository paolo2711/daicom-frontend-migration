<template>
  <span style="display: none;" data-component="UploadQR-Controller"></span>
</template>

<script setup>
import { onMounted, onBeforeUnmount } from 'vue'
import { useAppStore } from '@/stores/appStore'
import certificateDataService from '@/services/certificates/certificateDataService'
import { mensajeDeError } from '@/utils/errors'


const appStore = useAppStore()

// Como queda una tarea recien pedida, tambien al reintentarla.
const EN_COLA = { status: 'generating', progress: 5, attempts: 0, step: '', error_msg: '', is_cloud_error: false, offline_url: null }

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

function usuarioActual() {
  return (JSON.parse(localStorage.getItem('user')) || {}).username || 'unknown'
}

// La firma corre en el servidor: aca solo se encola. El avance y el resultado
// de cada una llegan por el panel de subidas (uploadHandler).
async function encolar(certIds, fechaFirma) {
  try {
    await certificateDataService.firmar(certIds, fechaFirma)
  } catch (error) {
    const error_msg = mensajeDeError(error, 'No se pudo iniciar la firma.')
    certIds.forEach(id => appStore.updateUploadTask(id, 'qr', { status: 'error', step: '', error_msg }))
  }
}

function handleQRStart(e) {
  const { certificates, fechaFirma = '' } = e.detail
  const username = usuarioActual()

  certificates.forEach(certificate => {
    // Viaja en la tarea para que el reintento use la misma fecha que el original.
    const tarea = { ...EN_COLA, username, fecha_firma: fechaFirma }
    if (getTask(certificate.id)) appStore.updateUploadTask(certificate.id, 'qr', tarea)
    else appStore.addUploadTask({ id: certificate.id, code: certificate.registry_code, type: 'qr', ...tarea })
  })

  encolar(certificates.map(c => c.id), fechaFirma)
}

// El pedido de cancelar va al servidor, que es quien firma y sube. La tarea no
// se da por cancelada hasta que el conteste: puede haber alcanzado a subirla.
function handleQRCancel(e) {
  const certId = e.detail.id
  if (window.cancelarEnServidor) window.cancelarEnServidor('cancel_qr', certId)
  appStore.updateUploadTask(certId, 'qr', { status: 'cancelling', step: 'Cancelando...' })
}

function handleQRRetry(e) {
  const tarea = getTask(e.detail.id)
  if (!tarea) return
  appStore.updateUploadTask(tarea.id, 'qr', EN_COLA)
  encolar([tarea.id], tarea.fecha_firma)
}

function handleManualPdfStart(e) {
  const { certificate, file } = e.detail
  const username = usuarioActual()

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
      status: finalStatus, progress: 100, url: responseData.link_nube, step: finalStep
    })
    sendWSProgress(certId, 100, finalStatus, getCode(), 0)

  } catch (error) {
    if (isCancelled(certId)) return
    const errorMsg = mensajeDeError(error, 'No se pudo subir el PDF a la nube.');
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
