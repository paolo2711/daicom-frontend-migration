<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <div class="d-flex align-center mb-4">
          <v-icon size="large" color="primary" class="mr-3">mdi-factory</v-icon>
          <h2 class="text-h5 font-weight-bold mb-0">Gestión de Laboratorios</h2>
          <v-spacer></v-spacer>
          <v-btn color="primary" variant="flat" prepend-icon="mdi-plus" @click="listLabs?.openAddDialog()">
            NUEVO
          </v-btn>
        </div>

        <list-labs ref="listLabs" />
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref } from 'vue'
import ListLabs from '@/views/labs/components/ListLabs.vue'

const listLabs = ref(null)
</script>