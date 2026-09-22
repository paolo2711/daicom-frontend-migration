<template>
  <!-- Desde `umbral` acciones visibles se agrupan: varios botones con texto
       comprimen el resto de la barra y el titulo deja de leerse. Por debajo
       entran sueltas, que es un clic menos. -->
  <v-menu v-if="visibles.length >= umbral" location="bottom end">
    <template #activator="{ props }">
      <v-btn v-bind="props" :size="size" variant="tonal" append-icon="mdi-menu-down"
             class="font-weight-bold">
        {{ etiqueta }}
      </v-btn>
    </template>

    <v-list density="compact">
      <v-list-item v-for="accion in visibles" :key="accion.clave"
                   :disabled="accion.disabled" @click="emit('accion', accion.clave)">
        <template #prepend>
          <v-icon size="x-small">{{ accion.icono }}</v-icon>
        </template>
        <v-list-item-title class="text-body-2">{{ accion.texto }}</v-list-item-title>
      </v-list-item>
    </v-list>
  </v-menu>

  <template v-else>
    <v-btn v-for="accion in visibles" :key="accion.clave"
           :size="size" :color="accion.color" variant="flat" class="text-white"
           :disabled="accion.disabled" @click="emit('accion', accion.clave)">
      <v-icon start size="x-small">{{ accion.icono }}</v-icon> {{ accion.texto }}
    </v-btn>
  </template>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  // { clave, texto, icono, color, visible, disabled }
  acciones: { type: Array, required: true },
  etiqueta: { type: String, default: 'Acciones en lote' },
  umbral: { type: Number, default: 3 },
  size: { type: String, default: 'x-small' },
})

const emit = defineEmits(['accion'])

const visibles = computed(() => props.acciones.filter(a => a.visible !== false))
</script>
