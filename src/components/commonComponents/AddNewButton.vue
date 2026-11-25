<template>
  <v-tooltip :text="texto" location="top">
    <template #activator="{ props }">
      <v-btn v-bind="props" :icon="icono" variant="tonal" rounded="lg" class="boton-nuevo" :loading="loading"
             :aria-label="texto" @click="$emit('click')" />
    </template>
  </v-tooltip>
</template>

<style scoped>
.boton-nuevo {
  height: var(--v-input-control-height, 2.5rem);
  width: var(--v-input-control-height, 2.5rem);
}
</style>

<script setup>
// Va en el slot `append` del campo al que le falta la opcion: asi queda
// alineado con el y del mismo alto.
defineProps({
  texto: { type: String, required: true },
  icono: { type: String, default: 'mdi-plus' },
  loading: { type: Boolean, default: false },
})

defineEmits(['click'])
</script>
