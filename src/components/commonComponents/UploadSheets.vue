<template>
  <span style="display: none;" data-component="UploadSheets-Controller"></span>
</template>

<script setup>
import { onMounted, onBeforeUnmount } from 'vue'
import { useAppStore } from '@/stores/appStore'
import CertificateDataService from '@/services/certificates/certificateDataService'
import { mensajeDeError } from '@/utils/errors'

const appStore = useAppStore()

const ENVIANDO = 'Enviando Excel al servidor...'

const conArchivo = (subido, campos) => {
  const data = new FormData()
  data.append('file', subido.file)
  data.append('password', subido.password || '')
  for (const [clave, valor] of Object.entries(campos)) data.append(clave, valor)
  return data
}

// Cada conversion arma su cuerpo y sabe a que endpoint va. Agregar una es una
// entrada mas aqui.
const CONVERSIONES = {
  sheet: {
    cuerpo: (tarea, subido) => subido.file
      ? conArchivo(subido, { related_certificate: tarea.id })
      : { related_certificate: tarea.id, native_filename: tarea.native_filename },
    enviar: (cuerpo) => CertificateDataService.buildPDF(cuerpo),
  },
  suelto: {
    cuerpo: (tarea, subido) => conArchivo(subido, { tarea: tarea.id }),
    enviar: (cuerpo) => CertificateDataService.buildPDFSuelto(cuerpo),
  },
}

const getTask = (id, tipo) => appStore.uploadTasks.find(
  t => String(t.id) === String(id) && t.type === tipo
)

// Lo que hace falta para repetir la conversion vive en la tarea: el nativo lo
// vuelve a leer el servidor, el del navegador viajo una sola vez. La clave del
// Excel no va ahi, que el store se guarda en localStorage.
function registrar({ id, code, tipo, native_filename }) {
  const propios = { code, native_filename, source: native_filename ? 'nativo' : 'manual' }
  if (getTask(id, tipo)) {
    appStore.updateUploadTask(id, tipo, propios)
    return
  }
  const usuario = JSON.parse(localStorage.getItem('user')) || {}
  appStore.addUploadTask({
    ...propios, id, type: tipo,
    status: 'generating', progress: 0, attempts: 0,
    username: usuario.username || 'unknown',
    step: ENVIANDO, error_msg: '',
  })
}

async function processSheet(id, tipo, subido = {}) {
  const tarea = getTask(id, tipo)
  if (!tarea) return

  appStore.updateUploadTask(id, tipo, {
    status: 'generating', progress: 0, step: ENVIANDO, error_msg: '',
  })

  const conversion = CONVERSIONES[tipo]
  try {
    await conversion.enviar(conversion.cuerpo(tarea, subido))
  } catch (error) {
    appStore.updateUploadTask(id, tipo, {
      status: 'error', progress: 0, step: '',
      error_msg: mensajeDeError(error, 'No se pudo subir el archivo.'),
    })
  }
}

function handleSheetStart(e) {
  const { id, code, tipo = 'sheet', file, password, native_filename } = e.detail
  registrar({ id, code, tipo, native_filename })
  processSheet(id, tipo, { file, password })
}

function handleSheetCancel(e) {
  const { id, tipo = 'sheet' } = e.detail
  if (window.cancelarEnServidor) window.cancelarEnServidor('cancel_sheet', id)
  const tarea = getTask(id, tipo)
  if (tarea && window.enviarProgresoWebSocket) {
    window.enviarProgresoWebSocket(id, 0, 'canceled', tarea.code, 0, tipo)
  }
}

function handleSheetRetry(e) {
  const { id, tipo = 'sheet' } = e.detail
  processSheet(id, tipo)
}

onMounted(() => {
  window.addEventListener('wss-sheet-start',  handleSheetStart)
  window.addEventListener('wss-sheet-cancel', handleSheetCancel)
  window.addEventListener('wss-sheet-retry',  handleSheetRetry)
})

onBeforeUnmount(() => {
  window.removeEventListener('wss-sheet-start',  handleSheetStart)
  window.removeEventListener('wss-sheet-cancel', handleSheetCancel)
  window.removeEventListener('wss-sheet-retry',  handleSheetRetry)
})
</script>
