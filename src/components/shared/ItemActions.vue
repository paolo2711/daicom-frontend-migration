<template>
  <v-btn v-if="copia" variant="tonal" prepend-icon="mdi-content-copy" :title="copia"
         @click="emit('otro-igual')">Otro igual</v-btn>
  <v-spacer />
  <v-btn v-if="seQuita" variant="text" color="red" prepend-icon="mdi-delete" @click="emit('quitar')">Quitar</v-btn>
</template>

<script setup>
// El pie del panel de un item: "Otro igual" a la izquierda y "Quitar" a la derecha.
defineProps({
  // Lo que copia "Otro igual", que sale de ayuda al pasar el mouse; sin texto no hay boton.
  copia: { type: String, default: '' },
  seQuita: { type: Boolean, default: true },
})
const emit = defineEmits(['otro-igual', 'quitar'])
</script>
