<template>
  <div>
    <div v-for="(texto, i) in lista" :key="i" class="d-flex align-start ga-1 mb-2">
      <v-textarea
        :model-value="texto"
        :placeholder="placeholder"
        :maxlength="maxlength || undefined"
        rows="1"
        auto-grow
        density="compact"
        variant="outlined"
        hide-details
        @update:model-value="valor => lista[i] = valor"
      >
        <template v-if="maxlength" #append-inner><inner-counter :valor="texto" :max="maxlength" /></template>
      </v-textarea>
      <v-btn icon="mdi-close" variant="text" size="small" color="error" @click="lista.splice(i, 1)" />
    </div>
    <v-btn variant="text" color="primary" size="small" prepend-icon="mdi-plus" @click="lista.push('')">
      {{ textoAgregar }}
    </v-btn>
  </div>
</template>

<script setup>
import InnerCounter from '@/components/shared/InnerCounter.vue'

// Una lista de textos que se agregan y se quitan (observaciones, clausulas,
// notas). Edita el arreglo que recibe.
const lista = defineModel({ type: Array, required: true })

defineProps({
  textoAgregar: { type: String, default: 'Añadir' },
  placeholder: { type: String, default: '' },
  maxlength: { type: Number, default: 0 },
})
</script>
