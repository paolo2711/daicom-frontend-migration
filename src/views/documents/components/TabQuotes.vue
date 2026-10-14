<template>
  <div>
    <table-documents :tipo="COTIZACION" con-total :variantes="OPCIONES_DE_TIPO" @editar="d => formulario?.open(d)" />
    <quote-template ref="formulario" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import TableDocuments from './TableDocuments.vue'
import QuoteTemplate from './templates/QuoteTemplate.vue'
import { COTIZACION } from '@/utils/documents/estado'
import { OPCIONES_DE_TIPO } from '@/utils/documents/quoteDefaults'

const formulario = ref(null)

// El boton de la cabecera de Documentos, con el tipo elegido en su menu.
defineExpose({ nuevo: (tipo) => formulario.value?.open(null, tipo) })
</script>
