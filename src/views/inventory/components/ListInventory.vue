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
        <filter-pill
          :active="expedienteFilter === 'sin'"
          color="warning"
          icon="mdi-certificate-outline"
          tooltip="Equipos sin certificado vinculado"
          @click="toggleSinExpediente"
        >Sin certificado</filter-pill>

        <filter-pill
          :active="vencidoFilter"
          color="error"
          icon="mdi-calendar-alert"
          tooltip="Certificado con más de 1 año (necesita recalibración)"
          @click="toggleVencido"
        >Certificado vencido</filter-pill>

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
            v-model:page="options.page"
            v-model:itemsPerPage="options.itemsPerPage"
            :totalItems="total"
          />
        </template>

        <template v-slot:item.photo="{ item }">
          <equipment-photo :foto="item.foto" abre @abrir="verFotos(item.id)" />
        </template>

        <template v-slot:item.internal_id="{ item }">
          <equipment-code :codigo="item.internal_id" :estado="estadoDe(item)" :detalle="detalleDe(item)" />
        </template>

        <template v-slot:item.latest_certificate="{ item }">
          <equipment-certificate :certificado="item.latest_certificate" @abrir="editItem(item, 1)" />
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
                <v-icon size="small">mdi-delete</v-icon>
              </v-btn>
            </template>
            <span>Eliminar equipo</span>
          </v-tooltip>
        </template>
      </v-data-table-server>
    </table-loading-overlay>

    <state-legend titulo="Estados del equipo:" :estados="ESTADOS_DE_EQUIPO" />

    <photo-viewer ref="visor" />
  </v-container>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { Toast } from '@/plugins/alerts'

import Swal from 'sweetalert2'
import InventoryDataService from '@/services/inventory/inventoryDataService'
import { mensajeDeError } from '@/utils/errors'
import { debounce } from '@/utils/debounce'
import { ESTADOS_DE_EQUIPO, estadoDe } from '@/utils/equipments/estado'
import { leerPagina, porPagina } from '@/utils/pagination'
import { useEquipmentPhotos } from '@/composables/useEquipmentPhotos'
import { useLatestRequest } from '@/composables/useLatestRequest'
import { usePage } from '@/composables/usePage'
import { useRouteFilters } from '@/composables/useRouteFilters'
import FluentPagination from '@/components/commonComponents/FluentPagination.vue'
import TableLoadingOverlay from '@/components/commonComponents/TableLoadingOverlay.vue'
import EquipmentCertificate from '@/components/shared/EquipmentCertificate.vue'
import EquipmentCode from '@/components/shared/EquipmentCode.vue'
import EquipmentPhoto from '@/components/shared/EquipmentPhoto.vue'
import FilterPill from '@/components/shared/FilterPill.vue'
import PhotoViewer from '@/components/shared/PhotoViewer.vue'
import StateLegend from '@/components/shared/StateLegend.vue'

const emit = defineEmits(['edit-item', 'view-history'])

const search = ref('')
const loading = ref(false)
const puedeEliminar = ref(false)   // permiso 1007 (Eliminar Equipos) o admin
const equipos = ref([])
const total = ref(0)
const { opciones: options, alInicio } = usePage(() => loadItems())

const headers = [
  { title: '', key: 'photo', sortable: false, width: '64px', align: 'center' },
  { title: 'Código', key: 'internal_id' },
  { title: 'Nombre del Equipo', key: 'name' },
  { title: 'Marca', key: 'brand' },
  { title: 'Modelo', key: 'model' },
  { title: 'N° Serie', key: 'series' },
  { title: 'Certificado', key: 'latest_certificate', sortable: false },
  { title: 'Acciones', key: 'actions', sortable: false, align: 'end' },
]

// Filtros (estilo Ordenes: 2 pildoras rapidas + Estado en avanzados)
const mostrarFiltrosAvanzados = ref(false)
const estadoFilter = ref(null)          // null | 1..4
const expedienteFilter = ref(null)      // null | 'sin'
const vencidoFilter = ref(false)

const estadoFilterOptions = [1, 2, 3, 4].map(value => ({ text: ESTADOS_DE_EQUIPO[value].texto, value }))

const toggleSinExpediente = () => { expedienteFilter.value = expedienteFilter.value === 'sin' ? null : 'sin' }
const toggleVencido = () => { vencidoFilter.value = !vencidoFilter.value }

// ── Carga server-side (paginación + búsqueda en el backend) ──
const { begin: beginLoad, isLatest: isLatestLoad } = useLatestRequest()

const loadItems = () => {
  loading.value = true
  const token = beginLoad()   // guard de secuencia: gana la carga más reciente
  InventoryDataService.getAll({
    ...porPagina(options.value.page, options.value.itemsPerPage),
    search: search.value || undefined,
    status: estadoFilter.value || undefined,
    expediente: expedienteFilter.value || undefined,
    vencido: vencidoFilter.value ? 1 : undefined,
  }).then(response => {
    if (!isLatestLoad(token)) return
    const pagina = leerPagina(response.data)
    equipos.value = pagina.filas
    total.value = pagina.total
  }).catch(() => {
    Swal.fire('Error', 'No se pudieron cargar los equipos.', 'error')
  }).finally(() => { if (isLatestLoad(token)) loading.value = false })
}

// Una notificacion de expediente llega con ?buscar=<id interno>.
useRouteFilters(({ buscar }) => {
  search.value = buscar || ''
  estadoFilter.value = null
  expedienteFilter.value = null
  vencidoFilter.value = false
})
watch([search, estadoFilter, expedienteFilter, vencidoFilter], debounce(alInicio))

const detalleDe = (item) => [estadoDe(item).texto, item.current_rental?.client_name, item.current_rental?.order_number]
  .filter(Boolean).join(' · ')

const { visor, verFotos } = useEquipmentPhotos()

// tab: 0 = Datos y Fotos, 1 = Certificado.
const editItem = (item, tab = 0) => {
  emit('edit-item', item, tab)
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
        Swal.fire('No se pudo eliminar', mensajeDeError(e, 'No se pudo eliminar el equipo.'), 'error')
      })
    }
  })
}

// El back avisa al crear, editar o eliminar equipos y al alquilar o devolver.
const onWsReloadInventory = () => { loadItems() }

onMounted(() => {
  const user = JSON.parse(localStorage.getItem('user')) || {}
  const isAdmin = user.kind !== undefined && user.kind < 1
  puedeEliminar.value = isAdmin || (user.action_permissions || []).includes(1007)
  loadItems()
  window.addEventListener('wss-reload-inventory', onWsReloadInventory)
})
onUnmounted(() => {
  window.removeEventListener('wss-reload-inventory', onWsReloadInventory)
})

defineExpose({ loadItems })
</script>
