<template>
  <div>
    <table-documents :tipo="COTIZACION" con-total :variantes="OPCIONES_DE_TIPO" @editar="d => formulario?.open(d)"
                     @crear-orden="crearOrden" />
    <quote-template ref="formulario" />
    <quote-upload-dialog ref="subida" />
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
import { COTIZACION } from '@/utils/documents/estado'
import { OPCIONES_DE_TIPO, SUBIR_PDF } from '@/utils/documents/quoteDefaults'
import DocumentsDataService from '@/services/documents/documentsDataService'
import { SERVICIO } from '@/utils/orders/estado'
import { mensajeDeError } from '@/utils/errors'

const formulario = ref(null)
const subida = ref(null)
const orden = ref(null)
const swal = useSwal()

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
