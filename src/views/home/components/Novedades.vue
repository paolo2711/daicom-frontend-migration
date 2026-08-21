<template>
  <div class="pa-4">
    <div v-for="(it, i) in ultima.items" :key="i" class="nov-item">
      <v-icon size="18" color="primary">{{ it.icon }}</v-icon>
      <span class="nov-texto">{{ it.text }}</span>
    </div>
  </div>
</template>

<script setup>
import { CHANGELOG } from '@/data/changelog'

// El changelog viene ordenado de mas nuevo a mas viejo.
const ultima = CHANGELOG[0]
</script>

<style scoped>
.nov-item { display: flex; align-items: flex-start; gap: 10px; margin-bottom: .75rem; }
.nov-item:last-child { margin-bottom: 0; }
.nov-texto { font-size: .875rem; line-height: 1.4; }
</style>
