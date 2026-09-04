import { useAppStore } from '@/stores/appStore'

const EN_CURSO  = ['generating', 'uploading', 'retrying']
const FALLIDA   = ['error', 'cloud_error']
const TERMINADA = ['success', 'warning']

// El icono de la fila sale del dato del server. La tarea lo suple solo mientras
// la accion esta en curso: apenas el server habla, la fila queda libre.
// Sin ese corte la tarea le ganaba para siempre, porque vive en localStorage
// hasta que la descartan del panel.
export function useUploadState() {
  const appStore = useAppStore()

  const tareaDe = (certId, tipo) => appStore.uploadTasks.find(
    t => String(t.id) === String(certId) && t.type === tipo
  )

  const estadoSubida = (certId, tipo) => {
    const tarea = tareaDe(certId, tipo)
    if (!tarea) return null
    if (EN_CURSO.includes(tarea.status)) return 'subiendo'
    if (FALLIDA.includes(tarea.status)) return 'fallo'
    if (TERMINADA.includes(tarea.status) && !tarea.confirmada) return 'logrado'
    return null
  }

  const confirmarFila = (certId) => {
    appStore.confirmarUploadTask(certId, 'qr')
    appStore.confirmarUploadTask(certId, 'sheet')
  }

  return { tareaDe, estadoSubida, confirmarFila }
}
