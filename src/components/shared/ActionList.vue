<template>
  <v-list density="compact" class="elevation-4 border rounded-lg bg-surface">
    <template v-for="(accion, i) in acciones" :key="accion.clave">
      <v-divider v-if="i > 0 && accion.grupo !== acciones[i - 1].grupo" class="my-1 border-opacity-25" />
      <v-list-item :disabled="accion.disabled" @click="emit('accion', accion.clave)">
        <template #prepend>
          <v-icon size="small">{{ accion.icono }}</v-icon>
        </template>
        <v-list-item-title class="font-weight-medium text-body-2">{{ accion.texto }}</v-list-item-title>
        <v-list-item-subtitle v-if="accion.detalle" class="text-caption">{{ accion.detalle }}</v-list-item-subtitle>
      </v-list-item>
    </template>
  </v-list>
</template>

<script setup>
// Una lista de acciones como menu: un separador entre grupos, y en gris lo que
// no se puede hacer ahora (sigue en su lugar, asi el menu no cambia de forma).
defineProps({
  // { clave, texto, icono, grupo, disabled, detalle? }
  acciones: { type: Array, required: true },
})

const emit = defineEmits(['accion'])
</script>
