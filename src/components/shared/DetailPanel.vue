<template>
  <div class="d-flex flex-column fill-height">
    <div class="titulo-de-hoja bg-primary flex-shrink-0">
      <v-btn icon="mdi-arrow-left" variant="text" size="small" density="comfortable" title="Volver"
             @click="emit('cerrar')" />
      <span class="mr-auto text-truncate">{{ titulo }}</span>
      <v-btn icon="mdi-check" color="white" variant="flat" size="x-small" class="text-primary" title="Listo"
             @click="emit('cerrar')" />
    </div>
    <div class="contenido d-flex flex-column ga-3 pa-3 overflow-y-auto flex-grow-1">
      <slot />
    </div>
    <div v-if="$slots.pie" class="d-flex ga-2 px-4 py-3 border-t-thin flex-shrink-0">
      <slot name="pie" />
    </div>
  </div>
</template>

<script setup>
// El panel de la derecha de WorkspaceLayout cuando algo esta abierto: titulo con volver y listo, contenido y pie.
defineProps({ titulo: { type: String, required: true } })
const emit = defineEmits(['cerrar'])
</script>

<style scoped>
/* Los campos de Vuetify crecen en una columna flex; aca cada bloque ocupa solo su alto. */
.contenido > :slotted(*) { flex: 0 0 auto; }
</style>
