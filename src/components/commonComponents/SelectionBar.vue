<template>
  <!-- Píldora flotante de selección múltiple: conteo + desmarcar + acciones (slot). -->
  <v-slide-y-reverse-transition>
    <v-card v-if="count > 0" class="selection-bar panel-flotante">
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

        <v-divider vertical class="mx-1 panel-flotante__division" style="height: 24px; align-self: center;" />

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
  z-index: var(--z-barra-seleccion);
  max-width: 94vw;
}
</style>
