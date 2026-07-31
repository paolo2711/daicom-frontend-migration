<template>
  <v-container class="pa-0">
    <v-timeline class="pt-4 px-4">
      <v-timeline-item
        v-for="(log, i) in logs"
        :key="i"
        :dot-color="getActionColor(log.action)"
        size="small"
        fill-dot
        :icon="getActionIcon(log.action)"
        icon-color="white"
      >
        <template v-slot:opposite>
          <span class="text-subtitle-2 text-medium-emphasis font-weight-medium">
            <v-icon size="small" class="me-2" color="grey">mdi-clock-outline</v-icon>
            {{ log.log_date }} &bull; {{ log.log_time }}
          </span>
        </template>

        <v-card variant="flat" class="border rounded-lg elevation-0 pa-4">
          <div class="d-flex align-center mb-2">
            <v-icon size="small" start color="primary">mdi-account</v-icon>
            <span class="text-subtitle-1 font-weight-bold text-uppercase text-high-emphasis" style="letter-spacing: 0.5px;">
              {{ log.user_data.username }}
            </span>
          </div>
          
          <div class="text-body-1 text-high-emphasis" style="line-height: 1.5;">
            {{ log.description }}
          </div>
        </v-card>
      </v-timeline-item>
    </v-timeline>

    <v-divider class="mt-4 mb-3"></v-divider>
    <div class="px-4 pb-2">
      <fluent-pagination
        :page="page"
        :itemsPerPage="page_size"
        :totalItems="total"
        @update:page="onPageChange"
        @update:itemsPerPage="onItemsPerPageChange"
      />
    </div>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import Swal from "sweetalert2"
import LogDataService from "@/services/logs/logDataService"
import LogMappers from "@/mappers/logMappers"
import { useAppStore } from '@/stores/appStore'
import FluentPagination from '@/components/commonComponents/FluentPagination.vue'

const appStore = useAppStore()

const logs = ref([])
const page = ref(1)
const page_size = ref(10)
const total = ref(0)

const retrieveLogs = () => {
  LogDataService.getFiltered(page.value, page_size.value).then((response) => {
    logs.value = response.data.results.map(LogMappers.getMap)
    total.value = response.data.count
  }).catch(() => {
    Swal.fire(appStore.networkErrorOptions)
  })
}

const getActionIcon = (action) => {
  if (action.includes('POST')) return 'mdi-plus'
  if (action.includes('PUT') || action.includes('PATCH')) return 'mdi-pencil'
  if (action.includes('DELETE')) return 'mdi-delete-outline'
  if (action.includes('GET')) return 'mdi-eye'
  return 'mdi-check'
}

const getActionColor = (action) => {
  if (action.includes('POST')) return 'blue-darken-1' 
  if (action.includes('PUT') || action.includes('PATCH')) return 'teal-darken-1' 
  if (action.includes('DELETE')) return 'red-darken-1' 
  if (action.includes('GET')) return 'blue-grey-lighten-1' 
  return 'grey'
}

const onPageChange = (nuevaPagina) => {
  page.value = nuevaPagina
  retrieveLogs()
}

const onItemsPerPageChange = (nuevoTamano) => {
  page_size.value = nuevoTamano
  page.value = 1
  retrieveLogs()
}

onMounted(() => {
  retrieveLogs()
})
</script>

<style scoped>
/* Sin sombra en los puntos del timeline */
:deep(.v-timeline-item__dot) {
  box-shadow: none !important;
}
</style>