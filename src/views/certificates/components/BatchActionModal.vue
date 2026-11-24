<template>
  <batch-action-dialog
    ref="dialogo"
    :acciones="ACCIONES"
    :columnas="['Certificado', 'Equipo y marca']"
    :al-confirmar="guardar"
    :contexto="{ sinPlantilla }"
    :cargando="buscando ? 'Buscando los Excel en el servidor...' : ''"
    @hecha="filas => emit('hecha', filas)"
  >
    <template #acciones>
      <v-btn icon variant="text" color="grey" title="Más información" @click="verAyuda = true">
        <v-icon>mdi-help-circle-outline</v-icon>
      </v-btn>
    </template>

    <template v-if="action === 'excel'" #opciones>
      <v-checkbox
        v-model="sinPlantilla"
        label="PDF sin plantilla, para imprimir en hojas con membrete (solo se descarga, no se guarda)"
        density="compact"
        hide-details
        color="primary"
      />
    </template>

    <template #celdas="{ fila }">
      <td class="font-weight-medium text-no-wrap" :title="fila.registry_code">{{ fila.numero }}</td>
      <td class="text-caption">{{ fila.equipment }}</td>
    </template>

    <template #fila="{ fila }">
      <template v-if="action === 'excel'">
        <v-btn v-if="estaAdjuntado(fila)" icon variant="text" size="small" color="grey" class="ml-auto"
               title="Quitar el archivo adjuntado" @click.stop="discardExcel(fila)">
          <v-icon>mdi-close</v-icon>
        </v-btn>
        <v-menu v-else location="bottom end">
          <template v-slot:activator="{ props }">
            <v-btn v-bind="props" icon variant="text" size="small" color="primary" class="ml-auto"
                   title="Adjuntar archivo" @click.stop>
              <v-icon>mdi-upload</v-icon>
            </v-btn>
          </template>
          <v-list density="compact" class="py-1">
            <v-list-item prepend-icon="mdi-file-excel" @click="openManualUpload(fila)">
              <v-list-item-title class="font-weight-medium">Adjuntar Excel</v-list-item-title>
              <v-list-item-subtitle class="text-caption">Se convierte a PDF</v-list-item-subtitle>
            </v-list-item>
            <v-list-item prepend-icon="mdi-file-pdf-box" @click="openPdfBaseUpload(fila)">
              <v-list-item-title class="font-weight-medium">Adjuntar PDF ya hecho</v-list-item-title>
              <v-list-item-subtitle class="text-caption">Queda listo para firmar</v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </v-menu>
      </template>

      <template v-else-if="action === 'qr'">
        <v-btn v-if="fila.validation_status === 'manual_pdf'" icon variant="text" size="small" color="grey"
               class="ml-auto" title="Quitar el PDF adjuntado" @click.stop="discardManualPdf(fila)">
          <v-icon>mdi-close</v-icon>
        </v-btn>
        <v-btn v-else icon variant="text" size="small" color="primary" class="ml-auto"
               title="Adjuntar PDF firmado" @click.stop="openManualPdfUpload(fila)">
          <v-icon>mdi-upload</v-icon>
        </v-btn>
      </template>
    </template>

    <load-sheet ref="loadSheetModalRef" @file-attached="onFileAttached" />
    <ayuda-lote v-model="verAyuda" :accion="action" />
  </batch-action-dialog>
</template>

<script setup>
import { Toast } from '@/plugins/alerts'
import { defineAsyncComponent, getCurrentInstance, ref } from 'vue'
import { useAppStore } from '@/stores/appStore'
import BatchActionDialog from '@/components/shared/BatchActionDialog.vue'
import CertificateDataService from '@/services/certificates/certificateDataService.js'
import { tieneExcelBase } from '@/utils/certificates/excelBase'
import { mensajeDeError } from '@/utils/errors'
import { SE_RENUMERA } from '@/utils/certificates/tipos'
import { opcionPorClave } from '@/composables/useOrderServices'
import { ACCIONES, esAviso, estaAdjuntado } from './batchActions'
import { uuid } from '@/utils/uuid'

const LoadSheet = defineAsyncComponent(() => import('@/views/certificates/components/LoadSheet.vue'))
const AyudaLote = defineAsyncComponent(() => import('@/views/certificates/components/AyudaLote.vue'))

const emit = defineEmits(['hecha', 'corregido'])
const { appContext } = getCurrentInstance()
const $swal = appContext.config.globalProperties.$swal
const appStore = useAppStore()

const dialogo = ref(null)
const action = ref('')
const buscando = ref(false)
const loadSheetModalRef = ref(null)
const force_select = ref(false)
const sinPlantilla = ref(false)
const verAyuda = ref(false)

function open(actionType, selectedCerts, forceSelect = false) {
  action.value = actionType
  force_select.value = forceSelect
  sinPlantilla.value = false

  dialogo.value.open(actionType, selectedCerts.map(cert => ({
    ...cert,
    equipment: `${cert.equipment} ${cert.brand}`.trim(),
    validation_status: 'pending',
  })), forceSelect)

  // La acción que escanea el servidor marca las filas al saber qué encontró.
  if (ACCIONES[actionType].escaneaElServidor) {
    dialogo.value.marcadas = []
    validarExcelsEnServidor()
  }
}

const marcar = (item) => {
  if (!dialogo.value.marcadas.includes(item.id)) dialogo.value.marcadas.push(item.id)
}
const desmarcar = (item) => {
  dialogo.value.marcadas = dialogo.value.marcadas.filter(id => id !== item.id)
}

const abrirAdjuntar = (item, modo) => loadSheetModalRef.value?.open(item, modo)

const openManualUpload    = (item) => abrirAdjuntar(item, 'excel')
const openPdfBaseUpload   = (item) => abrirAdjuntar(item, 'pdf-base')
const openManualPdfUpload = (item) => abrirAdjuntar(item, 'pdf')

const discardManualPdf = (item) => {
  item.validation_status = 'pending'
  item.file = null
  item.disabled = !tieneExcelBase(item)
  if (item.disabled) desmarcar(item)
}

// El modo lo decide el modal de adjuntar, no la accion: en Excel se puede
// adjuntar el Excel a convertir o el PDF ya hecho.
const ESTADO_POR_MODO = { excel: 'manual', 'pdf-base': 'manual_pdf_base', pdf: 'manual_pdf' }

const onFileAttached = (payload) => {
  const item = dialogo.value.filas.find(i => i.id === payload.id)
  if (item) {
    item.validation_status = ESTADO_POR_MODO[payload.modo] || 'manual'
    item.file = payload.file
    item.password = payload.modo === 'excel' ? payload.password : ''
    item.disabled = false
    marcar(item)
  }
}

const discardExcel = (item) => {
  // Si el servidor ya tenía un excel nativo para este item, lo recuperamos automáticamente.
  // Si no, queda sin excel disponible (igual que un manual_pdf descartado en QR).
  item.validation_status = item.native_filename ? 'found' : 'not_found'
  item.file = null
  item.password = ''
  item.disabled = !item.native_filename

  if (item.disabled) desmarcar(item)
  else marcar(item)
}

const validarExcelsEnServidor = async () => {
  buscando.value = true
  try {
    const ids = dialogo.value.filas.map(i => i.id)
    const response = await CertificateDataService.scanNativeExcels(ids)
    
    const resultados = response.data
    dialogo.value.filas.forEach(item => {
      const info = resultados.find(r => r.id === item.id)
      
      if (info && info.status === 'found') {
        item.validation_status = 'found'
        item.native_filename = info.filename
        
        if (tieneExcelBase(item) && !force_select.value) {
          item.already_has_it = true // Ya tiene Excel (Permitido pero desmarcado)
        } else {
          marcar(item) // Nuevo o forzado (Marcado)
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
    buscando.value = false
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
      fallados.push(`${cert.numero}: ${mensajeDeError(error, 'no se pudo subir')}`)
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

const confirmarCorreccion = async (aptos, opcion) => {
  const conPerdida = aptos.filter(item => esAviso(ACCIONES.tipo.validacion(item, { opcion }))).length
  const avisos = [`Cada uno ${SE_RENUMERA}.`]
  if (conPerdida) {
    avisos.push(`<b>${conPerdida}</b> ya tienen trabajo hecho que se pierde: revisa el ícono de su fila.`)
  }
  const { isConfirmed } = await $swal.fire({
    icon: 'warning',
    title: `¿Pasar ${aptos.length} a ${opcionPorClave(opcion).title}?`,
    html: avisos.join('<br><br>'),
    showCancelButton: true,
    confirmButtonText: 'Sí, corregir',
    cancelButtonText: 'Cancelar',
  })
  return isConfirmed
}

// Lo que hace cada accion con las filas marcadas. El modal avisa del error y se cierra.
const guardar = async (aptos, { fecha, opcion }) => {
  if (action.value === 'notify') {
    const ids = aptos.map(i => i.id)
    await CertificateDataService.requestBatchSignatures(ids)
    Toast.fire({ ...appStore.toastGuardadoExito, title: '¡Solicitud Registrada!' })
  }

  else if (action.value === 'qr') {
    // El PDF ya firmado se sube de a uno desde el navegador; el resto va en un
    // solo pedido y lo firma el servidor.
    const manuales = aptos.filter(cert => cert.validation_status === 'manual_pdf' && cert.file)
    const aFirmar = aptos.filter(cert => !manuales.includes(cert))
    manuales.forEach(cert => {
      window.dispatchEvent(new CustomEvent('wss-manual-pdf-upload', { detail: { certificate: cert, file: cert.file } }))
    })
    if (aFirmar.length) {
      window.dispatchEvent(new CustomEvent('wss-qr-start', {
        detail: { certificates: aFirmar, fechaFirma: fecha }
      }))
    }
    Toast.fire({ timer: 4000,
      icon: 'info', title: `Procesando ${aptos.length} firmas/subidas en segundo plano...`
    })
  }

  else if (action.value === 'excel') {
    // El PDF ya hecho no se convierte: se guarda directo y no pasa por la cola.
    const yaHechos  = aptos.filter(c => c.validation_status === 'manual_pdf_base')
    const aConvertir = aptos.filter(c => c.validation_status !== 'manual_pdf_base')

    // Sin plantilla, cada uno es una descarga con su propia tarea: no toca el certificado.
    const tareaDe = (cert) => (sinPlantilla.value
      ? { id: uuid(), tipo: 'suelto', conversion: 'sin_plantilla', certificado: cert.id,
          code: `${cert.numero} sin plantilla` }
      : { id: cert.id, code: cert.numero })
    aConvertir.forEach(cert => {
      window.dispatchEvent(new CustomEvent('wss-sheet-start', {
        detail: { ...tareaDe(cert), native_filename: cert.native_filename, file: cert.file, password: cert.password }
      }))
    })

    if (aConvertir.length) {
      Toast.fire({ timer: 3000,
        icon: 'success', title: `Enviando ${aConvertir.length} archivos a procesar...`
      })
    }

    if (yaHechos.length && !sinPlantilla.value) await guardarPdfsBase(yaHechos)
  }

  else if (action.value === 'entrega') {
    const { data } = await CertificateDataService.registrarEntrega(aptos.map(i => i.id), fecha)
    const marcados = data?.certificados ?? aptos.length
    Toast.fire({
      ...appStore.toastGuardadoExito,
      title: marcados === 1 ? 'Entrega registrada' : `Entrega registrada en ${marcados} certificados`
    })
    if (data?.omitidos) {
      $swal.fire({
        icon: 'info', title: 'Algunos quedaron sin marcar',
        text: `${data.omitidos} todavía no están firmados.`, confirmButtonText: 'Entendido'
      })
    }
  }

  else if (action.value === 'tipo') {
    if (!await confirmarCorreccion(aptos, opcion)) return false
    const { data } = await CertificateDataService.corregirTipo(aptos.map(i => i.id), opcionPorClave(opcion))
    const codigos = data.codigos
    Toast.fire({
      ...appStore.toastGuardadoExito,
      title: codigos.length === 1
        ? `Corregido: ahora es ${codigos[0]}`
        : `${codigos.length} corregidos: del ${codigos[0]} al ${codigos[codigos.length - 1]}`
    })
    emit('corregido')
  }
}

defineExpose({ open })
</script>
