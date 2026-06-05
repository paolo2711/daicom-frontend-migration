<template>
  <v-container fluid class="down-top-padding">
    <v-row>
      <v-col cols="12">
        <div class="d-flex align-center mb-4">
          <v-icon size="large" color="primary" class="mr-3">mdi-toolbox</v-icon>
          <h2 class="text-h5 font-weight-bold mb-0">Gestión del Catálogo Maestro</h2>
        </div>

        <list-equipments ref="listEquipments" />
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref } from 'vue'
import ListEquipments from '@/views/equipments/components/ListEquipments.vue'

const listEquipments = ref(null)
</script>