<template>
  <v-container fluid class="down-top-padding">
    <v-row>
      <v-col cols="12">
        <div class="d-flex align-center mb-4">
          <v-icon size="large" color="primary" class="mr-3">mdi-folder-table</v-icon>
          <h2 class="text-h5 font-weight-bold mb-0">Gestión de Órdenes</h2>
        </div>

        <div class="d-flex align-center w-100 mb-2 mt-2">
          <v-tabs :model-value="route.name" bg-color="transparent" color="primary" class="mx-2 font-weight-bold" style="width: auto;">
            <v-tab value="orders-service" :to="{ name: 'orders-service' }" prepend-icon="mdi-certificate">Órdenes de Servicio</v-tab>
            <v-tab value="orders-rental" :to="{ name: 'orders-rental' }" prepend-icon="mdi-truck-delivery">Órdenes de Alquiler</v-tab>
          </v-tabs>

          <v-spacer />

          <v-btn color="primary" class="mr-4" variant="flat" prepend-icon="mdi-folder-plus" v-if="route.name === 'orders-service'" @click="modalAddOrder?.open(SERVICIO)">
            NUEVO SERVICIO
          </v-btn>
          <v-btn color="primary" class="mr-4" variant="flat" prepend-icon="mdi-truck-plus" v-if="route.name === 'orders-rental'" @click="modalAddOrder?.open(ALQUILER)">
            NUEVO ALQUILER
          </v-btn>
        </div>

        <router-view />

        <add-order ref="modalAddOrder" />
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import AddOrder from '@/views/orders/components/AddOrder.vue'
import { ALQUILER, SERVICIO } from '@/utils/orders/estado'

const route = useRoute()
const modalAddOrder = ref(null)
</script>

<style lang="scss">
/* Vuetify pinta su hover con td::after, encima del fondo: en la orden abierta se apaga. */
.tabla-ordenes {
  tbody tr:not(.fila-padre-activa):not(.fila-activa):not(.fila-en-menu):hover > td {
    background-color: rgba(var(--v-theme-on-surface), 0.04) !important;
  }

  tbody tr.fila-padre-activa > td::after,
  tbody tr.fila-activa > td::after,
  tr.fila-activa .v-table tbody tr > td::after {
    display: none !important;
  }

  tr.fila-activa .v-table,
  tr.fila-activa .v-table__wrapper {
    background-color: transparent !important;
  }
}

.v-theme--light .tabla-ordenes tbody tr:is(.fila-padre-activa, .fila-activa) > td {
  background-color: #e8e8e8 !important;
}
.v-theme--dark .tabla-ordenes {
  tbody tr:not(.fila-padre-activa):not(.fila-activa):not(.fila-en-menu):hover > td {
    background-color: rgba(var(--v-theme-on-surface), 0.05) !important;
  }

  tbody tr:is(.fila-padre-activa, .fila-activa) > td {
    background-color: #292929 !important;
  }
}
</style>
