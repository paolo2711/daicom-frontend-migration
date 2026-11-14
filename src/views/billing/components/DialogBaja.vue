<template>
  <v-dialog v-model="abierto" class="dialog-premium" width="90%" max-width="34rem" persistent>
    <v-card>
      <base-modal-header :title="titulo" icon="mdi-cancel" @close="abierto = false" />

      <v-card-text class="d-flex flex-column ga-3 pt-4">
        <slot />
        <v-textarea v-model="motivo" label="Motivo de la baja" rows="2" auto-grow :counter="largo" :maxlength="largo"
                    density="compact" variant="outlined" rounded="lg" />
      </v-card-text>

      <v-card-actions class="px-6 pb-4 flex-wrap ga-2">
        <v-spacer />
        <v-btn variant="flat" class="font-weight-bold px-4" @click="abierto = false">Cancelar</v-btn>
        <slot name="acciones" :motivo="motivo.trim()" />
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, watch } from 'vue'

// El dialogo de anular un comprobante: lo que explica cada uno va en el slot y sus botones reciben el motivo.
const abierto = defineModel({ type: Boolean, default: false })
defineProps({
  titulo: { type: String, required: true },
  largo: { type: Number, required: true },
})

const motivo = ref('')
watch(abierto, (si) => { if (si) motivo.value = '' })
</script>
