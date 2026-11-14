<template>
  <div class="segmentos" role="radiogroup">
    <button v-for="opcion in opciones" :key="String(opcion.valor)" type="button" role="radio"
            :aria-checked="opcion.valor === modelValue" class="segmento"
            :class="{ elegido: opcion.valor === modelValue }" @click="emit('update:modelValue', opcion.valor)">
      {{ opcion.texto }}
    </button>
  </div>
</template>

<script setup>
// Elegir una entre pocas opciones a la vista (contado o credito, servicio o alquiler).
defineProps({
  modelValue: { type: [String, Number, Boolean], default: null },
  // [{ valor, texto }]
  opciones: { type: Array, required: true },
})
const emit = defineEmits(['update:modelValue'])
</script>

<style scoped>
.segmentos {
  display: flex;
  gap: 0.25rem;
  padding: 0.25rem;
  border-radius: 0.625rem;
  background: rgba(var(--v-theme-on-surface), 0.06);
}
.segmento {
  flex: 1 1 0;
  padding: 0.4rem 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  transition: background-color 0.15s;
}
.segmento:hover:not(.elegido) { background: rgba(var(--v-theme-on-surface), 0.06); }
.segmento.elegido {
  background: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
  font-weight: 600;
}
</style>
