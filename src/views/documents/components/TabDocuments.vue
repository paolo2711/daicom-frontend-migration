<template>
  <div>
    <table-documents :tipo="tipo" con-total :variantes="OPCIONES_DE_TIPO" @editar="editar"
                     @crear-orden="crearOrden" />
    <quote-template ref="formulario" :tipo-de-documento="tipo" />
    <quote-upload-dialog ref="subida" :tipo-de-documento="tipo" />
    <add-order ref="orden" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import TableDocuments from './TableDocuments.vue'
import QuoteTemplate from './templates/QuoteTemplate.vue'
import QuoteUploadDialog from './templates/QuoteUploadDialog.vue'
import AddOrder from '@/views/orders/components/AddOrder.vue'
import { useSwal } from '@/composables/useSwal'
import { OPCIONES_DE_TIPO, SUBIR_PDF } from '@/utils/documents/quoteDefaults'
import DocumentsDataService from '@/services/documents/documentsDataService'
import { SERVICIO } from '@/utils/orders/estado'
import { mensajeDeError } from '@/utils/errors'

// Una pestaña de Documentos: la cotizacion o la valorizacion, con el mismo editor y la misma subida.
defineProps({ tipo: { type: String, required: true } })

const formulario = ref(null)
const subida = ref(null)
const orden = ref(null)
const swal = useSwal()

// La fila no trae el JSON: se pide el documento entero al editarlo.
async function editar(documento) {
  try {
    const { data } = await DocumentsDataService.get(documento.id)
    formulario.value?.open(data)
  } catch (err) {
    swal.fire({ icon: 'error', title: `No se abrió ${documento.document_number}`,
                text: mensajeDeError(err, 'No se pudo leer el documento.') })
  }
}

async function crearOrden(documento) {
  try {
    const { data } = await DocumentsDataService.orden(documento.id)
    if (!data.filas.length) {
      swal.fire({ icon: 'info', title: 'Nada que pase a una orden',
                  text: `Ningún ítem de ${documento.document_number} es una calibración u operatividad de un equipo del catálogo: la orden se arma desde Órdenes.` })
      return
    }
    orden.value?.open(SERVICIO, data)
  } catch (err) {
    swal.fire({ icon: 'error', title: 'No se abrió la orden', text: mensajeDeError(err, 'No se pudo leer la cotización.') })
  }
}

// El boton de la cabecera de Documentos, con lo elegido en su menu: un tipo, o subir un PDF.
defineExpose({ nuevo: (opcion) => (opcion === SUBIR_PDF ? subida.value?.open() : formulario.value?.open(null, opcion)) })
</script>
