<template>
  <v-container fluid class="down-top-padding pa-0">
    <v-card variant="flat" class="border rounded-lg mb-4 pa-2 elevation-0">
      <div class="d-flex align-center">
        <v-text-field
          v-model="search"
          append-inner-icon="mdi-magnify"
          label="Buscar por ID, nombre o marca..."
          single-line
          hide-details
          variant="outlined"
          density="compact"
          @update:model-value="options.page = 1"
        />
        <v-btn icon variant="text" class="ml-2" color="primary" @click="loadItems" :loading="loading">
          <v-icon>mdi-refresh</v-icon>
        </v-btn>
      </div>
    </v-card>

    <table-loading-overlay :loading="loading" :isEmpty="equipos.length === 0">
      <v-data-table
        :headers="headers"
        :items="equipos"
        :search="search"
        class="elevation-0 tabla-mejorada bg-surface"
        v-model:page="options.page"
        v-model:items-per-page="options.itemsPerPage"
        hide-default-footer
      >
        <template v-slot:bottom>
          <fluent-pagination
            :page="options.page"
            :itemsPerPage="options.itemsPerPage"
            :totalItems="filteredEquiposCount"
            @update:page="options.page = $event"
            @update:itemsPerPage="onItemsPerPageChange"
          />
        </template>

        <template v-slot:item.internal_id="{ item }">
          <strong>{{ item.internal_id }}</strong>
        </template>

        <template v-slot:item.status="{ item }">
          <v-chip :color="getStatusColor(item.status)" size="small" variant="flat" class="text-white">
            {{ getStatusText(item.status) }}
          </v-chip>
        </template>

        <template v-slot:item.actions="{ item }">
          <v-tooltip location="top">
            <template v-slot:activator="{ props }">
              <v-btn icon variant="text" size="small" class="mr-1" v-bind="props" @click="editItem(item)">
                <v-icon size="small">mdi-pencil</v-icon>
              </v-btn>
            </template>
            <span>Editar y Documentos</span>
          </v-tooltip>

          <v-tooltip location="top">
            <template v-slot:activator="{ props }">
              <v-btn icon variant="text" size="small" color="indigo" class="mr-1" v-bind="props" @click="$emit('view-history', item)">
                <v-icon size="small">mdi-truck-fast</v-icon>
              </v-btn>
            </template>
            <span>Historial de Viajes</span>
          </v-tooltip>

          <v-tooltip location="top">
            <template v-slot:activator="{ props }">
              <v-btn icon variant="text" size="small" color="red" v-bind="props" @click="deleteItem(item)">
                <v-icon size="small">mdi-delete</v-icon>
              </v-btn>
            </template>
            <span>Dar de Baja</span>
          </v-tooltip>
        </template>
      </v-data-table>
    </table-loading-overlay>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

import Swal from 'sweetalert2'
import InventoryDataService from '@/services/inventory/inventoryDataService'
import FluentPagination from '@/components/commonComponents/FluentPagination.vue'
import TableLoadingOverlay from '@/components/commonComponents/TableLoadingOverlay.vue'

const emit = defineEmits(['edit-item', 'view-history'])




const search = ref('')
const loading = ref(false)
const equipos = ref([])
const options = ref({ page: 1, itemsPerPage: 30 })

const headers = [
  { title: 'ID Interno', key: 'internal_id' },
  { title: 'Nombre del Equipo', key: 'name' },
  { title: 'Marca', key: 'brand' },
  { title: 'Modelo', key: 'model' },
  { title: 'N° Serie', key: 'series' },
  { title: 'Estado', key: 'status', align: 'center' },
  { title: 'Acciones', key: 'actions', sortable: false, align: 'end' },
]

const statusOptions = [
  { text: 'Disponible', value: 1, color: 'green' },
  { text: 'Alquilado', value: 2, color: 'orange-darken-2' },
  { text: 'Mantenimiento', value: 3, color: 'blue' },
  { text: 'Baja', value: 4, color: 'grey' },
]

const filteredEquiposCount = computed(() => {
  if (!search.value) return equipos.value.length
  const s = search.value.toLowerCase()
  return equipos.value.filter(item =>
    (item.internal_id && item.internal_id.toLowerCase().includes(s)) ||
    (item.name && item.name.toLowerCase().includes(s)) ||
    (item.brand && item.brand.toLowerCase().includes(s))
  ).length
})

const onItemsPerPageChange = (newVal) => {
  options.value.itemsPerPage = newVal
  options.value.page = 1
}

const loadItems = () => {
  loading.value = true
  InventoryDataService.getAll()
    .then(response => {
      equipos.value = response.data.results ? response.data.results : response.data
    })
    .catch(e => console.error("Error cargando equipos:", e))
    .finally(() => loading.value = false)
}

const getStatusText = (val) => {
  const status = statusOptions.find(s => s.value === val)
  return status ? status.text : 'Desconocido'
}

const getStatusColor = (val) => {
  const status = statusOptions.find(s => s.value === val)
  return status ? status.color : 'black'
}

const editItem = (item) => {
  emit('edit-item', item)
}

const deleteItem = (item) => {
  Swal.fire({
    title: '¿Estás seguro?',
    text: `Se eliminará el equipo ${item.internal_id}`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sí, eliminar'
  }).then((result) => {
    if (result.isConfirmed) {
      InventoryDataService.delete(item.id).then(() => {
        loadItems()
        Swal.fire('Eliminado', 'El equipo ha sido borrado.', 'success')
      }).catch(e => {
        Swal.fire('Error', 'No se pudo eliminar', 'error')
        console.error(e)
      })
    }
  })
}

const updateRow = (updatedItem) => {
  const index = equipos.value.findIndex(e => e.id === updatedItem.id)
  if (index !== -1) {
    equipos.value[index] = { ...equipos.value[index], ...updatedItem }
  }
}

const addRow = (newItem) => {
  equipos.value.unshift(newItem)
}

onMounted(() => {
  loadItems()
})

defineExpose({ loadItems, updateRow, addRow })
</script>