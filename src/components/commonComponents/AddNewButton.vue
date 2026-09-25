<template>
  <v-tooltip :text="texto" location="top">
    <template #activator="{ props }">
      <v-btn v-bind="props" icon="mdi-plus" variant="tonal" color="primary" rounded="lg" class="boton-nuevo"
             :aria-label="texto" @click="$emit('click')" />
    </template>
  </v-tooltip>
</template>

<style scoped>
.boton-nuevo {
  height: var(--v-input-control-height);
  width: var(--v-input-control-height);
}
</style>

<script setup>
// Va en el slot `append` del campo al que le falta la opcion: asi queda
// alineado con el y del mismo alto.
defineProps({
  texto: { type: String, required: true },
})

defineEmits(['click'])
</script>
