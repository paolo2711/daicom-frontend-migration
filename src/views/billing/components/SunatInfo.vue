<template>
  <div class="d-flex flex-column ga-4">
    <div class="d-flex ga-4">
      <div class="flex-grow-1">
        <div :class="`text-${estado.color}`" class="d-flex align-center ga-2 font-weight-bold">
          <v-icon :icon="estado.icono" />
          {{ estado.texto }}
        </div>
        <slot />
        <div v-if="comprobante.respuesta?.descripcion" class="text-body-2 mt-1">{{ comprobante.respuesta.descripcion }}</div>
        <div v-for="nota in comprobante.respuesta?.notas || []" :key="nota" class="text-body-2 text-medium-emphasis">
          {{ nota }}
        </div>
      </div>
      <!-- Con margen blanco: sin el, en modo oscuro los bordes del QR se pierden y no se lee. -->
      <div v-if="comprobante.qr" class="flex-shrink-0 align-self-start bg-white pa-2 rounded">
        <v-img :src="comprobante.qr" alt="QR de SUNAT" width="6rem" :title="`Consulta de ${numero} en SUNAT`" />
      </div>
    </div>

    <v-table density="compact" class="bg-transparent">
      <tbody>
        <tr v-for="[etiqueta, valor] in filas" :key="etiqueta">
          <td class="text-medium-emphasis text-no-wrap">{{ etiqueta }}</td>
          <td>{{ valor }}</td>
        </tr>
      </tbody>
    </v-table>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { ESTADOS } from '@/utils/billing/sunat'

// Lo que muestra Ver informacion de cualquier comprobante: su estado ante SUNAT, lo que respondio, el QR y sus datos.
const props = defineProps({
  comprobante: { type: Object, required: true },
  estadoSunat: { type: String, required: true },
  numero: { type: String, required: true },
  filas: { type: Array, required: true },
})

const estado = computed(() => ESTADOS[props.estadoSunat])
</script>
