<template>
  <div>
    <table-documents :tipo="FORMATO_DE_INGRESO" @editar="d => formulario?.open(d)" />
    <formato-ingreso-template ref="formulario" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import TableDocuments from './TableDocuments.vue'
import FormatoIngresoTemplate from './templates/FormatoIngresoTemplate.vue'
import { FORMATO_DE_INGRESO } from '@/utils/documents/estado'

const formulario = ref(null)

// El boton de la cabecera de Documentos.
defineExpose({ nuevo: () => formulario.value?.open() })
</script>
