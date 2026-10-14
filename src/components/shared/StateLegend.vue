<template>
  <v-card variant="flat" class="border mt-4 py-4 px-4 rounded-lg">
    <v-row align="center" justify="center" no-gutters>
      <span class="text-caption font-weight-bold mr-4 text-uppercase text-medium-emphasis">{{ titulo }}</span>
      <div class="d-flex flex-wrap justify-center">
        <v-chip v-for="estado in lista" :key="estado.texto" size="small" :color="estado.color"
                class="mr-3 mb-1 text-white">{{ estado.texto }}</v-chip>
      </div>
    </v-row>
  </v-card>
</template>

<script setup>
import { computed } from 'vue'

// La leyenda de colores debajo de una tabla: que estado es cada color de la
// pildora del codigo.
const props = defineProps({
  titulo: { type: String, required: true },
  // { clave: { texto, color } }, como los ESTADOS de cada modulo.
  estados: { type: Object, required: true },
})

const lista = computed(() => Object.values(props.estados))
</script>
