<template>
  <div class="fluent-pagination-container">
    <v-divider />
    <div class="fluent-footer px-4 py-2 d-flex align-center justify-space-between flex-wrap">

      <div class="d-flex align-center my-1">
        <v-menu location="top" transition="slide-y-reverse-transition">
          <template v-slot:activator="{ props }">
            <div v-bind="props" class="fluent-per-page-activator text-caption text-md-body-2">
              Mostrando <b>{{ itemsPerPage }}</b> registros <v-icon size="small">mdi-chevron-up</v-icon>
            </div>
          </template>
          <v-list class="fluent-menu rounded-lg" density="compact">
            <v-list-item v-for="n in [30, 60, 80, 100]" :key="n"
                         @click="changeItemsPerPage(n)"
                         class="fluent-list-item">
              <v-list-item-title class="text-caption text-md-body-2">{{ n }} registros</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
        <span class="text-caption text-md-body-2 text-medium-emphasis ml-3">de {{ totalItems }} en total</span>
      </div>

      <v-pagination
        :model-value="page"
        @update:model-value="changePage"
        :length="Math.ceil(totalItems / itemsPerPage) || 1"
        :total-visible="7"
        density="compact"
        class="fluent-pagination my-0"
        next-icon="mdi-chevron-right"
        prev-icon="mdi-chevron-left"
      />

    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  page:         { type: Number, required: true },
  itemsPerPage: { type: Number, required: true },
  totalItems:   { type: Number, required: true },
})

const emit = defineEmits(['update:page', 'update:itemsPerPage'])

function changePage(newPage) {
  emit('update:page', newPage)
}

function changeItemsPerPage(newItemsPerPage) {
  emit('update:itemsPerPage', newItemsPerPage)
  emit('update:page', 1)
}
</script>

<style>
.fluent-footer { width: 100%; background: transparent; }
.fluent-per-page-activator { cursor: pointer; padding: 4px 8px; border-radius: 4px; transition: background-color 0.2s ease; user-select: none; }
.v-theme--light .fluent-per-page-activator:hover { background-color: rgba(0, 0, 0, 0.05); }
.v-theme--dark  .fluent-per-page-activator:hover { background-color: rgba(255, 255, 255, 0.08); }

.fluent-menu { border: 1px solid rgba(0,0,0,0.12) !important; box-shadow: 0 8px 16px rgba(0,0,0,0.1) !important; }
.fluent-list-item { min-height: 32px !important; }

.fluent-pagination .v-pagination__item .v-btn,
.fluent-pagination .v-pagination__prev .v-btn,
.fluent-pagination .v-pagination__next .v-btn {
  box-shadow: none !important;
  border-radius: 6px !important;
  background: transparent !important;
  transition: all 0.2s ease;
  border: 1px solid transparent;
  height: 32px !important;
  width: 32px !important;
  min-width: 32px !important;
  font-size: 0.85rem !important;
}
.v-theme--light .fluent-pagination .v-pagination__item .v-btn:hover,
.v-theme--light .fluent-pagination .v-pagination__prev .v-btn:hover,
.v-theme--light .fluent-pagination .v-pagination__next .v-btn:hover { background-color: rgba(0, 0, 0, 0.05) !important; }
.v-theme--dark  .fluent-pagination .v-pagination__item .v-btn:hover,
.v-theme--dark  .fluent-pagination .v-pagination__prev .v-btn:hover,
.v-theme--dark  .fluent-pagination .v-pagination__next .v-btn:hover { background-color: rgba(255, 255, 255, 0.08) !important; }

.fluent-pagination .v-pagination__item--is-active .v-btn {
  border: 1px solid rgb(var(--v-theme-primary)) !important;
  background-color: rgba(var(--v-theme-primary), 0.08) !important;
  color: rgb(var(--v-theme-primary)) !important;
  font-weight: bold;
}
</style>