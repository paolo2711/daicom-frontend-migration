<template>
  <div>
    <!-- FILTROS (mismo padding y estructura que ListCertificates) -->
    <v-card variant="flat" class="border rounded-lg mb-4 pa-4 bg-surface">
      <div class="d-flex flex-wrap align-center" style="gap: 16px;">
        
        <v-text-field
          v-model="filter_order"
          hide-details
          density="compact"
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          label="Buscar Nro Orden"
          clearable
          style="max-width: 220px;"
          @update:model-value="applyFilters"
        />

        <v-text-field
          v-model="filter_correlative"
          hide-details
          density="compact"
          prepend-inner-icon="mdi-certificate"
          variant="outlined"
          label="Nro Certificado"
          clearable
          style="max-width: 220px;"
          @update:model-value="applyFilters"
        />

        <v-divider vertical class="mx-2 d-none d-md-block" style="height: 32px;"></v-divider>

        <v-badge
          :model-value="appStore.pendingPaymentsServiceCount > 0"
          :content="appStore.pendingPaymentsServiceCount"
          color="error"
          offset-x="4"
          offset-y="4"
        >
          <v-chip
            :color="(appStore.pendingPaymentsCount > 0 && !filtro_falta_pago) ? 'grey-darken-1' : (filtro_falta_pago ? 'error' : 'grey-darken-1')"
            class="font-weight-bold cursor-pointer transition-swing"
            @click="toggleFiltroPago"
          >
            <v-icon start size="small">mdi-cash-remove</v-icon>
            Falta Pago
            <v-tooltip activator="parent" location="top">Filtrar órdenes facturadas pero sin abonos</v-tooltip>
          </v-chip>
        </v-badge>

        <v-badge
          :model-value="appStore.pendingInvoicesServiceCount > 0"
          :content="appStore.pendingInvoicesServiceCount"
          color="warning"
          offset-x="4"
          offset-y="4"
        >
          <v-chip
            :color="(appStore.pendingInvoicesCount > 0 && !filtro_sin_factura) ? 'grey-darken-1' : (filtro_sin_factura ? 'warning' : 'grey-darken-1')"
            class="font-weight-bold cursor-pointer transition-swing"
            @click="toggleFiltroFactura"
          >
            <v-icon start size="small">mdi-file-document-remove-outline</v-icon>
            Sin Emitir Factura
            <v-tooltip activator="parent" location="top">Filtrar órdenes abiertas pendientes de facturar</v-tooltip>
          </v-chip>
        </v-badge>

        <v-badge
          :model-value="filtro_detraccion && appStore.afectasDetraccionServiceCount > 0"
          :content="appStore.afectasDetraccionServiceCount"
          color="deep-orange"
          offset-x="4"
          offset-y="4"
        >
          <v-chip
            :color="filtro_detraccion ? 'deep-orange' : 'grey-darken-1'"
            class="font-weight-bold cursor-pointer transition-swing"
            @click="toggleFiltroDetraccion"
          >
            <v-icon start size="small">mdi-bank-outline</v-icon>
            Detracción
            <v-tooltip activator="parent" location="top">Filtrar órdenes afectas a detracción SUNAT</v-tooltip>
          </v-chip>
        </v-badge>

        <v-spacer></v-spacer>

        <v-btn 
          :variant="mostrar_filtros_avanzados ? 'tonal' : 'text'" 
          color="primary"
          class="font-weight-bold text-none"
          @click="mostrar_filtros_avanzados = !mostrar_filtros_avanzados"
        >
          <v-icon start>{{ mostrar_filtros_avanzados ? 'mdi-filter-minus' : 'mdi-filter-plus' }}</v-icon>
          {{ mostrar_filtros_avanzados ? 'Ocultar Filtros' : 'Filtros Avanzados' }}
        </v-btn>
      </div>

      <v-expand-transition>
        <div v-show="mostrar_filtros_avanzados">
          <v-divider class="my-4 border-opacity-25"></v-divider>
          <v-row dense>
            <v-col cols="12" md="4">
              <v-menu v-model="menu_fechas" :close-on-content-click="false" location="bottom">
                <template v-slot:activator="{ props }">
                  <v-text-field
                    v-bind="props"
                    :model-value="textoRangoFechas"
                    label="Rango de Fechas"
                    prepend-inner-icon="mdi-calendar-range"
                    variant="outlined"
                    density="compact"
                    readonly
                    clearable
                    @click:clear="limpiarFechas"
                    hide-details="auto"
                    class="cursor-pointer"
                  ></v-text-field>
                </template>
                <v-card class="pa-4 elevation-4 border rounded-lg" min-width="320">
                  <div class="text-caption font-weight-bold text-medium-emphasis mb-3">Seleccione el periodo:</div>
                  <v-row dense>
                    <v-col cols="12" sm="6">
                      <date-picker :date="filter_date_gt" label="Desde:" @setPickedDate="(value) => filter_date_gt = value" />
                    </v-col>
                    <v-col cols="12" sm="6">
                      <date-picker :date="filter_date_lt" label="Hasta:" @setPickedDate="(value) => filter_date_lt = value" />
                    </v-col>
                  </v-row>
                  <div class="d-flex justify-end mt-4">
                    <v-btn color="primary" variant="tonal" size="small" class="font-weight-bold" @click="menu_fechas = false; applyFilters()">Aplicar</v-btn>
                  </div>
                </v-card>
              </v-menu>
            </v-col>

            <v-col cols="12" md="4">
              <v-autocomplete
                v-model="filter_client_id"
                :loading="loading_clients"
                prepend-inner-icon="mdi-account-group"
                :items="clients"
                v-model:search="search_client"
                @update:model-value="applyFilters"
                item-title="name"
                item-value="id"
                placeholder="Buscar cliente..."
                no-data-text="No se encontraron clientes"
                clearable
                variant="outlined"
                density="compact"
                hide-details="auto"
                label="Cliente"
              />
            </v-col>

            <v-col cols="12" md="4">
              <v-select
                v-model="filter_status"
                prepend-inner-icon="mdi-list-status"
                :items="order_statuses"
                item-title="name"
                item-value="id"
                clearable
                variant="outlined"
                density="compact"
                hide-details="auto"
                label="Estado"
                @update:model-value="applyFilters"
              />
            </v-col>
          </v-row>
        </div>
      </v-expand-transition>
    </v-card>

    <table-loading-overlay :loading="loading_list" :isEmpty="orders.length === 0">
      <v-data-table-server
        v-model:expanded="expanded"
        :headers="headers"
        :items="orders"
        :items-length="total_orders"
        :loading="loading_list"
        show-expand
        single-expand
        item-value="id"
        class="elevation-0 rounded-lg tabla-mejorada bg-surface"
        style="border: 1px solid rgba(0,0,0,0.12);"
        v-model:page="options.page"
        v-model:items-per-page="options.itemsPerPage"
        hide-default-footer
        @click:row="manejarClicFila"
      >
        <template v-slot:bottom>
          <fluent-pagination
            v-model:page="options.page"
            v-model:itemsPerPage="options.itemsPerPage"
            :totalItems="total_orders"
          />
        </template>

        <template v-slot:item.client_data.name="{ item }">
          <span :class="item.status === 4 ? 'anulado-atenuado' : ''">{{ item.client_data.name }}</span>
        </template>

        <template v-slot:item.status="{ item }">
          <div class="d-flex justify-center">
            <v-chip :color="getStatusOrderColor(item)" size="small" class="text-white font-weight-medium" style="width: 100px; justify-content: center;">
              {{ getStatusOrderLabel(item) }}
            </v-chip>
          </div>
        </template>

        <template v-slot:item.progress="{ item }">
          <div v-if="item.status !== 4 && item.certificates && getProgreso(item).total > 0" class="mx-auto" style="width: 100px;">
            <div class="text-caption mb-1 font-weight-medium text-center" :class="theme.global.current.value.dark ? 'text-grey-lighten-1' : 'text-grey-darken-2'">
              {{ getProgreso(item).listos }} / {{ getProgreso(item).total }} Equipos
            </div>
            <v-progress-linear
              :model-value="(getProgreso(item).listos / getProgreso(item).total) * 100"
              height="5"
              rounded
              color="primary"
              bg-color="grey"
              bg-opacity="0.15"
            />
          </div>
          <span v-else class="text-grey">---</span>
        </template>

        <template v-slot:item.cobros="{ item }">
          <div class="d-flex align-center mx-auto" style="width: 190px;">
            <div class="text-left" style="width: 100px;">
              <template v-if="item.payments && item.payments.length > 0">
                <div class="font-weight-medium body-2 mb-n1" :class="item.status === 4 ? 'text-grey' : (theme.global.current.value.dark ? 'text-grey-lighten-2' : 'text-grey-darken-3')">
                  S/ {{ totalPagos(item) }}
                </div>
                <div class="caption text-grey">
                  {{ item.payments.length }} {{ item.payments.length === 1 ? 'abono' : 'abonos' }}
                </div>
              </template>
              <template v-else>
                <div class="font-weight-medium body-2 text-grey" :class="theme.global.current.value.dark ? 'text--darken-1' : 'text--lighten-1'">
                  ---
                </div>
              </template>
            </div>

            <div class="d-flex justify-end" style="width: 90px;">
              <v-tooltip location="bottom">
                <template v-slot:activator="{ props }">
                  <span v-bind="props" class="d-inline-block">
                    <v-btn
                      icon
                      :color="item.status === 4 ? 'grey-lighten-2' : ((item.invoices?.length > 0 || item.wants_invoice === false) ? 'primary' : 'grey')"
                      :disabled="item.status === 4"
                      variant="text"
                      density="comfortable"
                      @click="abrirFactura(item)"
                    >
                      <v-icon>{{ item.wants_invoice === false ? 'mdi-file-document-remove-outline' : (item.invoices?.length > 0 ? 'mdi-file-document-check' : 'mdi-file-document-plus') }}</v-icon>
                    </v-btn>
                  </span>
                </template>
                <span>{{ item.wants_invoice === false ? 'Sin Comprobante (Ver)' : (item.invoices?.length > 0 ? 'Ver/Editar Factura' : 'Subir Factura') }}</span>              </v-tooltip>

              <v-tooltip location="bottom">
                <template v-slot:activator="{ props }">
                  <span v-bind="props" class="d-inline-block">
                    <v-btn
                      icon
                      :color="item.status === 4 ? 'grey-lighten-2' : (item.sent || (item.payments && item.payments.length > 0) ? 'primary' : 'grey')"
                      :disabled="item.status === 4"
                      variant="text"
                      density="comfortable"
                      @click="abrirPago(item)"
                    >
                      <v-icon>{{ item.sent || (item.payments && item.payments.length > 0) ? 'mdi-cash-check' : 'mdi-cash-plus' }}</v-icon>
                    </v-btn>
                  </span>
                </template>
                <span>{{ item.sent || (item.payments && item.payments.length > 0) ? 'Ver/Editar Pagos' : 'Registrar Pago' }}</span>
              </v-tooltip>
            </div>
          </div>
        </template>

        <template v-slot:item.detraccion="{ item }">
          <div class="d-flex justify-center">
            <template v-if="item.detraccion && item.detraccion.afecto">
              <v-chip 
                size="small" 
                color="deep-orange" 
                variant="tonal" 
                class="font-weight-bold px-3 text-caption"
              >
                S/ {{ item.detraccion.monto.toFixed(2) }}
                <v-tooltip activator="parent" location="top">
                  Detracción {{ item.detraccion.tasa }}% · SUNAT
                </v-tooltip>
              </v-chip>
            </template>
            <span v-else class="text-caption text-grey">—</span>
          </div>
        </template>


        <template v-slot:item.created_at="{ item }">
          <span :class="item.status === 4 ? 'text-grey' : ''">
            {{ item.created_at ? item.created_at.substring(0, 10) : '---' }}
          </span>
        </template>

        <template v-slot:item.actions="{ item }">
          <v-tooltip location="bottom" color="primary">
            <template v-slot:activator="{ props }">
              <v-btn
                v-bind="props"
                icon
                :disabled="item.status === 4"
                variant="text"
                density="comfortable"
                @click="abrirEditarOrden(item)"
              >
                <v-icon>mdi-pencil</v-icon>
              </v-btn>
            </template>
            <span>Editar Cliente</span>
          </v-tooltip>

          <v-tooltip location="bottom" color="error" v-if="hasPermission(13) && item.status !== 4">
            <template v-slot:activator="{ props }">
              <v-btn
                v-bind="props"
                icon
                color="red-darken-2"
                variant="text"
                density="comfortable"
                @click="anularOrderConfirm(item)"
              >
                <v-icon>mdi-delete-outline</v-icon>
              </v-btn>
            </template>
            <span>Anular Orden Completa</span>
          </v-tooltip>
        </template>

        <template v-slot:expanded-row="{ columns, item }">
          <tr class="fila-activa">
            <td :colspan="columns.length" class="pa-0">
              <table-service-details
                :order="item"
                @reload="retrieveOrders"
                @add-extra="prepareExtraEquipment(item)"
                @edit-certificate="openCertificateModal"
              />
            </td>
          </tr>
        </template>
      </v-data-table-server>
    </table-loading-overlay>

    <!-- MODALES (ya migrados) -->
    <dialog-factura v-model="factura_modal" :order="selected_order" @updateOrder="updateSingleOrderInList" @close="factura_modal = false" />
    <dialog-liquidacion v-model="liquidacion_modal" :order="selected_order" @updateOrder="updateSingleOrderInList" @close="liquidacion_modal = false" />
    <edit-order v-model="edit_order_modal" :order="selected_order" @updateOrder="updateSingleOrderInList" @close="edit_order_modal = false" />
    <add-extra-equipment v-model="dialog_extra" :order="selected_order" @close="dialog_extra = false" @reload="retrieveOrders" />
    <certificate-modal ref="certificateModalRef" @updateCertificate="retrieveOrders" @reloadListComponent="retrieveOrders" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useTheme } from 'vuetify'
import { useAppStore } from '@/stores/appStore'
import Swal from 'sweetalert2'
import OrderDataService from '@/services/certificates/orderDataService'
import CertificateDataService from '@/services/certificates/certificateDataService'
import ClientDataService from '@/services/clients/clientDataService'
import ClientMappers from '@/mappers/clientMappers'
import { usePaginatedSearch } from '@/composables/usePaginatedSearch'
import FluentPagination from '@/components/commonComponents/FluentPagination.vue'
import DatePicker from '@/components/commonComponents/DatePicker.vue'
import DialogFactura from './DialogFactura.vue'
import DialogLiquidacion from './DialogLiquidacion.vue'
import EditOrder from './EditOrder.vue'
import AddExtraEquipment from './AddExtraEquipment.vue'
import TableServiceDetails from './TableServiceDetails.vue'
import TableLoadingOverlay from '@/components/commonComponents/TableLoadingOverlay.vue'
import CertificateModal from '@/views/certificates/components/CertificateModal.vue'

const theme = useTheme()
const route = useRoute()
const appStore = useAppStore()

// Nuevos estados UI de Filtros Avanzados y Chips
const mostrar_filtros_avanzados = ref(false)
const menu_fechas = ref(false)
const filtro_falta_pago = ref(false)
const filtro_sin_factura = ref(false)
const filtro_detraccion = ref(false)

// Texto computado para el calendario elegante
const textoRangoFechas = computed(() => {
  if (!filter_date_gt.value && !filter_date_lt.value) return 'Cualquier fecha'
  if (filter_date_gt.value && !filter_date_lt.value) return `Desde el ${filter_date_gt.value}`
  if (!filter_date_gt.value && filter_date_lt.value) return `Hasta el ${filter_date_lt.value}`
  return `${filter_date_gt.value} al ${filter_date_lt.value}`
})

// Estados de modales
const edit_order_modal = ref(false)
const dialog_extra = ref(false)
const factura_modal = ref(false)
const liquidacion_modal = ref(false)
const selected_order = ref(null)
const certificateModalRef = ref(null)

const openCertificateModal = (cert) => {
  certificateModalRef.value?.open(cert)
}

// Headers
const headers = [
  { title: 'Nro Orden', key: 'order_number' },
  { title: 'Cliente', key: 'client_data.name' },
  { title: 'Estado', key: 'status', align: 'center', sortable: false },
  { title: 'Progreso', key: 'progress', align: 'center', sortable: false },
  { title: 'Cobros', key: 'cobros', align: 'center', sortable: false },
  { title: 'Detracción', key: 'detraccion', align: 'center', sortable: false },
  { title: 'F. Agregado', key: 'created_at', sortable: false },
  { title: 'Opciones', key: 'actions', align: 'center', sortable: false },
  { title: '', key: 'data-table-expand' },
]

// Datos de tabla
const orders = ref([])
const expanded = ref([])

// Forzar expansión única y cargar el detalle pesado (Lazy Loading)
watch(expanded, (newVal) => {
  if (newVal.length > 1) {
    expanded.value = [newVal[newVal.length - 1]]
  }
  
  if (expanded.value.length === 1) {
    const orderId = expanded.value[0]
    OrderDataService.get(orderId).then(response => {
      if (response && response.data) {
        updateSingleOrderInList(response.data)
      }
    }).catch(() => {})
  }
})
const total_orders = ref(0)
const loading_list = ref(false)
const options = ref({ page: 1, itemsPerPage: 30 })

// Filtros
const filter_order = ref('')
const filter_correlative = ref('')
const filter_client_id = ref(null)
const filter_date_gt = ref('')
const filter_date_lt = ref('')
const filter_status = ref('')
const order_statuses = [
  { id: 1, name: 'Abierta' },
  { id: 2, name: 'Facturada' },
  { id: 3, name: 'Pagada' },
  { id: 4, name: 'Anulada' },
]

// Clientes
const { 
  items: clients, 
  loading: loading_clients, 
  searchQuery: search_client, 
  retrieveData: retrieveClientes 
} = usePaginatedSearch(
  (page, size, query) => ClientDataService.getFiltered(page, size, query),
  ClientMappers.getMap,
  () => filter_client_id.value
)

// Usuario y permisos
const user = JSON.parse(localStorage.getItem('user')) || {}
const is_admin = user.kind !== undefined && user.kind < 1
const user_permissions = user.action_permissions || []

// Control de peticiones y Anti-DDoS para Resúmenes
const pendingRequest = ref(false)
let debounceTimeout = null

// Funciones de filtro
const applyFilters = () => {
  if (pendingRequest.value) return
  options.value.page = 1
  retrieveOrders()
  cargarResumenes() // Sincroniza las píldoras cada vez que filtras
}

const toggleFiltroPago = () => {
  filtro_falta_pago.value = !filtro_falta_pago.value
  applyFilters()
}

const toggleFiltroFactura = () => {
  filtro_sin_factura.value = !filtro_sin_factura.value
  applyFilters()
}

const toggleFiltroDetraccion = () => {
  filtro_detraccion.value = !filtro_detraccion.value
  applyFilters()
}

const cargarResumenes = () => {
  OrderDataService.getPendingPaymentsSummary(1, filter_client_id.value, filter_order.value, filter_correlative.value, filter_date_gt.value, filter_date_lt.value).then((res) => {
    appStore.setPendingPaymentsServiceCount(res.data.pending_payments)
  }).catch(() => {})
  
  OrderDataService.getPendingInvoicesSummary(1, filter_client_id.value, filter_order.value, filter_correlative.value, filter_date_gt.value, filter_date_lt.value).then((res) => {
    appStore.setPendingInvoicesServiceCount(res.data.pending_invoices)
  }).catch(() => {})

  if (filtro_detraccion.value) {
    OrderDataService.getAfectasDetraccionSummary(1, filter_client_id.value, filter_order.value, filter_correlative.value, filter_date_gt.value, filter_date_lt.value).then((res) => {
      appStore.setAfectasDetraccionServiceCount(res.data.afectas_detraccion)
    }).catch(() => {})
  } else {
    appStore.setAfectasDetraccionServiceCount(0)
  }
}



const limpiarFechas = () => {
  filter_date_gt.value = ''
  filter_date_lt.value = ''
  applyFilters()
}



// Obtener órdenes
const retrieveOrders = () => {
  if (pendingRequest.value) return
  pendingRequest.value = true
  loading_list.value = true
  const limite = options.value.itemsPerPage > 0 ? options.value.itemsPerPage : 100000
  OrderDataService.getFiltered(
    options.value.page,
    limite,
    filter_client_id.value,
    filter_order.value,
    filter_correlative.value,
    filter_date_gt.value,
    filter_date_lt.value,
    filter_status.value,
    1,
    filtro_falta_pago.value,
    filtro_sin_factura.value,
    filtro_detraccion.value
  )
    .then((res) => {
      orders.value = res.data.results
      total_orders.value = res.data.count
    })
    .finally(() => {
      loading_list.value = false
      pendingRequest.value = false
    })
}

// Manejador centralizado de clics en la fila (UX de Expansión)
const manejarClicFila = (event, { item }) => {
  // Ignoramos el clic si el usuario hizo clic en un botón, chip, o en la propia flechita (Vuetify ya la maneja)
  if (event.target.closest('button') || event.target.closest('.v-btn') || event.target.closest('.v-chip') || event.target.closest('.v-data-table__expand-icon')) {
    return
  }
  
  // Dependiendo de la versión interna de Vuetify 3, el id puede venir directo o en raw
  const itemId = item.id || (item.raw && item.raw.id) || item.value
  
  if (expanded.value.includes(itemId)) {
    expanded.value = []
  } else {
    expanded.value = [itemId]
  }
}

// Helpers (exactamente igual que en legacy)
const getIconoPago = (m) => {
  if (m === 'EFECTIVO') return 'mdi-cash'
  if (m === 'BILLETERA') return 'mdi-cellphone-nfc'
  if (m === 'TRANSFERENCIA') return 'mdi-bank-transfer'
  return 'mdi-cash-register'
}

const getColorPago = (m) => {
  if (m === 'EFECTIVO') return 'green-darken-2'
  if (m === 'BILLETERA') return 'deep-purple-darken-1'
  if (m === 'TRANSFERENCIA') return 'blue-darken-2'
  return 'grey-darken-1'
}

const tieneFact = (o) => (o.invoices && o.invoices.length > 0) || o.wants_invoice === false

const getStatusOrderLabel = (o) => {
  const todosAnulados = o.certificates?.length > 0 && o.certificates.every(c => c.status === 5)
  if (o.status === 4 || todosAnulados) return 'Anulada'
  if (o.sent || o.payments?.length > 0) return 'Liquidada'
  if (tieneFact(o)) return 'Facturada'
  return 'En Proceso'
}
const getStatusOrderColor = (o) => {
  const todosAnulados = o.certificates?.length > 0 && o.certificates.every(c => c.status === 5)
  if (o.status === 4 || todosAnulados) return 'red-darken-2'
  if (o.sent || o.payments?.length > 0) return 'success'
  if (tieneFact(o)) return 'warning'
  return 'grey-darken-1'
}

const getProgreso = (o) => {
  if (!o.certificates) return { total: 0, listos: 0 }
  const v = o.certificates.filter(c => c.status !== 5)
  const l = v.filter(c => c.status === 4 || c.uploaded)
  return { total: v.length, listos: l.length }
}

const totalPagos = (o) => {
  if (!o.payments || !o.payments.length) return '0.00'
  const t = o.payments.reduce((acc, p) => acc + parseFloat(p.amount || 0), 0)
  return t.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const hasPermission = (id) => {
  if (is_admin) return true
  return user_permissions.includes(id)
}

// Acciones
const anularOrderConfirm = (order) => {
  Swal.fire({
    title: '¿Anular Orden y todos sus Equipos?',
    text: `Se invalidará la orden ${order.order_number}`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sí, anular todo'
  }).then((result) => {
    if (result.isConfirmed) {
      OrderDataService.patch(order.id, { status: 4 }).then(() => {
        Promise.all(order.certificates.map(c => CertificateDataService.patch(c.id, { status: 5 }))).then(() => {
          Swal.fire('Completado', 'Orden anulada.', 'success')
          if (window.notificarActualizacionFila) window.notificarActualizacionFila(null, order.id);
        })
      })
    }
  })
}

const prepareExtraEquipment = (o) => {
  selected_order.value = o
  dialog_extra.value = true
}

const abrirFactura = (i) => {
  selected_order.value = i
  factura_modal.value = true
}

const abrirPago = (i) => {
  selected_order.value = i
  liquidacion_modal.value = true
}

const abrirEditarOrden = (o) => {
  selected_order.value = o
  edit_order_modal.value = true
}

// WebSockets
const fetchAndInjectSingleOrder = (event) => {
  const orderId = event.detail
  OrderDataService.get(orderId)
    .then(response => {
      if (response && response.data) {
        if (response.data.order_type === 1 || !response.data.order_type) {
          updateSingleOrderInList(response.data)
          
          // Refrescar resúmenes agrupados (Debounce de 1.5s) para evitar DDoS
          clearTimeout(debounceTimeout)
          debounceTimeout = setTimeout(() => { cargarResumenes() }, 1500)
        }
      }
    })
    .catch(() => {})
}

const updateSingleOrderInList = (updatedOrder) => {
  const index = orders.value.findIndex(o => o.id === updatedOrder.id)
  if (index !== -1) {
    orders.value = [
      ...orders.value.slice(0, index),
      { ...orders.value[index], ...updatedOrder },
      ...orders.value.slice(index + 1)
    ]
  }
}

const handleWssReload = () => {
  retrieveOrders()
}

// Watchers (igual que en ListCertificates)
watch(options, () => { retrieveOrders() }, { deep: true })

// Quitamos filter_date_gt y filter_date_lt para que solo se apliquen con el botón "Aplicar"
watch([filter_order, filter_correlative, filter_client_id, filter_status], () => {
  applyFilters()
})

// Ciclo de vida
onMounted(() => {
  if (route.query.buscar_orden) {
    filter_order.value = route.query.buscar_orden
  }
  
  cargarResumenes() // Cargamos el número para el badge rojo
  retrieveClientes()
  retrieveOrders()
  window.addEventListener('wss-reload-orders-service', handleWssReload)
  window.addEventListener('wss-update-order-row', fetchAndInjectSingleOrder)
})

onUnmounted(() => {
  window.removeEventListener('wss-reload-orders-service', handleWssReload)
  window.removeEventListener('wss-update-order-row', fetchAndInjectSingleOrder)
})
</script>

<style lang="scss">
.tabla-mejorada.v-data-table-server {
  border: 1px solid var(--v-border-color);
  border-radius: 8px;
  overflow: hidden;
}

.v-theme--light .tabla-mejorada tbody tr td {
  border-bottom: 1px solid #BDBDBD !important;
}
.v-theme--dark .tabla-mejorada tbody tr td {
  border-bottom: 1px solid #616161 !important;
}

.v-theme--light .tabla-mejorada tbody tr.fila-activa,
.v-theme--light .tabla-mejorada tbody tr.v-data-table__expanded__content {
  background-color: #eeeeee !important;
}
.v-theme--dark .tabla-mejorada tbody tr.fila-activa,
.v-theme--dark .tabla-mejorada tbody tr.v-data-table__expanded__content {
  background-color: #333333 !important;
}

.tabla-mejorada tr.v-data-table__expanded__content .v-data-table {
  background-color: transparent !important;
}

/* --- UX: Filas Clickables --- */
.tabla-mejorada tbody tr {
  cursor: pointer;
  transition: background-color 0.2s ease;
}

/* Hover suave: Solo aplica a la fila principal, ignorando la tabla anidada desplegada */
.v-theme--light .tabla-mejorada tbody tr:not(.v-data-table__expanded__content):hover {
  background-color: rgba(0, 0, 0, 0.04) !important;
}
.v-theme--dark .tabla-mejorada tbody tr:not(.v-data-table__expanded__content):hover {
  background-color: rgba(255, 255, 255, 0.05) !important;
}

.anulado-atenuado {
  opacity: 0.25 !important;
  pointer-events: none;
}
</style>