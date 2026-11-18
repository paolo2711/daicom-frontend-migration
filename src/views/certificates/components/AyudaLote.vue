<template>
  <v-dialog v-model="visible" max-width="760" class="dialog-premium">
    <v-card>
      <base-modal-header :title="`${config.titulo}: qué tener en cuenta`" icon="mdi-help-circle-outline"
                         iconColor="grey" @close="visible = false" />
      <v-card-text class="pt-4">
        <ayuda-excel v-if="config.ayudaGrafica" />
        <v-list v-else density="compact" class="py-0 bg-transparent">
          <v-list-item v-for="punto in config.ayuda" :key="punto" class="px-0">
            <template #prepend><v-icon size="small" color="grey" class="mr-3">mdi-circle-small</v-icon></template>
            <span class="text-body-2">{{ punto }}</span>
          </v-list-item>
        </v-list>
      </v-card-text>
      <v-card-actions class="px-6 pb-4">
        <v-spacer />
        <v-btn color="primary" variant="flat" class="font-weight-bold px-4" @click="visible = false">Entendido</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed } from 'vue'
import BaseModalHeader from '@/components/commonComponents/BaseModalHeader.vue'
import AyudaExcel from './AyudaExcel.vue'
import { ACCIONES } from './batchActions'

const visible = defineModel({ type: Boolean, default: false })
const props = defineProps({ accion: { type: String, required: true } })

const config = computed(() => ACCIONES[props.accion] || ACCIONES.excel)
</script>
