<template>
  <v-menu v-if="compacto" location="bottom end">
    <template #activator="{ props: menu }">
      <v-btn v-if="versiones.length" v-bind="menu" variant="text" size="small" prepend-icon="mdi-history"
             class="font-weight-bold">
        Versiones del ingreso ({{ versiones.length }})
      </v-btn>
    </template>
    <v-list density="compact">
      <v-list-item v-for="version in versiones" :key="version.id" prepend-icon="mdi-file-pdf-box"
                   :title="`Versión ${version.numero}`" :subtitle="detalle(version)"
                   @click="abrirEnOtraPestana(version.pdf)" />
    </v-list>
  </v-menu>

  <div v-else>
    <div class="text-body-2 font-weight-medium mt-3 mb-2">Ingreso</div>
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

// Las versiones del PDF del ingreso de una orden guardada. `compacto`: un boton que las despliega, para la franja.
const props = defineProps({
  ordenId: { type: Number, required: true },
  compacto: { type: Boolean, default: false },
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
