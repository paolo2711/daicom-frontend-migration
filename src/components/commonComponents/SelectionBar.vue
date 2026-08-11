<template>
  <!-- Píldora flotante de selección múltiple: conteo + desmarcar + acciones (slot). -->
  <v-slide-y-reverse-transition>
    <v-card v-if="count > 0" class="selection-bar elevation-12">
      <div class="d-flex align-center px-3 py-2" style="gap: 6px;">
        <v-tooltip location="top" text="Desmarcar todo">
          <template v-slot:activator="{ props }">
            <v-btn v-bind="props" icon="mdi-close" variant="text" density="comfortable" size="small"
                   class="text-white" @click="emit('clear')" />
          </template>
        </v-tooltip>

        <span class="text-body-2 font-weight-bold mx-1 text-white">
          {{ count }} {{ label }}
        </span>

        <v-divider vertical class="mx-1 selection-bar__divider" style="height: 24px; align-self: center;" />

        <!-- Botones específicos de cada pantalla -->
        <slot />
      </div>
    </v-card>
  </v-slide-y-reverse-transition>
</template>

<script setup>
defineProps({
  count: { type: Number, required: true },
  label: { type: String, default: 'seleccionado(s)' },
})
const emit = defineEmits(['clear'])
</script>

<style scoped>
.selection-bar {
  position: fixed !important;
  bottom: 32px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 999;
  border-radius: 16px !important;
  max-width: 94vw;
  /* Oscura para flotar sobre las tablas (que son claras). */
  background: #23232b !important;
  border: 1px solid rgba(255, 255, 255, 0.10) !important;
  box-shadow: 0 18px 44px rgba(0, 0, 0, 0.38), 0 2px 8px rgba(0, 0, 0, 0.25) !important;
}
.v-theme--dark .selection-bar {
  background: #34343f !important;
  border-color: rgba(255, 255, 255, 0.14) !important;
  box-shadow: 0 18px 44px rgba(0, 0, 0, 0.7), 0 0 1px rgba(255, 255, 255, 0.25) !important;
}
.selection-bar__divider {
  border-color: rgba(255, 255, 255, 0.30) !important;
}
</style>
