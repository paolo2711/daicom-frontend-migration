<template>
  <div class="d-flex flex-column ga-2">
    <div v-for="opcion in opciones" :key="opcion.clave" class="fila-que-abre text-body-2"
         :class="{ abierta: abierta === opcion.clave }" role="button" tabindex="0"
         @click="emit('abrir', opcion.clave)" @keydown.enter="emit('abrir', opcion.clave)">
      <v-icon size="small" color="primary">{{ opcion.icono }}</v-icon>
      <span class="text-no-wrap mr-auto">{{ opcion.titulo }}</span>
      <span v-if="opcion.valor" class="text-caption text-medium-emphasis text-truncate">{{ opcion.valor }}</span>
      <v-icon size="small" class="text-medium-emphasis">mdi-chevron-right</v-icon>
    </div>
  </div>
</template>

<script setup>
// La pestaña Opciones: cada fila abre lo suyo en el panel de la derecha y muestra su valor.
defineProps({
  // [{ clave, titulo, icono, valor }]
  opciones: { type: Array, required: true },
  // La clave de la que esta abierta.
  abierta: { type: String, default: null },
})
const emit = defineEmits(['abrir'])
</script>
