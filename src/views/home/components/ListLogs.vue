<template>
  <div>
    <div v-for="(log, i) in logs" :key="i" class="log-row">
      <span class="log-ic" :class="'ntone-' + tono(log.action)">
        <v-icon size="16">{{ icono(log.action) }}</v-icon>
      </span>
      <div class="log-body">
        <div class="log-text">
          <strong>{{ log.user_data.username }}</strong> {{ log.description }}
        </div>
        <div class="log-time">{{ log.log_date }} · {{ log.log_time }}</div>
      </div>
    </div>

    <div v-if="logs.length === 0" class="text-center py-8 text-medium-emphasis">
      <v-icon size="36" color="grey">mdi-history</v-icon>
      <div class="mt-2 text-body-2">Todavia no hay actividad</div>
    </div>

    <v-divider v-if="logs.length" />
    <div v-if="logs.length" class="px-3 py-2">
      <fluent-pagination
        :page="page"
        :itemsPerPage="page_size"
        :totalItems="total"
        @update:page="onPageChange"
        @update:itemsPerPage="onItemsPerPageChange"
      />
    </div>
  </div>
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

const icono = (action) => {
  if (action.includes('POST')) return 'mdi-plus'
  if (action.includes('PUT') || action.includes('PATCH')) return 'mdi-pencil'
  if (action.includes('DELETE')) return 'mdi-delete-outline'
  return 'mdi-eye'
}

// Reusa los tonos del sistema (scss/notifications.scss) para que la actividad
// se vea de la misma familia que las notificaciones.
const tono = (action) => {
  if (action.includes('POST')) return 'blue'
  if (action.includes('PUT') || action.includes('PATCH')) return 'teal'
  if (action.includes('DELETE')) return 'crit'
  return 'indigo'
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
/* Lista densa: antes era un v-timeline con tarjetas alternadas que dejaba
   huecos enormes y se veia mal en una columna. */
.log-row {
  display: flex;
  align-items: flex-start;
  gap: 0.7rem;
  padding: 0.6rem 1rem;
  border-bottom: 1px solid rgba(128, 128, 128, 0.12);
}
.log-row:last-of-type { border-bottom: none; }
.log-ic {
  flex: 0 0 auto;
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--ntone-bg);
  color: var(--ntone-fg);
  margin-top: 0.1rem;
}
.log-body { min-width: 0; flex: 1; }
.log-text { font-size: 0.85rem; line-height: 1.35; }
.log-time {
  font-size: 0.72rem;
  color: rgba(128, 128, 128, 0.95);
  margin-top: 0.1rem;
}
</style>
