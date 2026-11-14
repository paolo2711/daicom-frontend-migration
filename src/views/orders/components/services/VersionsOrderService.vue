<template>
  <div>
    <div v-if="fallo" class="text-caption text-error">No se pudieron traer las versiones.</div>
    <div v-else-if="!versiones.length" class="text-caption text-medium-emphasis">
      Todavía sin PDF: se arma al imprimir el ingreso.
    </div>
    <div v-for="version in versiones" :key="version.id" class="d-flex align-center ga-2 py-1">
      <div class="flex-grow-1">
        <div class="text-body-2 font-weight-medium">Versión {{ version.numero }}</div>
        <div class="text-caption text-medium-emphasis">{{ detalle(version) }}</div>
      </div>
      <v-btn icon="mdi-file-pdf-box" size="small" variant="text" title="Abrir"
             @click="abrirEnOtraPestana(version.pdf)" />
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import OrderDataService from '@/services/orders/orderDataService'
import { fechaHora } from '@/utils/dates'
import { abrirEnOtraPestana } from '@/utils/pdf'

// Las versiones del PDF del ingreso de una orden guardada.
const props = defineProps({
  ordenId: { type: Number, required: true },
})

// OrderDocument.Tipo.INGRESO en el back.
const INGRESO = 3

const versiones = ref([])
const fallo = ref(false)
const detalle = (version) => [fechaHora(version.created_at), version.created_by].filter(Boolean).join(' · ')

watch(() => props.ordenId, async (id) => {
  versiones.value = []
  fallo.value = false
  try {
    const { data } = await OrderDataService.listDocuments(id, INGRESO)
    versiones.value = data
  } catch {
    fallo.value = true
  }
}, { immediate: true })
</script>
