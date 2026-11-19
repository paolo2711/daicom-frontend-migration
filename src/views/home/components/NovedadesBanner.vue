<template>
  <div class="hoja franja con-marca mb-6">
    <v-icon class="franja-icono">mdi-rocket-launch-outline</v-icon>
    <div class="d-flex flex-column flex-grow-1" style="min-width: 0;">
      <span class="font-weight-bold">Novedades de la v{{ ultima.version }}</span>
      <span v-for="(texto, i) in destacados" :key="i" class="franja-item">{{ texto }}</span>
    </div>
    <v-btn variant="tonal" @click="todas = true">Ver todo</v-btn>
  </div>

  <v-dialog v-model="todas" class="dialog-premium" width="90%" max-width="40rem" scrollable>
    <v-card>
      <base-modal-header title="Novedades" icon="mdi-rocket-launch-outline" @close="todas = false">
        Versión {{ ultima.version }}
      </base-modal-header>
      <v-card-text class="pa-0"><novedades /></v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed, ref } from 'vue'
import { CHANGELOG } from '@/data/changelog'
import Novedades from '@/views/home/components/Novedades.vue'

// Arriba de Inicio, siempre la ultima version: no se cierra, la reemplaza la siguiente.
const ultima = CHANGELOG[0]
const todas = ref(false)
const destacados = computed(() => ['nuevo', 'cambio', 'arreglo'].flatMap(tipo => ultima[tipo] || []).slice(0, 2))
</script>

<style scoped>
.franja {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.875rem 1rem;
  background: rgb(var(--v-theme-panel));
}
.franja-icono { color: rgb(var(--v-theme-seleccion)); }
.franja-item {
  font-size: 0.8125rem;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
</style>
