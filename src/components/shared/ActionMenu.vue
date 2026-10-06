<template>
  <!-- Se ancla a las coordenadas del cursor. Son una prop reactiva, asi que
       abrir uno con otro abierto lo reubica solo. -->
  <v-menu :model-value="menu.show" :target="[menu.x, menu.y]" :transition="false"
          @update:model-value="abierto => abierto || cerrar()">
    <action-list v-if="acciones.length" :acciones="acciones" @accion="clave => emit('accion', clave)" />
  </v-menu>
</template>

<script setup>
import { watch } from 'vue'
import ActionList from './ActionList.vue'

// El menu flotante de una tabla. El estado sale de useContextMenu (va con
// v-model:menu); las acciones, de la lista de cada pantalla.
const menu = defineModel('menu', { type: Object, required: true })
const props = defineProps({
  acciones: { type: Array, required: true },
})

const emit = defineEmits(['accion'])

const cerrar = () => { menu.value = { ...menu.value, show: false } }

// Sobre una fila sin nada que hacer (una orden anulada) el click derecho no
// abre nada.
watch(() => menu.value.show && !props.acciones.length, (vacio) => {
  if (vacio) cerrar()
})
</script>
