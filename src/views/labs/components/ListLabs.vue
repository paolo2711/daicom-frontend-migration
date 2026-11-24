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
        @update:model-value="alInicio"
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
        v-model:page="options.page"
        v-model:items-per-page="options.itemsPerPage"
        hide-default-footer
      >
        <template v-slot:bottom>
          <fluent-pagination
            v-model:page="options.page"
            v-model:itemsPerPage="options.itemsPerPage"
            :totalItems="total_labs"
          />
        </template>

        <template v-slot:item.actions="{ item }">
          <v-tooltip location="bottom">
            <template v-slot:activator="{ props }">
              <v-btn v-bind="props" icon variant="text" density="comfortable" @click="openEditDialog(item)">
                <v-icon>mdi-pencil</v-icon>
              </v-btn>
            </template>
            <span>Editar Laboratorio</span>
          </v-tooltip>

          <v-tooltip location="bottom" color="error">
            <template v-slot:activator="{ props }">
              <v-btn v-bind="props" icon color="red-darken-2" variant="text" density="comfortable" @click="deleteLabConfirm(item)">
                <v-icon>mdi-delete</v-icon>
              </v-btn>
            </template>
            <span>Eliminar Laboratorio</span>
          </v-tooltip>
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
import { useLatestRequest } from '@/composables/useLatestRequest'
import { usePage } from '@/composables/usePage'
import FluentPagination from '@/components/commonComponents/FluentPagination.vue'
import { useAppStore } from '@/stores/appStore'
import TableLoadingOverlay from '@/components/commonComponents/TableLoadingOverlay.vue'
import { leerPagina } from '@/utils/pagination'

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
const { opciones: options, alInicio } = usePage(() => retrieveAllLabs())
const search = ref('')
const dialogOpen = ref(false)
const selectedLab = ref(null)

const { begin: beginLoad, isLatest: isLatestLoad } = useLatestRequest()

const retrieveAllLabs = () => {
  loading_list.value = true
  const token = beginLoad()   // guard de secuencia: gana la carga más reciente
  LabDataService.getFiltered(options.value.page, options.value.itemsPerPage, search.value || '')
    .then((response) => {
      if (!isLatestLoad(token)) return
      const pagina = leerPagina(response.data)
      labs.value = pagina.filas.map(LabMappers.getMap)
      total_labs.value = pagina.total
    })
    .catch(() => {})
    .finally(() => {
      if (isLatestLoad(token)) loading_list.value = false
    })
}


const deleteLab = (lab) => {
  LabDataService.delete(lab.id).then((response) => {
    if (response.status === 204) {
      const index = labs.value.findIndex(l => l.id === lab.id)
      if (index !== -1) labs.value.splice(index, 1)
      Swal.fire(appStore.successDeletedOptions)
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

defineExpose({ openAddDialog })
</script>
