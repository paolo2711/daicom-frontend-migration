<template>
  <!-- Píldora flotante de selección múltiple: conteo + desmarcar + acciones. -->
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

        <template v-if="acciones">
          <v-tooltip v-for="accion in enIconos" :key="accion.clave" location="top" :text="accion.texto">
            <template v-slot:activator="{ props }">
              <!-- El span recibe el tooltip: un boton deshabilitado no lo dispara. -->
              <span v-bind="props">
                <v-btn :icon="accion.icono" variant="text" density="comfortable" size="small"
                       :disabled="accion.disabled" @click="emit('accion', accion.clave)" />
              </span>
            </template>
          </v-tooltip>

          <v-menu v-if="enMenu.length" location="top end">
            <template v-slot:activator="{ props }">
              <v-btn v-bind="props" icon="mdi-dots-vertical" variant="text" density="comfortable" size="small" />
            </template>
            <action-list :acciones="enMenu" @accion="clave => emit('accion', clave)" />
          </v-menu>
        </template>

        <slot v-else />
      </div>
    </v-card>
  </v-slide-y-reverse-transition>
</template>

<script setup>
import { computed, watch, onUnmounted } from 'vue'
import { useDisplay } from 'vuetify'
import { useAppStore } from '@/stores/appStore'
import ActionList from '@/components/shared/ActionList.vue'

const props = defineProps({
  count: { type: Number, required: true },
  label: { type: String, default: 'seleccionado(s)' },
  // Sin acciones, la pantalla pone sus botones en el slot.
  acciones: { type: Array, default: null },
})
const emit = defineEmits(['clear', 'accion'])

// Como iconos van las que sirven para varios, menos las del grupo peligro (un
// toque de mas no tiene que anular nada); el resto, y en pantallas chicas
// todas, al menu. Por ancho de pantalla y no midiendo la barra: no se mueve
// mientras se marca.
const display = useDisplay()
const maxIconos = computed(() => {
  if (display.lgAndUp.value) return Infinity
  return display.mdAndUp.value ? 3 : 0
})
const enIconos = computed(() => (props.acciones || [])
  .filter(a => a.varios && a.grupo !== 'peligro')
  .slice(0, maxIconos.value))
const enMenu = computed(() => (props.acciones || []).filter(a => !enIconos.value.includes(a)))

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
