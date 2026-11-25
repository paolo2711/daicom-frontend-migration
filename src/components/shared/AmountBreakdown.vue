<template>
  <div class="desglose" :class="{ 'con-total': total }">
    <template v-if="total">
      <div class="text-caption text-medium-emphasis">{{ total.titulo }}</div>
      <div class="total">{{ total.valor }}</div>
    </template>
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
  total: { type: Object, default: null },  // { titulo, valor }: en grande arriba, y las filas quedan en gris
})
</script>

<style scoped>
.desglose { font-size: 0.8125rem; line-height: 1.35; }
.total { font-size: 1.375rem; font-weight: 600; line-height: 1.3; margin-bottom: 0.375rem; }
.con-total .fila:not(.final) {
  font-size: 0.75rem;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
}
.con-total .final { border-top: 0; margin-top: 0; padding-top: 0.125rem; }
.fila { display: flex; justify-content: space-between; align-items: baseline; gap: 0.5rem; padding: 0.125rem 0; }
.final {
  margin-top: 0.25rem;
  padding-top: 0.375rem;
  border-top: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
  font-weight: 600;
}
</style>
