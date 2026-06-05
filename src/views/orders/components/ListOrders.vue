<template>
  <v-container fluid class="down-top-padding pa-0">

    <div class="d-flex align-center w-100 mb-2 mt-2">
      <v-tabs v-model="tab_activo" bg-color="transparent" color="primary" class="mx-2 font-weight-bold" style="width: auto;">
        <v-tab value="0" prepend-icon="mdi-certificate">Órdenes de Servicio</v-tab>
        <v-tab value="1" prepend-icon="mdi-truck-delivery">Órdenes de Alquiler</v-tab>
      </v-tabs>

      <v-spacer />

      <v-btn color="primary" class="mr-4" variant="flat" prepend-icon="mdi-folder-plus" v-if="tab_activo === '0'" @click="modalAddOrder?.open(1)">
        NUEVO SERVICIO
      </v-btn>
      <v-btn color="amber-darken-3" class="mr-4 text-white" variant="flat" prepend-icon="mdi-truck-plus" v-if="tab_activo === '1'" @click="modalAddOrder?.open(2)">
        NUEVO ALQUILER
      </v-btn>
    </div>

    <v-window v-model="tab_activo">
      <v-window-item value="0">
        <tab-orders-service ref="tabService" />
      </v-window-item>
      <v-window-item value="1">
        <tab-orders-rental v-if="rentalCargado" ref="tabRental" />
      </v-window-item>
    </v-window>

    <add-order ref="modalAddOrder" @reloadListComponent="recargarTablaManejada" />

  </v-container>
</template>

<script setup>
import { ref, watch } from 'vue'
import TabOrdersService from './TabOrdersService.vue'
import TabOrdersRental from './TabOrdersRental.vue'
import AddOrder from './AddOrder.vue'

const tab_activo   = ref('0')
const tabService   = ref(null)
const tabRental    = ref(null)
const modalAddOrder = ref(null)

// Bandera para saber si ya se visitó la pestaña de Alquileres
const rentalCargado = ref(false)

watch(tab_activo, (val) => {
  if (val === '1') rentalCargado.value = true
})

function recargarTablaManejada() {
  if (tab_activo.value === '0') {
    tabService.value?.retrieveOrders()
  } else {
    tabRental.value?.retrieveOrders()
  }
}

defineExpose({ recargarTablaManejada })
</script>