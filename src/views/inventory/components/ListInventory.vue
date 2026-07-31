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
        />
        <v-btn icon variant="text" class="ml-2" color="primary" @click="loadItems" :loading="loading">
          <v-icon>mdi-refresh</v-icon>
        </v-btn>
      </div>
    </v-card>

    <table-loading-overlay :loading="loading" :isEmpty="equipos.length === 0">
      <v-data-table-server
        :headers="headers"
        :items="equipos"
        :items-length="total"
        :loading="loading"
        class="elevation-0 tabla-mejorada bg-surface"
        hide-default-footer
      >
        <template v-slot:bottom>
          <fluent-pagination
            :page="options.page"
            :itemsPerPage="options.itemsPerPage"
            :totalItems="total"
            @update:page="onPageChange"
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
              <v-btn icon variant="text" size="small" color="error" v-bind="props" @click="deleteItem(item)">
                <v-icon size="small">mdi-delete-outline</v-icon>
              </v-btn>
            </template>
            <span>Eliminar equipo</span>
          </v-tooltip>
        </template>
      </v-data-table-server>
    </table-loading-overlay>
  </v-container>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'

import Swal from 'sweetalert2'
import InventoryDataService from '@/services/inventory/inventoryDataService'
import FluentPagination from '@/components/commonComponents/FluentPagination.vue'
import TableLoadingOverlay from '@/components/commonComponents/TableLoadingOverlay.vue'

const emit = defineEmits(['edit-item', 'view-history'])

const search = ref('')
const loading = ref(false)
const equipos = ref([])
const total = ref(0)
const options = ref({ page: 1, itemsPerPage: 30 })
let searchTimeout = null

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

// ── Carga server-side (paginación + búsqueda en el backend) ──
const loadItems = () => {
  loading.value = true
  InventoryDataService.getAll({
    page: options.value.page,
    page_size: options.value.itemsPerPage,
    search: search.value || undefined,
  }).then(response => {
    equipos.value = response.data.results ?? response.data ?? []
    total.value = response.data.count ?? equipos.value.length
  }).catch(() => {
    Swal.fire('Error', 'No se pudieron cargar los equipos.', 'error')
  }).finally(() => { loading.value = false })
}

const onPageChange = (nuevaPagina) => {
  options.value.page = nuevaPagina
  loadItems()
}

const onItemsPerPageChange = (nuevoTamano) => {
  options.value.itemsPerPage = nuevoTamano
  options.value.page = 1
  loadItems()
}

// Búsqueda con debounce (vuelve a página 1)
watch(search, () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    options.value.page = 1
    loadItems()
  }, 350)
})

const getStatusText = (val) => {
  const status = statusOptions.find(s => s.value === val)
  return status ? status.text : 'Desconocido'
}

const getStatusColor = (val) => {
  const status = statusOptions.find(s => s.value === val)
  return status ? status.color : 'grey'
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
        Swal.fire({ toast: true, position: 'top-end', showConfirmButton: false, timer: 2200, icon: 'success', title: 'Equipo eliminado' })
      }).catch((e) => {
        const msg = e.response?.data?.detail || 'No se pudo eliminar'
        Swal.fire('No se pudo eliminar', msg, 'error')
      })
    }
  })
}

// El padre puede pedir refrescar tras crear/editar (server-side: recargamos la página actual).
const updateRow = () => loadItems()
const addRow = () => { options.value.page = 1; loadItems() }

onMounted(() => {
  loadItems()
})

defineExpose({ loadItems, updateRow, addRow })
</script>
