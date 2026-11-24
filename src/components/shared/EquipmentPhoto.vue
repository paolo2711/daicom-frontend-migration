<template>
  <v-avatar size="2.5rem" rounded="lg" variant="tonal" class="my-1">
    <v-img v-if="foto" :src="foto" cover />
    <v-icon v-else size="small" class="text-medium-emphasis">mdi-toolbox-outline</v-icon>
  </v-avatar>
</template>

<script setup>
// La foto principal de un equipo del inventario.
defineProps({ foto: { type: String, default: null } })
</script>
