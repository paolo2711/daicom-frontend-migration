<template>
  <div class="d-flex flex-column fill-height">
    <div class="titulo-de-hoja flex-shrink-0">{{ titulo }}</div>
    <div class="d-flex flex-column align-center justify-center flex-grow-1 ga-3 pa-8 text-center text-medium-emphasis">
      <v-avatar size="64" variant="tonal">
        <v-icon size="32">{{ icono }}</v-icon>
      </v-avatar>
      <div class="text-body-2 texto">{{ texto }}</div>
    </div>
  </div>
</template>

<script setup>
// El panel de la derecha de WorkspaceLayout cuando no hay nada abierto.
defineProps({
  titulo: { type: String, required: true },
  icono: { type: String, default: 'mdi-gesture-tap' },
  texto: { type: String, required: true },
})
</script>

<style scoped>
.texto { max-width: 16rem; }
</style>
