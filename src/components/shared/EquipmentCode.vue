<template>
  <v-chip :color="estado?.color" size="small" class="font-weight-bold">
    {{ codigo }}
    <v-tooltip v-if="detalle" activator="parent" location="top">{{ detalle }}</v-tooltip>
  </v-chip>
</template>

<script setup>
// El codigo de un equipo: el color de la pildora es su estado, con la leyenda debajo de la tabla.
defineProps({
  codigo: { type: String, required: true },
  // { texto, color }; sin estado todavia, sale en gris.
  estado: { type: Object, default: null },
  // Lo que se lee al pasar el mouse.
  detalle: { type: String, default: '' },
})
</script>
