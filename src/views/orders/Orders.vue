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

          <v-btn color="primary" class="mr-4" variant="flat" prepend-icon="mdi-folder-plus" v-if="route.name === 'orders-service'" @click="modalAddOrder?.open(1)">
            NUEVO SERVICIO
          </v-btn>
          <v-btn color="amber-darken-3" class="mr-4 text-white" variant="flat" prepend-icon="mdi-truck-plus" v-if="route.name === 'orders-rental'" @click="modalAddOrder?.open(2)">
            NUEVO ALQUILER
          </v-btn>
        </div>

        <router-view />

        <add-order ref="modalAddOrder" @reloadListComponent="recargarTablaManejada" />
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import AddOrder from '@/views/orders/components/AddOrder.vue'

const route = useRoute()
const modalAddOrder = ref(null)

// Como ahora Servicio y Alquiler son rutas/componentes distintos (no viven los
// dos montados a la vez con v-window), no hay ref directo al hijo activo.
// Reusamos el mismo canal de eventos que ya usa el WebSocket para refrescar
// la tabla — el que esté montado lo escucha, el otro simplemente no existe.
function recargarTablaManejada() {
  window.dispatchEvent(new CustomEvent('wss-reload-orders-service'))
  window.dispatchEvent(new CustomEvent('wss-reload-orders-rental'))
}
</script>