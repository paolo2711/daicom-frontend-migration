// Progreso de subidas: Excel -> PDF y QR.
import { enCurso } from '@/utils/uploadTasks'

const emit = (name, detail) => window.dispatchEvent(new CustomEvent(name, { detail }))

export function handleUpload(data, appStore) {
  if (data.type === 'upload_progress') {
    processUploadProgress(data, appStore)
    return true
  }

  return false
}

function processUploadProgress(data, appStore) {
  const tasks = appStore.uploadTasks
  const taskType = data.task_type || 'qr'

  // 1. Limpieza masiva (el usuario presiono Cerrar Panel en otra pestana).
  if (data.status === 'dismiss_all_done') {
    const done = tasks.filter(t => !enCurso(t))
    done.forEach(t => appStore.removeUploadTask(t.id, t.type))
    return
  }

  // 2. Limpieza individual (el usuario presiono la 'X' en otra pestana).
  if (data.status === 'dismiss_task') {
    appStore.removeUploadTask(data.cert_id, taskType)
    return
  }

  const taskExists = tasks.some(t => String(t.id) === String(data.cert_id) && t.type === taskType)

  if (!taskExists && data.code) {
    appStore.addUploadTask({
      id: data.cert_id, code: data.code, status: data.status,
      progress: data.progress, attempts: data.attempts, username: data.username,
      type: taskType,
    })
  } else if (taskExists) {
    const existing = tasks.find(t => String(t.id) === String(data.cert_id) && t.type === taskType)

    // Si estaba cancelado y llega otro estado que NO es 'generating', lo ignoramos.
    if (existing && existing.status === 'canceled' && data.status !== 'generating' && data.status !== 'canceled') {
      return
    }

    // Otra pestaña cancelo una conversion: esta tambien se lo pide al servidor.
    // La firma no: su 'canceled' lo manda el servidor cuando ya la freno.
    if (data.status === 'canceled' && existing.status !== 'canceled' && taskType !== 'qr') {
      emit('wss-sheet-cancel', { id: data.cert_id, tipo: taskType })
    }

    appStore.updateUploadTask(data.cert_id, taskType, {
      progress: data.progress,
      status: data.status,
      attempts: data.attempts,
      step: data.step,
      error_msg: data.error_msg,
      // El eco del progreso que manda el front viene sin link: no borra el que ya hay.
      ...(data.url && { url: data.url }),
      is_cloud_error: data.is_cloud_error || false,
      offline_url: data.offline_url || null,
    })
    // Solo la conversion refresca su fila desde aca. La firma guarda el
    // certificado y eso ya avisa a su fila; el suelto no tiene fila.
    if (data.status === 'success' && taskType === 'sheet') {
      emit('wss-update-row', data.cert_id)
    }
  }
}
