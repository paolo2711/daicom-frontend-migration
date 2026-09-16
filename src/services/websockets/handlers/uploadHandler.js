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

    // Si P1 mando a cancelar, disparamos el abort() local en P2 para matar la red tambien.
    if (data.status === 'canceled' && existing.status !== 'canceled') {
      if (taskType === 'qr') emit('wss-qr-cancel', { id: data.cert_id })
      else emit('wss-sheet-cancel', { id: data.cert_id, tipo: taskType })
    }

    appStore.updateUploadTask(data.cert_id, taskType, {
      progress: data.progress,
      status: data.status,
      attempts: data.attempts,
      step: data.step,
      error_msg: data.error_msg,
      url: data.url || undefined,
      is_cloud_error: data.is_cloud_error || false,
      offline_url: data.offline_url || null,
    })
    // Warning: proceso QR que si se cargo en nube pero no en local.
    // El suelto no tiene fila que refrescar: no sale de ningun certificado.
    if ((data.status === 'success' || data.status === 'warning') && taskType !== 'suelto') {
      emit('wss-update-row', data.cert_id)
    }
  }
}
