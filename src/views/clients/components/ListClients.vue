<template>
  <v-container fluid class="down-top-padding pa-0">

    <v-card variant="flat" class="border rounded-lg mb-4 pa-2 elevation-0">
      <v-text-field
        v-model="search"
        append-inner-icon="mdi-magnify"
        label="Buscar cliente por nombre o documento..."
        single-line
        hide-details
        variant="outlined"
        density="compact"
        @update:model-value="applyFilters"
      />
    </v-card>

    <table-loading-overlay :loading="loading_list" :isEmpty="clients.length === 0">
      <v-data-table-server
        :headers="headers"
        :items="clients"
        :items-length="total_clients"
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
            :totalItems="total_clients"
            @update:page="onPageChange"
            @update:itemsPerPage="onItemsPerPageChange"
          />
        </template>

        <template v-slot:item.actions="{ item }">
          <v-icon class="d-inline" @click="openEditDialog(item)">mdi-pencil</v-icon>
          <v-icon class="d-inline ml-2" color="accent" @click="deleteClientConfirm(item)">mdi-delete</v-icon>
        </template>

      </v-data-table-server>
    </table-loading-overlay>

  <client-form-dialog v-model="dialogOpen" :client="selectedClient" @reloadListComponent="retrieveAllClients" />

  </v-container>
</template>

<script setup>
import { ref, watch, onMounted, getCurrentInstance, defineAsyncComponent } from 'vue'

import Swal from 'sweetalert2'
import ClientDataService from '@/services/clients/clientDataService'
import ClientMappers from '@/mappers/clientMappers'
import FluentPagination from '@/components/commonComponents/FluentPagination.vue'
import { useAppStore } from '@/stores/appStore'
import TableLoadingOverlay from '@/components/commonComponents/TableLoadingOverlay.vue'

const ClientFormDialog = defineAsyncComponent(() => import('@/views/clients/components/ClientFormDialog.vue'))


const appStore = useAppStore()



const headers = [
  { title: 'Razón social', key: 'name', align: 'start' },
  { title: 'Tipo Doc.', key: 'documentType_name', sortable: false },
  { title: 'N° Documento', key: 'document', sortable: false },
  { title: 'Teléfono', key: 'phone', sortable: false },
  { title: 'Email', key: 'email', sortable: false },
  { title: 'Opciones', key: 'actions', sortable: false },
]

const clients = ref([])
const total_clients = ref(0)
const loading_list = ref(false)
const options = ref({ page: 1, itemsPerPage: 15 })
const search = ref('')
const dialogOpen = ref(false)
const selectedClient = ref(null)

const retrieveAllClients = () => {
  if (loading_list.value) return
  loading_list.value = true
  const pageSize = options.value.itemsPerPage > 0 ? options.value.itemsPerPage : 100000
  ClientDataService.getFiltered(options.value.page, pageSize, search.value || '')
    .then((response) => {
      clients.value = response.data.results.map(ClientMappers.getMap)
      total_clients.value = response.data.count
    })
    .finally(() => {
      loading_list.value = false
    })
}

const applyFilters = () => {
  if (loading_list.value) return
  options.value.page = 1
  retrieveAllClients()
}
const onPageChange = (newPage) => {
  if (loading_list.value) return
  options.value.page = newPage
  retrieveAllClients()
}

const onItemsPerPageChange = (newItemsPerPage) => {
  if (loading_list.value) return
  options.value.itemsPerPage = newItemsPerPage
  options.value.page = 1
  retrieveAllClients()
}


const deleteClient = (client) => {
  ClientDataService.delete(client.id).then((response) => {
    if (response.status === 204) {
      Swal.fire(appStore.successDeletedOptions).then(() => {
        const index = clients.value.findIndex(c => c.id === client.id)
        if (index !== -1) clients.value.splice(index, 1)
      })
    }
  }).catch(() => {
    Swal.fire(appStore.errorDeleteOptions)
  })
}

const openEditDialog = (client) => {
  selectedClient.value = client
  dialogOpen.value = true
}

const deleteClientConfirm = (client) => {
  Swal.fire(appStore.deleteConfirmOptions).then((result) => {
    if (result.isConfirmed) {
      deleteClient(client)
    }
  })
}

onMounted(() => {
  retrieveAllClients()
})

const openAddDialog = () => {
  selectedClient.value = null
  dialogOpen.value = true
}

defineExpose({ retrieveAllClients, openAddDialog })
</script>

<style scoped>
.tabla-mejorada.v-data-table-server {
  border: 1px solid var(--v-border-color);
  border-radius: 8px;
  overflow: hidden;
}
</style>