<template>
  <div class="d-flex align-center flex-shrink-0 border-b-thin px-3 pt-2">
    <v-tabs :model-value="modelValue" density="compact" slider-color="primary" class="flex-grow-1 pestanas-parejas"
            @update:model-value="cambiar">
      <v-tab v-for="pestana in pestanas" :key="pestana.valor" :value="pestana.valor" :prepend-icon="pestana.icono">
        {{ pestana.texto }}
      </v-tab>
    </v-tabs>
    <v-btn v-if="!apilado" :icon="abiertos ? 'mdi-chevron-up' : 'mdi-chevron-down'" variant="text" size="small"
           :title="abiertos ? 'Plegar' : resumen" @click="emit('update:abiertos', !abiertos)" />
  </div>
  <v-expand-transition>
    <div v-show="apilado || abiertos" class="pa-4">
      <slot />
    </div>
  </v-expand-transition>
</template>

<script setup>
// Las pestañas del panel de apoyo de WorkspaceLayout. En franja (sin `apilado`) se pliegan para dejar alto a la lista.
defineProps({
  modelValue: { type: String, required: true },
  // [{ valor, texto, icono }]
  pestanas: { type: Array, required: true },
  apilado: { type: Boolean, default: false },
  abiertos: { type: Boolean, default: true },
  // Lo que dice el boton de desplegar cuando esta plegado.
  resumen: { type: String, default: '' },
})
const emit = defineEmits(['update:modelValue', 'update:abiertos'])

function cambiar (valor) {
  emit('update:modelValue', valor)
  emit('update:abiertos', true)
}
</script>
