<template>
  <div class="desglose">
    <div v-for="fila in filas" :key="fila.titulo" class="fila">
      <span class="text-truncate">
        {{ fila.titulo }}<span v-if="fila.detalle" class="text-medium-emphasis"> · {{ fila.detalle }}</span>
      </span>
      <span class="text-no-wrap" :class="{ 'text-medium-emphasis': fila.resta }">
        {{ fila.resta ? `− ${fila.valor}` : fila.valor }}
      </span>
    </div>
    <div class="fila final">
      <span>{{ final.titulo }}</span>
      <span class="text-no-wrap" :class="final.tono && `text-${final.tono}`">{{ final.valor }}</span>
    </div>
  </div>
</template>

<script setup>
// Una resta de arriba abajo, como un recibo: cada fila con su detalle y al final lo que queda.
defineProps({
  filas: { type: Array, required: true },  // [{ titulo, valor, detalle, resta }], con el valor ya en su moneda
  final: { type: Object, required: true },  // { titulo, valor, tono }
})
</script>

<style scoped>
.desglose { font-size: 0.8125rem; line-height: 1.35; }
.fila { display: flex; justify-content: space-between; align-items: baseline; gap: 0.5rem; padding: 0.125rem 0; }
.final {
  margin-top: 0.25rem;
  padding-top: 0.375rem;
  border-top: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
  font-weight: 600;
}
</style>
