<template>
  <v-container fluid class="down-top-padding">
    <v-row>
      <v-col cols="12">
        <div class="d-flex align-center mb-4">
          <v-icon size="large" color="primary" class="mr-3">mdi-folder-table</v-icon>
          <h2 class="text-h5 font-weight-bold mb-0">Gestión de Órdenes</h2>
        </div>
        <list-orders ref="listOrders" />
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref } from 'vue'
import ListOrders from '@/views/orders/components/ListOrders.vue'

const listOrders = ref(null)
</script>