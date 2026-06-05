<template>
  <v-container fluid class="down-top-padding pa-0">
    <v-card variant="flat" class="border rounded-lg mb-4 pa-2 elevation-0">
      <v-text-field
        v-model="search"
        append-inner-icon="mdi-magnify"
        label="Buscar laboratorio por nombre o código..."
        single-line
        hide-details
        variant="outlined"
        density="compact"
        @update:model-value="applyFilters"
      />
    </v-card>

    <table-loading-overlay :loading="loading_list" :isEmpty="labs.length === 0">
      <v-data-table-server
        :headers="headers"
        :items="labs"
        :items-length="total_labs"
        :loading="loading_list"
        item-value="id"
        class="elevation-0 rounded-lg tabla-mejorada bg-surface"
        style="border: 1px solid rgba(0,0,0,0.12);"
        v-model:page="options.page"
        v-model:items-per-page="options.itemsPerPage"
        hide-default-footer
      >
        <template v-slot:bottom>
          <fluent-pagination
            :page="options.page"
            :itemsPerPage="options.itemsPerPage"
            :totalItems="total_labs"
            @update:page="onPageChange"
            @update:itemsPerPage="onItemsPerPageChange"
          />
        </template>

        <template v-slot:item.actions="{ item }">
          <v-icon class="d-inline" @click="openEditDialog(item)">mdi-pencil</v-icon>
          <v-icon class="d-inline ml-2" color="accent" @click="deleteLabConfirm(item)">mdi-delete</v-icon>
        </template>
      </v-data-table-server>
    </table-loading-overlay>

    <lab-form-dialog v-model="dialogOpen" :lab="selectedLab" @reloadListComponent="retrieveAllLabs" />
  </v-container>
</template>

<script setup>
import { ref, onMounted, defineAsyncComponent } from 'vue'

import Swal from 'sweetalert2'
import LabDataService from '@/services/labs/labDataService'
import LabMappers from '@/mappers/labMappers'
import FluentPagination from '@/components/commonComponents/FluentPagination.vue'
import { useAppStore } from '@/stores/appStore'
import TableLoadingOverlay from '@/components/commonComponents/TableLoadingOverlay.vue'

const LabFormDialog = defineAsyncComponent(() => import('@/views/labs/components/LabFormDialog.vue'))


const appStore = useAppStore()



const headers = [
  { title: 'Nombre', key: 'name', align: 'start', width: '50%' },
  { title: 'Código', key: 'code', sortable: false, width: '30%' },
  { title: 'Opciones', key: 'actions', sortable: false, align: 'center', width: '20%' },
]

const labs = ref([])
const total_labs = ref(0)
const loading_list = ref(false)
const options = ref({ page: 1, itemsPerPage: 30 })
const search = ref('')
const dialogOpen = ref(false)
const selectedLab = ref(null)

const retrieveAllLabs = () => {
  if (loading_list.value) return
  loading_list.value = true
  const pageSize = options.value.itemsPerPage > 0 ? options.value.itemsPerPage : 100000
  LabDataService.getFiltered(options.value.page, pageSize, search.value || '')
    .then((response) => {
      labs.value = response.data.results.map(LabMappers.getMap)
      total_labs.value = response.data.count
    })
    .catch(() => {})
    .finally(() => {
      loading_list.value = false
    })
}

const applyFilters = () => {
  if (loading_list.value) return
  options.value.page = 1
  retrieveAllLabs()
}

const onPageChange = (newPage) => {
  if (loading_list.value) return
  options.value.page = newPage
  retrieveAllLabs()
}

const onItemsPerPageChange = (newItemsPerPage) => {
  if (loading_list.value) return
  options.value.itemsPerPage = newItemsPerPage
  options.value.page = 1
  retrieveAllLabs()
}

const deleteLab = (lab) => {
  LabDataService.delete(lab.id).then((response) => {
    if (response.status === 204) {
      Swal.fire(appStore.successDeletedOptions).then(() => {
        const index = labs.value.findIndex(l => l.id === lab.id)
        if (index !== -1) labs.value.splice(index, 1)
      })
    }
  }).catch(() => {
    Swal.fire(appStore.errorDeleteOptions)
  })
}

const openEditDialog = (lab) => {
  selectedLab.value = lab
  dialogOpen.value = true
}

const deleteLabConfirm = (lab) => {
  Swal.fire(appStore.deleteConfirmOptions).then((result) => {
    if (result.isConfirmed) {
      deleteLab(lab)
    }
  })
}

const openAddDialog = () => {
  selectedLab.value = null
  dialogOpen.value = true
}

onMounted(() => {
  retrieveAllLabs()
})

defineExpose({ retrieveAllLabs, openAddDialog })
</script>

<style scoped>
.tabla-mejorada.v-data-table-server {
  border: 1px solid var(--v-border-color);
  border-radius: 8px;
  overflow: hidden;
}
</style>