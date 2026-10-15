<template>
  <!-- Un PDF a pantalla completa para revisarlo antes de decidir. Cada pantalla
       pone en la barra lo suyo: a la izquierda (encabezado) y sus botones
       (acciones). -->
  <v-dialog v-model="abierto" fullscreen persistent transition="dialog-bottom-transition">
    <v-card class="d-flex flex-column visor-completo">
      <v-toolbar flat height="64" class="flex-grow-0 flex-shrink-0">
        <slot name="encabezado" />
        <v-spacer />
        <slot name="acciones" />
      </v-toolbar>

      <!-- Lo que fallo al decidir: el PDF sigue en pantalla para reintentar.
           El flex va explicito: sin base auto, la franja colapsa a su padding. -->
      <v-alert v-if="error" type="error" density="compact" variant="flat" tile class="text-body-2 flex-grow-0 flex-shrink-0">
        {{ error }}
      </v-alert>

      <pdf-preview class="flex-grow-1" :url="url" />
    </v-card>
  </v-dialog>
</template>

<script setup>
import PdfPreview from '@/components/shared/PdfPreview.vue'

const abierto = defineModel({ type: Boolean, default: false })

defineProps({
  url: { type: String, default: '' },
  error: { type: String, default: '' },
})
</script>

<style scoped>
.visor-completo {
  height: 100vh;
  overflow: hidden;
  background-color: #525659;
}
</style>
