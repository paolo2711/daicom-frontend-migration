<template>
  <v-avatar size="2.5rem" rounded="lg" variant="tonal" class="my-1" :class="{ 'cursor-pointer': seAbre }"
            :title="seAbre ? 'Ver fotos' : undefined" @click="alClic">
    <v-img v-if="foto" :src="foto" cover />
    <v-icon v-else size="small" class="text-medium-emphasis">mdi-toolbox-outline</v-icon>
  </v-avatar>
</template>

<script setup>
import { computed } from 'vue'

// La foto principal de un equipo del inventario.
const props = defineProps({
  foto: { type: String, default: null },
  // Si al apretarla se ven sus fotos; la que no tiene no se aprieta.
  abre: { type: Boolean, default: false },
})
const emit = defineEmits(['abrir'])

const seAbre = computed(() => props.abre && Boolean(props.foto))

function alClic (event) {
  if (!seAbre.value) return
  event.stopPropagation()
  emit('abrir')
}
</script>
