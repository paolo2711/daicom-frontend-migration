<template>
  <v-container fluid class="down-top-padding pa-0">
    <!-- FILTROS (misma estructura que Ordenes/Certificados) -->
    <v-card variant="flat" class="border rounded-lg mb-4 pa-4 bg-surface">
      <div class="d-flex flex-wrap align-center ga-4">
        <v-text-field
          v-model="search"
          hide-details
          density="compact"
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          label="Buscar por ID, nombre o marca"
          clearable
          style="max-width: 16.25rem;"
        />

        <v-divider vertical class="mx-2 d-none d-md-block" style="height: 2rem;"></v-divider>

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
        @contextmenu:row="alClickDerecho"
        :row-props="({ item }) => ({ class: { 'fila-en-menu': estaEnElMenu(item) } })"
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

        <template v-slot:item.acciones="{ item }">
          <v-btn icon="mdi-dots-vertical" variant="text" density="comfortable" color="grey-darken-1"
                 @click.stop="alBotonDeFila($event, item)" />
        </template>
      </v-data-table-server>
    </table-loading-overlay>

    <state-legend titulo="Estados del equipo:" :estados="ESTADOS_DE_EQUIPO" />

    <photo-viewer ref="visor" />
    <action-menu v-model:menu="menu" :acciones="accionesDe(menu.filas)"
                 @accion="clave => ejecutarAccion(clave, menu.filas)" />
  </v-container>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'
import Swal from 'sweetalert2'
import InventoryDataService from '@/services/inventory/inventoryDataService'
import { debounce } from '@/utils/debounce'
import { ESTADOS_DE_EQUIPO, estadoDe } from '@/utils/equipments/estado'
import { leerPagina, porPagina } from '@/utils/pagination'
import { useEquipmentPhotos } from '@/composables/useEquipmentPhotos'
import { useInventoryActions } from '@/composables/useInventoryActions'
import { useLatestRequest } from '@/composables/useLatestRequest'
import { usePage } from '@/composables/usePage'
import { useRouteFilters } from '@/composables/useRouteFilters'
import FluentPagination from '@/components/commonComponents/FluentPagination.vue'
import TableLoadingOverlay from '@/components/commonComponents/TableLoadingOverlay.vue'
import EquipmentCertificate from '@/components/shared/EquipmentCertificate.vue'
import EquipmentCode from '@/components/shared/EquipmentCode.vue'
import EquipmentPhoto from '@/components/shared/EquipmentPhoto.vue'
import ActionMenu from '@/components/shared/ActionMenu.vue'
import FilterPill from '@/components/shared/FilterPill.vue'
import PhotoViewer from '@/components/shared/PhotoViewer.vue'
import StateLegend from '@/components/shared/StateLegend.vue'

const emit = defineEmits(['edit-item', 'view-history'])

const search = ref('')
const loading = ref(false)
const equipos = ref([])
const total = ref(0)
const { opciones: options, alInicio } = usePage(() => loadItems())

const headers = [
  { title: '', key: 'photo', sortable: false, width: '4rem', align: 'center' },
  { title: 'Código', key: 'internal_id' },
  { title: 'Nombre del Equipo', key: 'name' },
  { title: 'Marca', key: 'brand' },
  { title: 'Modelo', key: 'model' },
  { title: 'N° Serie', key: 'series' },
  { title: 'Certificado', key: 'latest_certificate', sortable: false },
  { title: 'Opciones', key: 'acciones', align: 'center', sortable: false },
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

const { menu, alClickDerecho, alBotonDeFila, estaEnElMenu, accionesDe, ejecutarAccion } = useInventoryActions(equipos, {
  editar: editItem, verHistorial: (item) => emit('view-history', item), alEliminar: loadItems,
})

// El back avisa al crear, editar o eliminar equipos y al alquilar o devolver.
const onWsReloadInventory = () => { loadItems() }

onMounted(() => {
  loadItems()
  window.addEventListener('wss-reload-inventory', onWsReloadInventory)
})
onUnmounted(() => {
  window.removeEventListener('wss-reload-inventory', onWsReloadInventory)
})

defineExpose({ loadItems })
</script>
