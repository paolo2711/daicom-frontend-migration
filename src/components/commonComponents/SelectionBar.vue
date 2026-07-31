<template>
  <!-- Píldora flotante de selección múltiple: conteo + desmarcar + acciones (slot). -->
  <v-slide-y-reverse-transition>
    <v-card v-if="count > 0" class="selection-bar elevation-6" style="z-index: 999;">
      <div class="d-flex align-center px-4 py-2">
        <v-tooltip location="top" text="Desmarcar todo">
          <template v-slot:activator="{ props }">
            <v-btn
              v-bind="props" icon="mdi-close" variant="text" density="compact"
              class="text-white opacity-80 hover-opacity-100"
              @click="emit('clear')"
            />
          </template>
        </v-tooltip>

        <span class="text-body-2 font-weight-bold text-white ml-3 mr-4">
          {{ count }} {{ label }}
        </span>

        <v-divider vertical class="border-opacity-100 mx-2 text-white"
                   style="height: 20px; align-self: center;" />

        <!-- Botones específicos de cada pantalla -->
        <slot />
      </div>
    </v-card>
  </v-slide-y-reverse-transition>
</template>

<script setup>
defineProps({
  // Cantidad de elementos seleccionados. La barra aparece cuando es > 0.
  count: { type: Number, required: true },
  // Palabra que sigue al número. Resuelve el género:
  // "seleccionada(s)" en órdenes, "seleccionado(s)" en certificados.
  label: { type: String, default: 'seleccionado(s)' },
})
const emit = defineEmits(['clear'])
</script>

<!-- Global (no scoped): los botones del slot heredan el scope del padre, así que
     .opacity-80/.hover-opacity-100 deben ser globales, acotadas bajo .selection-bar. -->
<style>
.selection-bar {
  position: fixed !important;
  bottom: 32px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
  border-radius: 50px !important;
  background-color: #212121 !important; /* Claro: gris oscuro sobre fondo blanco */
  border: 1px solid rgba(0, 0, 0, 0.12) !important;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25) !important;
}

.v-theme--dark .selection-bar {
  background-color: #444444 !important; /* Oscuro: se aclara para reflejar elevación */
  border: 1px solid rgba(255, 255, 255, 0.22) !important;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.65), 0 0 1px rgba(255, 255, 255, 0.2) !important;
}

.selection-bar .opacity-80 {
  opacity: 0.8;
  transition: opacity 0.2s ease-in-out, transform 0.2s ease;
}
.selection-bar .hover-opacity-100:hover {
  opacity: 1 !important;
  transform: scale(1.1);
}
</style>
