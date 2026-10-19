<template>
  <div>
    <table-documents :tipo="COTIZACION" con-total :variantes="OPCIONES_DE_TIPO" @editar="d => formulario?.open(d)" />
    <quote-template ref="formulario" />
    <quote-upload-dialog ref="subida" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import TableDocuments from './TableDocuments.vue'
import QuoteTemplate from './templates/QuoteTemplate.vue'
import QuoteUploadDialog from './templates/QuoteUploadDialog.vue'
import { COTIZACION } from '@/utils/documents/estado'
import { OPCIONES_DE_TIPO, SUBIR_PDF } from '@/utils/documents/quoteDefaults'

const formulario = ref(null)
const subida = ref(null)

// El boton de la cabecera de Documentos, con lo elegido en su menu: un tipo, o subir un PDF.
defineExpose({ nuevo: (opcion) => (opcion === SUBIR_PDF ? subida.value?.open() : formulario.value?.open(null, opcion)) })
</script>
