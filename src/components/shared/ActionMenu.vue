<template>
  <!-- Se ancla a las coordenadas del cursor. Son una prop reactiva, asi que
       abrir uno con otro abierto lo reubica solo. -->
  <v-menu v-model="menu.show" :target="[menu.x, menu.y]" :transition="false">
    <action-list v-if="acciones.length" :acciones="acciones" @accion="clave => emit('accion', clave)" />
  </v-menu>
</template>

<script setup>
import { watch } from 'vue'
import ActionList from './ActionList.vue'

// El menu flotante de una tabla. El estado sale de useContextMenu; las
// acciones, de la lista de cada pantalla.
const props = defineProps({
  menu: { type: Object, required: true },
  acciones: { type: Array, required: true },
})

const emit = defineEmits(['accion'])

// Sobre una fila sin nada que hacer (una orden anulada) el click derecho no
// abre nada.
watch(() => props.menu.show && !props.acciones.length, (vacio) => {
  if (vacio) props.menu.show = false
})
</script>
