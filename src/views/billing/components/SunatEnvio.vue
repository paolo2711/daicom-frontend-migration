<template>
  <v-card>
    <base-modal-header :title="titulo" icon="mdi-send-outline" @close="volver" />
    <v-card-text class="pt-6 pb-4">
      <div v-if="enviando" class="d-flex flex-column align-center ga-4 py-6">
        <v-progress-circular indeterminate color="primary" />
        <span class="text-body-1">Enviando a SUNAT…</span>
      </div>
      <template v-else>
        <div class="d-flex align-center ga-2 font-weight-bold text-error">
          <v-icon icon="mdi-close-circle-outline" />
          No se emitió
        </div>
        <div class="text-body-2 mt-1">{{ envio.motivo }}</div>
      </template>
    </v-card-text>
    <v-card-actions v-if="!enviando" class="px-6 pb-4">
      <v-spacer />
      <v-btn color="primary" variant="flat" class="font-weight-bold px-4" prepend-icon="mdi-pencil"
             @click="volver">{{ textoDeVolver }}</v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup>
import { computed } from 'vue'

// Lo que muestra Ver informacion mientras se emite: {} esperando a SUNAT, { motivo } si no salio.
const props = defineProps({
  envio: { type: Object, required: true },
  titulo: { type: String, required: true },
  textoDeVolver: { type: String, required: true },
})
const emit = defineEmits(['volver'])

const enviando = computed(() => !props.envio.motivo)

function volver () {
  if (!enviando.value) emit('volver')
}
</script>
