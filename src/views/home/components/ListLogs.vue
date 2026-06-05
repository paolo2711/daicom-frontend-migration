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
    <div class="d-flex justify-space-between px-4 pb-2">
      <v-btn @click="viewLatest" variant="text" color="primary" :disabled="page === 1">
        <v-icon start>mdi-skip-previous</v-icon> Volver a hoy
      </v-btn>
      <v-btn @click="viewMore" :loading="loading_more_logs" variant="text" color="primary" :disabled="total/page_size <= page">
        Cargar anteriores <v-icon end>mdi-arrow-down</v-icon>
      </v-btn>
    </div>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import Swal from "sweetalert2"
import LogDataService from "@/services/logs/logDataService"
import LogMappers from "@/mappers/logMappers"
import { useAppStore } from '@/stores/appStore'

const appStore = useAppStore()

// Variables reactivas (Data)
const logs = ref([])
const page = ref(1)
const page_size = ref(10)
const total = ref(0)
const loading_more_logs = ref(false)

// Métodos
const retrieveLogs = () => {
  LogDataService.getFiltered(page.value, page_size.value).then((response) => {
    logs.value = response.data.results.map(LogMappers.getMap)
    total.value = response.data.count
  }).catch(() => {
    // Apuntamos al estado mapeado en tu appStore de Pinia
    Swal.fire(appStore.networkErrorOptions || appStore.NetworkErrorOptions).then()
  }).finally(() => {
    loading_more_logs.value = false
  })
}

// Iconos limpios para la línea de tiempo
const getActionIcon = (action) => {
  if (action.includes('POST')) return 'mdi-plus'
  if (action.includes('PUT') || action.includes('PATCH')) return 'mdi-pencil'
  if (action.includes('DELETE')) return 'mdi-delete'
  if (action.includes('GET')) return 'mdi-eye'
  return 'mdi-check'
}

// Colores corporativos (Actualizados a la sintaxis con guiones de Vuetify 3)
const getActionColor = (action) => {
  if (action.includes('POST')) return 'blue-darken-1' 
  if (action.includes('PUT') || action.includes('PATCH')) return 'teal-darken-1' 
  if (action.includes('DELETE')) return 'red-darken-1' 
  if (action.includes('GET')) return 'blue-grey-lighten-1' 
  return 'grey'
}

const viewMore = () => {
  loading_more_logs.value = true
  let max_page_size = Number(total.value / page_size.value)
  if (max_page_size > page.value) {
    page.value++
    retrieveLogs()
  } else {
    loading_more_logs.value = false
  }
}

const viewLatest = () => {
  page.value = 1
  retrieveLogs()
}

// Ciclo de vida (Created -> onMounted)
onMounted(() => {
  retrieveLogs()
})
</script>

<style scoped>
/* Evitar sombras extrañas en los puntos del timeline - ESTILO ORIGINAL MANTENIDO */
:deep(.v-timeline-item__dot) {
  box-shadow: none !important;
}
</style>