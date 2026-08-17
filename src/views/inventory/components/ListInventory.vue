<template>
  <v-container fluid class="down-top-padding pa-0">
    <!-- FILTROS (misma estructura que Ordenes/Certificados) -->
    <v-card variant="flat" class="border rounded-lg mb-4 pa-4 bg-surface">
      <div class="d-flex flex-wrap align-center" style="gap: 16px;">
        <v-text-field
          v-model="search"
          hide-details
          density="compact"
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          label="Buscar por ID, nombre o marca"
          clearable
          style="max-width: 260px;"
        />

        <v-divider vertical class="mx-2 d-none d-md-block" style="height: 32px;"></v-divider>

        <!-- Pildoras rapidas (mismo patron que "Sin factura" / "Falta pago" en Ordenes) -->
        <v-chip
          :color="expedienteFilter === 'sin' ? 'warning' : 'grey-darken-1'"
          class="font-weight-bold cursor-pointer transition-swing"
          @click="toggleSinExpediente"
        >
          <v-icon start size="small">mdi-certificate-outline</v-icon>
          Sin expediente
          <v-tooltip activator="parent" location="top">Equipos sin certificado vinculado</v-tooltip>
        </v-chip>

        <v-chip
          :color="vencidoFilter ? 'error' : 'grey-darken-1'"
          class="font-weight-bold cursor-pointer transition-swing"
          @click="toggleVencido"
        >
          <v-icon start size="small">mdi-calendar-alert</v-icon>
          Expediente vencido
          <v-tooltip activator="parent" location="top">Certificado con más de 1 año (necesita recalibración)</v-tooltip>
        </v-chip>

        <v-spacer></v-spacer>

        <v-btn
          :variant="mostrarFiltrosAvanzados ? 'tonal' : 'text'"
          color="primary"
          class="font-weight-bold text-none"
          @click="mostrarFiltrosAvanzados = !mostrarFiltrosAvanzados"
        >
          <v-icon start>{{ mostrarFiltrosAvanzados ? 'mdi-filter-minus' : 'mdi-filter-plus' }}</v-icon>
          {{ mostrarFiltrosAvanzados ? 'Ocultar Filtros' : 'Filtros Avanzados' }}
        </v-btn>
      </div>

      <v-expand-transition>
        <div v-show="mostrarFiltrosAvanzados">
          <v-divider class="my-4 border-opacity-25"></v-divider>
          <v-row dense>
            <v-col cols="12" md="4">
              <v-select
                v-model="estadoFilter"
                :items="estadoFilterOptions"
                item-title="text"
                item-value="value"
                label="Estado"
                prepend-inner-icon="mdi-list-status"
                clearable
                variant="outlined"
                density="compact"
                hide-details="auto"
              />
            </v-col>
          </v-row>
        </div>
      </v-expand-transition>
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

        <template v-slot:item.photo="{ item }">
          <v-avatar size="40" rounded="lg" color="grey-lighten-3" style="cursor: pointer;" @click="editItem(item, 0, !!(item.gallery && item.gallery.length))">
            <v-img v-if="item.gallery && item.gallery.length" :src="item.gallery[0].image" cover />
            <v-icon v-else size="20" color="grey-darken-1">mdi-toolbox-outline</v-icon>
            <v-tooltip activator="parent" location="top">{{ (item.gallery && item.gallery.length) ? 'Ver foto y editar' : 'Agregar fotos' }}</v-tooltip>
          </v-avatar>
        </template>

        <!-- ID + indicador de expediente (lleno = tiene, hueco = no). Hover: detalle -->
        <template v-slot:item.internal_id="{ item }">
          <div class="d-flex align-center" style="gap: 6px;">
            <strong>{{ item.internal_id }}</strong>
            <span class="d-inline-flex" style="cursor: pointer;" @click="editItem(item, 1)">
              <v-icon size="16" :color="certInfo(item).has ? 'primary' : 'grey-lighten-1'">
                {{ certInfo(item).has ? 'mdi-certificate' : 'mdi-certificate-outline' }}
              </v-icon>
              <v-tooltip activator="parent" location="top">
                <template v-if="certInfo(item).has">
                  <div>Expediente <strong>{{ certInfo(item).code }}</strong></div>
                  <div>Emitido {{ certInfo(item).emitido }} · Vence {{ certInfo(item).vence }}</div>
                  <div class="font-weight-bold">{{ certInfo(item).label }}</div>
                  <div class="text-caption mt-1" style="opacity:.8">Clic para editar el certificado</div>
                </template>
                <template v-else>
                  <div>Sin expediente</div>
                  <div class="text-caption mt-1" style="opacity:.8">Clic para vincular uno</div>
                </template>
              </v-tooltip>
            </span>
          </div>
        </template>

        <template v-slot:item.status="{ item }">
          <v-chip
            :color="getStatusColor(item.status)" size="small" variant="flat" class="text-white"
            :style="item.status === 2 ? 'cursor: pointer;' : ''"
            @click="item.status === 2 ? $emit('view-history', item) : null"
          >
            {{ getStatusText(item.status) }}
            <!-- Alquilado: el chip abre el historial de viajes; hover muestra empresa orden -->
            <template v-if="item.status === 2">
              <v-icon end size="14">mdi-account-arrow-right</v-icon>
              <v-tooltip activator="parent" location="top">
                <div v-if="item.current_rental">{{ item.current_rental.client_name }} · {{ item.current_rental.order_number }}</div>
                <div class="text-caption" style="opacity:.8">Clic: historial de viajes</div>
              </v-tooltip>
            </template>
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

          <v-tooltip v-if="puedeEliminar" location="top">
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
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { Toast } from '@/plugins/alerts'

import Swal from 'sweetalert2'
import InventoryDataService from '@/services/inventory/inventoryDataService'
import { useLatestRequest } from '@/composables/useLatestRequest'
import FluentPagination from '@/components/commonComponents/FluentPagination.vue'
import TableLoadingOverlay from '@/components/commonComponents/TableLoadingOverlay.vue'

const emit = defineEmits(['edit-item', 'view-history'])

const search = ref('')
const loading = ref(false)
const puedeEliminar = ref(false)   // permiso 1007 (Eliminar Equipos) o admin
const equipos = ref([])
const total = ref(0)
const options = ref({ page: 1, itemsPerPage: 30 })
let searchTimeout = null

const headers = [
  { title: '', key: 'photo', sortable: false, width: '64px', align: 'center' },
  { title: 'ID Interno', key: 'internal_id' },
  { title: 'Nombre del Equipo', key: 'name' },
  { title: 'Marca', key: 'brand' },
  { title: 'Modelo', key: 'model' },
  { title: 'N° Serie', key: 'series' },
  { title: 'Estado', key: 'status', align: 'center' },
  { title: 'Acciones', key: 'actions', sortable: false, align: 'end' },
]

// Filtros (estilo Ordenes: 2 pildoras rapidas + Estado en avanzados)
const mostrarFiltrosAvanzados = ref(false)
const estadoFilter = ref(null)          // null | 1..4
const expedienteFilter = ref(null)      // null | 'sin'
const vencidoFilter = ref(false)

const estadoFilterOptions = [
  { text: 'Disponible', value: 1 },
  { text: 'Alquilado', value: 2 },
  { text: 'Mantenimiento', value: 3 },
  { text: 'Baja', value: 4 },
]

const toggleSinExpediente = () => { expedienteFilter.value = expedienteFilter.value === 'sin' ? null : 'sin' }
const toggleVencido = () => { vencidoFilter.value = !vencidoFilter.value }

const statusOptions = [
  { text: 'Disponible', value: 1, color: 'green' },
  { text: 'Alquilado', value: 2, color: 'orange-darken-2' },
  { text: 'Mantenimiento', value: 3, color: 'blue' },
  { text: 'Baja', value: 4, color: 'grey' },
]

// ── Carga server-side (paginación + búsqueda en el backend) ──
const { begin: beginLoad, isLatest: isLatestLoad } = useLatestRequest()

const loadItems = () => {
  loading.value = true
  const token = beginLoad()   // guard de secuencia: gana la carga más reciente
  InventoryDataService.getAll({
    page: options.value.page,
    page_size: options.value.itemsPerPage,
    search: search.value || undefined,
    status: estadoFilter.value || undefined,
    expediente: expedienteFilter.value || undefined,
    vencido: vencidoFilter.value ? 1 : undefined,
  }).then(response => {
    if (!isLatestLoad(token)) return
    equipos.value = response.data.results ?? response.data ?? []
    total.value = response.data.count ?? equipos.value.length
  }).catch(() => {
    Swal.fire('Error', 'No se pudieron cargar los equipos.', 'error')
  }).finally(() => { if (isLatestLoad(token)) loading.value = false })
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

// Cualquier filtro recarga de inmediato (vuelve a pagina 1)
watch([estadoFilter, expedienteFilter, vencidoFilter], () => {
  options.value.page = 1
  loadItems()
})

const getStatusText = (val) => {
  const status = statusOptions.find(s => s.value === val)
  return status ? status.text : 'Desconocido'
}

const getStatusColor = (val) => {
  const status = statusOptions.find(s => s.value === val)
  return status ? status.color : 'grey'
}

// Info del expediente para el icono + tooltip (vence = emision + 1 ano).
const certInfo = (item) => {
  const c = item.latest_certificate
  if (!c || !c.registry_code) return { has: false }
  const info = { has: true, code: c.registry_code, emitido: c.emission_date || '—', vence: '—', label: 'VIGENTE' }
  if (c.emission_date) {
    const emis = new Date(c.emission_date)
    if (!isNaN(emis.getTime())) {
      const v = new Date(emis)
      v.setFullYear(v.getFullYear() + 1)
      info.vence = v.toISOString().slice(0, 10)
      const hoy = new Date()
      hoy.setHours(0, 0, 0, 0)
      const dias = Math.round((v - hoy) / 86400000)
      if (dias < 0) info.label = 'VENCIDO'
      else if (dias <= 30) info.label = 'POR VENCER'
    }
  }
  return info
}

// tab: 0 = Datos y Fotos, 1 = Certificado. viewer: abrir el visor de imagenes.
const editItem = (item, tab = 0, viewer = false) => {
  emit('edit-item', item, tab, viewer)
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
        Toast.fire({ timer: 2200, icon: 'success', title: 'Equipo eliminado' })
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

// Recarga inteligente por WebSocket (igual que orders/certificates): el back
// dispara RELOAD_INVENTORY al crear/editar/eliminar equipos y al alquilar/devolver.
const onWsReloadInventory = () => { loadItems() }

// Busqueda enlazada: al hacer clic en una notificacion de expediente, la ruta
// trae ?buscar=<id interno> -> lo ponemos en la busqueda (aqui y si cambia estando
// ya en la pestana). El watch(search) recarga la tabla.
const route = useRoute()
watch(() => route.query.buscar, (v) => { if (v) search.value = String(v) })

onMounted(() => {
  const user = JSON.parse(localStorage.getItem('user')) || {}
  const isAdmin = user.kind !== undefined && user.kind < 1
  puedeEliminar.value = isAdmin || (user.action_permissions || []).includes(1007)
  if (route.query.buscar) search.value = String(route.query.buscar)
  loadItems()
  window.addEventListener('wss-reload-inventory', onWsReloadInventory)
})
onUnmounted(() => {
  window.removeEventListener('wss-reload-inventory', onWsReloadInventory)
})

defineExpose({ loadItems, updateRow, addRow })
</script>
