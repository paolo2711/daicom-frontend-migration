<template>
  <!-- El contador de caracteres dentro del campo (slot append-inner): no ocupa
       una linea debajo y solo se ve mientras se escribe en ese campo. -->
  <span class="contador text-caption text-medium-emphasis text-no-wrap">{{ largo }}/{{ max }}</span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  valor: { type: String, default: '' },
  max: { type: Number, required: true },
})

const largo = computed(() => (props.valor || '').length)
</script>

<style scoped>
.contador { visibility: hidden; }
.v-field--focused .contador { visibility: visible; }
</style>
