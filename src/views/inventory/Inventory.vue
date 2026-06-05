<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <div class="d-flex align-center mb-4">
          <v-icon size="large" color="primary" class="mr-3">mdi-toolbox</v-icon>
          <h2 class="text-h5 font-weight-bold mb-0">Gestión de Equipos</h2>
          <v-spacer></v-spacer>
          
          <v-btn color="primary" variant="flat" @click="addModal?.open()">
            <v-icon start>mdi-plus</v-icon> Nuevo Equipo
          </v-btn>
        </div>
        
        <inventory-table ref="inventoryTable" @view-history="openHistory" @edit-item="openEdit" />
      </v-col>
    </v-row>

    <add-equipment ref="addModal" @saved="inventoryTable?.loadItems()" />
    
    <equipment-history ref="historyModal" />
  </v-container>
</template>

<script setup>
import { ref } from 'vue'
import InventoryTable from './components/ListInventory.vue'
import AddEquipment from './components/AddEquipment.vue'
import EquipmentHistory from './components/EquipmentHistory.vue'

const inventoryTable = ref(null)
const addModal = ref(null)
const historyModal = ref(null)

const openHistory = (item) => {
  historyModal.value?.open(item)
}

const openEdit = (item) => {
  addModal.value?.open(item)
}
</script>