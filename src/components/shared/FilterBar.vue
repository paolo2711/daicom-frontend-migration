<template>
  <v-card variant="flat" class="border rounded-lg mb-4 pa-4 bg-surface">
    <div class="d-flex flex-wrap align-center ga-4">
      <slot />

      <template v-if="$slots.pildoras">
        <v-divider vertical class="mx-2 d-none d-md-block align-self-stretch" />
        <slot name="pildoras" />
      </template>

      <v-spacer />

      <v-btn v-if="$slots.avanzados" :variant="abiertos ? 'tonal' : 'text'" color="primary"
             class="font-weight-bold text-none" @click="abiertos = !abiertos">
        <v-icon start>{{ abiertos ? 'mdi-filter-minus' : 'mdi-filter-plus' }}</v-icon>
        {{ abiertos ? 'Ocultar Filtros' : 'Filtros Avanzados' }}
      </v-btn>
    </div>

    <v-expand-transition>
      <div v-if="$slots.avanzados" v-show="abiertos">
        <v-divider class="my-4 border-opacity-25" />
        <v-row dense>
          <slot name="avanzados" />
        </v-row>
      </div>
    </v-expand-transition>
  </v-card>
</template>

<script setup>
import { ref } from 'vue'

// La tarjeta de filtros de una lista: buscadores a la vista, pildoras despues
// de un separador y el resto en "Filtros Avanzados". Los avanzados van en
// v-col, cada lista dice su ancho.
const abiertos = ref(false)
</script>

<style scoped>
/* Los buscadores de la fila principal: mismo ancho entre si, y en pantalla
   angosta bajan uno por linea. */
:slotted(.v-input) {
  flex: 0 1 15rem;
  min-width: 12rem;
}
</style>
