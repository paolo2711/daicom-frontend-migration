<template>
  <v-tooltip v-if="numeros.length" location="bottom">
    <template #activator="{ props }">
      <span v-bind="props" class="numeros-anteriores text-caption text-medium-emphasis ml-1">
        Mod. {{ numeros.length }}
      </span>
    </template>
    <div v-for="n in numeros" :key="n.numero">
      Antes: {{ n.numero }}
      · {{ fechaCorta(n.created_at) }} · {{ n.created_by }}
    </div>
  </v-tooltip>
</template>

<script setup>
import { fechaCorta } from '@/utils/dates'

defineProps({
  numeros: { type: Array, default: () => [] },
})
</script>

<style scoped>
.numeros-anteriores {
  cursor: help;
  text-decoration: underline dotted;
  text-underline-offset: 2px;
}
</style>
