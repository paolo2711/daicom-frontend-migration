<template>
  <!-- Píldora flotante de selección múltiple: conteo + desmarcar + acciones (slot). -->
  <v-slide-y-reverse-transition>
    <v-card v-if="count > 0" class="selection-bar elevation-12">
      <div class="d-flex align-center px-3 py-2" style="gap: 6px;">
        <v-tooltip location="top" text="Desmarcar todo">
          <template v-slot:activator="{ props }">
            <v-btn v-bind="props" icon="mdi-close" variant="text" density="comfortable" size="small"
                   @click="emit('clear')" />
          </template>
        </v-tooltip>

        <span class="text-body-2 font-weight-bold mx-1">
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
import { watch, onUnmounted } from 'vue'
import { useAppStore } from '@/stores/appStore'

const props = defineProps({
  count: { type: Number, required: true },
  label: { type: String, default: 'seleccionado(s)' },
})
const emit = defineEmits(['clear'])

// Avisa al ecosistema que hay una barra de seleccion activa (para que el Upload
// Manager se aparte en ventanas angostas). Se apaga al vaciar o desmontar.
const appStore = useAppStore()
watch(() => props.count, (v) => { appStore.selectionActive = v > 0 }, { immediate: true })
onUnmounted(() => { appStore.selectionActive = false })
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
  /* Tema-aware: claro = azul-gris suave; oscuro = mica (familia del fondo app). */
  background: #dce4f0 !important;
  border: 1px solid rgba(0, 0, 0, 0.10) !important;
  box-shadow: 0 14px 40px rgba(0, 0, 0, 0.22) !important;
}
.v-theme--dark .selection-bar {
  background: #2c3849 !important;
  border-color: rgba(255, 255, 255, 0.12) !important;
  box-shadow: 0 14px 40px rgba(0, 0, 0, 0.60) !important;
}
.selection-bar__divider {
  border-color: rgba(0, 0, 0, 0.15) !important;
}
.v-theme--dark .selection-bar__divider {
  border-color: rgba(255, 255, 255, 0.18) !important;
}
</style>
