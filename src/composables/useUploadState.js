import { useAppStore } from '@/stores/appStore'
import { TIPOS_DE_FILA, enCurso, esperandoRevision, fallida, terminada } from '@/utils/uploadTasks'

// El icono de la fila sale del dato del server. La tarea lo suple hasta que el
// server tenga algo que decir: mientras la accion corre, y tambien cuando el PDF
// ya salio y nadie lo aprobo todavia.
// El corte por `confirmada` hace falta porque la tarea vive en localStorage
// hasta que la limpian del panel: sin el, le gana a la fila para siempre.
export function useUploadState() {
  const appStore = useAppStore()

  const tareaDe = (certId, tipo) => appStore.uploadTasks.find(
    t => String(t.id) === String(certId) && t.type === tipo
  )

  const estadoSubida = (certId, tipo) => {
    const tarea = tareaDe(certId, tipo)
    if (!tarea) return null
    if (enCurso(tarea)) return 'subiendo'
    if (fallida(tarea)) return 'fallo'
    if (esperandoRevision(tarea)) return 'revisando'
    if (terminada(tarea) && !tarea.confirmada) return 'logrado'
    return null
  }

  // El server manda, pero solo si su dato es posterior a la tarea. Una carga
  // pedida antes de que la subida terminara vuelve sin el resultado, y si igual
  // silenciaba la tarea el icono quedaba en "no subido" aunque el panel dijera
  // que estaba listo. Con 95 subidas eso se cruza casi siempre.
  const confirmarFila = (certId, pedidoEn) => {
    TIPOS_DE_FILA.forEach((tipo) => {
      const tarea = tareaDe(certId, tipo)
      if (!tarea || (pedidoEn && tarea.terminadaEn && pedidoEn < tarea.terminadaEn)) return
      appStore.confirmarUploadTask(certId, tipo)
    })
  }

  return { tareaDe, estadoSubida, confirmarFila }
}
