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

        <v-text-field
          v-model="filter_invoice"
          hide-details
          density="compact"
          prepend-inner-icon="mdi-file-document-outline"
          variant="outlined"
          label="Nro Factura"
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

    <v-row class="mt-2 mx-0">
      <!-- COLUMNA IZQUIERDA: TABLA OPERATIVA (65% aprox) -->
      <v-col cols="12" :md="panel_expandido ? 0 : 8" v-show="!panel_expandido" class="pa-0 pr-md-2 transition-swing">
        <table-loading-overlay :loading="loading_list" :isEmpty="orders.length === 0">
          <v-data-table-server
            v-model="ordenes_seleccionadas"
            show-select
            return-object
            v-model:expanded="expanded"
            :headers="headers"
            :items="orders"
            :items-length="total_orders"
            :loading="loading_list"
            show-expand
            single-expand
            item-value="id"
        :hover="false"
        class="elevation-0 rounded-lg tabla-mejorada tabla-ordenes-servicio bg-surface"
        style="border: 1px solid rgba(0,0,0,0.12);"
        v-model:page="options.page"
        v-model:items-per-page="options.itemsPerPage"
        hide-default-footer
        @click:row="manejarClicFila"
        
        :row-props="(data) => ({ 
          class: isOrderExpanded(data.item) ? 'fila-padre-activa' : '' 
        })"
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

        <template v-slot:item.vinculo_financiero="{ item }">
          <div class="d-flex align-center justify-center">
            <v-tooltip location="bottom">
              <template v-slot:activator="{ props }">
                <v-btn
                  v-bind="props"
                  icon
                  variant="text"
                  density="compact"
                  :disabled="item.status === 4"
                  :color="getColorSemaforoFinanciero(item)"
                  @click.stop="seleccionarFacturaEnPanel(item)"
                >
                  <v-icon size="small">{{ getIconoSemaforoFinanciero(item) }}</v-icon>
                </v-btn>
              </template>
              <span class="font-weight-bold">{{ getTextoSemaforoFinanciero(item) }}</span>
            </v-tooltip>
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
                {{ getCurrencySymbol(item.detraccion.moneda) }} {{ item.detraccion.monto.toFixed(2) }}
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

          <v-tooltip location="bottom" color="error" v-if="hasPermission(1004) && item.status !== 4">
            <template v-slot:activator="{ props }">
              <v-btn
                v-bind="props"
                icon
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
                @request-signatures="abrirBatchModal"
              />
            </td>
          </tr>
        </template>
      </v-data-table-server>
    </table-loading-overlay>
      </v-col>

      <!-- COLUMNA DERECHA: PANEL DE FACTURAS (35% aprox) -->
      <v-col cols="12" :md="panel_expandido ? 12 : 4" class="pa-0 pl-md-2 transition-swing">
        <div class="panel-sticky-wrapper">
        <panel-facturas 
          :order_type="1"
          :ordenes_seleccionadas="ordenes_seleccionadas"
          :search="filter_invoice"
          :foco_order_id="foco_order_id"
          :foco_order_number="foco_order_number"
          v-model:expandido="panel_expandido"
          @recargar-ordenes="retrieveOrders"
          @limpiar-seleccion="ordenes_seleccionadas = []"
          @limpiar-busqueda="filter_invoice = ''; applyFilters()"
          @limpiar-foco-orden="foco_order_id = null; foco_order_number = ''"
          @filtrar-ordenes-por-factura="filter_invoice = $event; applyFilters()"
        />
        </div>
      </v-col>
    </v-row>

    <!-- Barra flotante de selección (componente común). El botón "Vincular" se
         quitó: al marcar órdenes el PanelFacturas ya entra en modo selección y
         tocar una factura ahí las vincula — el botón era redundante. -->
    <selection-bar
      :count="ordenes_seleccionadas.length"
      label="seleccionada(s)"
      @clear="ordenes_seleccionadas = []"
    >
      <v-btn variant="text" size="small" class="mx-1 font-weight-bold"
             prepend-icon="mdi-file-document-plus" @click="crearFacturaParaSeleccion">
        Facturar
      </v-btn>

      <v-btn v-if="ordenes_seleccionadas.length === 1 && !seleccion_tiene_factura_fiscal" variant="text" size="small" class="mx-1 font-weight-bold"
             :loading="marcando_sin_factura"
             :prepend-icon="seleccion_sin_factura ? 'mdi-file-document-check-outline' : 'mdi-file-remove-outline'"
             @click="seleccion_sin_factura ? requerirFactura() : marcarSinFactura()">
        {{ seleccion_sin_factura ? 'Requiere factura' : 'Sin comprobante' }}
      </v-btn>

      <v-btn v-if="hasPermission(1004)" variant="text" color="error" size="small" class="mx-1 font-weight-bold"
             prepend-icon="mdi-cancel" :loading="anulando" @click="anularSeleccion">
        Anular
      </v-btn>
    </selection-bar>

    <!-- MODALES -->
    <batch-action-modal ref="batchActionModalRef" @reloadListComponent="retrieveOrders" />

    <dialog-factura v-model="factura_modal" :order="selected_order" :orders="ordenes_factura_multi" :order_type="1" @updateOrder="onFacturaGuardada" @close="cerrarFacturaModal" />
    <edit-order v-model="edit_order_modal" :order="selected_order" @updateOrder="updateSingleOrderInList" @close="edit_order_modal = false" />
    <add-extra-equipment v-model="dialog_extra" :order="selected_order" @close="dialog_extra = false" @reload="retrieveOrders" />
    <certificate-modal ref="certificateModalRef" @updateCertificate="retrieveOrders" @reloadListComponent="retrieveOrders" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { Toast } from '@/plugins/alerts'
import { useRoute } from 'vue-router'
import { useTheme } from 'vuetify'
import { useAppStore } from '@/stores/appStore'
import Swal from 'sweetalert2'
import OrderDataService from '@/services/certificates/orderDataService'
import CertificateDataService from '@/services/certificates/certificateDataService'
import ClientDataService from '@/services/clients/clientDataService'
import ClientMappers from '@/mappers/clientMappers'
import OrderMappers from '@/mappers/orderMappers'
import { usePaginatedSearch } from '@/composables/usePaginatedSearch'
import { useLatestRequest } from '@/composables/useLatestRequest'
import FluentPagination from '@/components/commonComponents/FluentPagination.vue'
import DatePicker from '@/components/commonComponents/DatePicker.vue'
import SelectionBar from '@/components/commonComponents/SelectionBar.vue'
import DialogFactura from '../DialogFactura.vue'
import EditOrder from '../EditOrder.vue'
import AddExtraEquipment from '../AddExtraEquipment.vue'
import TableServiceDetails from './TableServiceDetails.vue'
import TableLoadingOverlay from '@/components/commonComponents/TableLoadingOverlay.vue'
import CertificateModal from '@/views/certificates/components/CertificateModal.vue'
import PanelFacturas from '../PanelFacturas.vue' // NUEVO COMPONENTE DE LA FASE 3
import { defineAsyncComponent } from 'vue'

const BatchActionModal = defineAsyncComponent(() => import('@/views/certificates/components/BatchActionModal.vue'))

const theme = useTheme()
const route = useRoute()
const appStore = useAppStore()

// Estado UI Split-Screen
const ordenes_seleccionadas = ref([])
const panel_expandido = ref(false)

// Nuevos estados UI de Filtros Avanzados y Chips
const mostrar_filtros_avanzados = ref(false)
const menu_fechas = ref(false)
const filtro_falta_pago = ref(false)
const filtro_sin_factura = ref(false)

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
const ordenes_factura_multi = ref(null) // órdenes para crear UNA factura por selección
const marcando_sin_factura = ref(false)
const selected_order = ref(null)
const certificateModalRef = ref(null)
const batchActionModalRef = ref(null)

const abrirBatchModal = (certs) => {
  if (batchActionModalRef.value) {
    batchActionModalRef.value.open('notify', certs)
  }
}

const openCertificateModal = (cert) => {
  certificateModalRef.value?.open(cert)
}

// Headers
const headers = [
  { title: 'Nro Orden', key: 'order_number' },
  { title: 'Cliente', key: 'client_data.name' },
  { title: 'Progreso', key: 'progress', align: 'center', sortable: false },
  { title: 'Estado Financiero', key: 'vinculo_financiero', align: 'center', sortable: false },
  //{ title: 'F. Agregado', key: 'created_at', sortable: false },
  { title: 'Opciones', key: 'actions', align: 'center', sortable: false },
  { title: '', key: 'data-table-expand' },
]

// Datos de tabla
const orders = ref([])
const expanded = ref([])

// --- LÓGICA DE EXPANSIÓN ROBUSTA (Resiliencia a return-object) ---
const getSafeId = (val) => {
  if (!val) return null
  return typeof val === 'object' ? (val.id || val.raw?.id || val.value) : val
}

const isOrderExpanded = (item) => {
  const targetId = getSafeId(item)
  return expanded.value.some(e => getSafeId(e) === targetId)
}

// Forzar expansión única y cargar el detalle pesado (Lazy Loading)
watch(expanded, (newVal) => {
  if (newVal.length > 1) {
    expanded.value = [newVal[newVal.length - 1]]
  }
  
  if (expanded.value.length === 1) {
    const orderId = getSafeId(expanded.value[0])
    if (!orderId) return

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
const filter_invoice = ref('')
const foco_order_id = ref(null)
const foco_order_number = ref('')

// Ver (foco) y seleccionar (vincular) son modos excluyentes. Al MARCAR órdenes
// (selección no vacía) soltamos el foco. Si la selección quedó vacía NO tocamos
// el foco: así no pisamos un foco recién puesto por el semáforo.
watch(ordenes_seleccionadas, (val) => {
  if (val.length > 0 && foco_order_id.value !== null) {
    foco_order_id.value = null
    foco_order_number.value = ''
  }
})
const filter_client_id = ref(null)
const filter_date_gt = ref('')
const filter_date_lt = ref('')
const filter_status = ref('')
// IDs según el backend (Order.OrderStatus): 4=Anulada, 5=Pagado. Antes estaban
// cruzados (4=Pagado/5=Anulada) → filtrar "Pagado" traía las Anuladas.
const order_statuses = [
  { id: 1, name: 'En Proceso' },
  { id: 2, name: 'Deuda' },
  { id: 3, name: 'Abonado' },
  { id: 5, name: 'Pagado' },
  { id: 6, name: 'Excedido' },
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

// Guard de secuencia (solo aplica la carga más reciente) + debounce de filtros.
const { begin: beginOrdersLoad, isLatest: isLatestOrdersLoad } = useLatestRequest()
let debounceTimeout = null

// Funciones de filtro
const applyFilters = () => {
  // Si el panel de facturas está maximizado, tapa la tabla: al filtrar lo
  // achicamos para que se vean los resultados.
  panel_expandido.value = false
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

const cargarResumenes = () => {
  OrderDataService.getPendingPaymentsSummary(1, filter_client_id.value, filter_order.value, filter_correlative.value, filter_date_gt.value, filter_date_lt.value, filter_invoice.value).then((res) => {
    appStore.setPendingPaymentsServiceCount(res.data.pending_payments)
  }).catch(() => {})
  
  OrderDataService.getPendingInvoicesSummary(1, filter_client_id.value, filter_order.value, filter_correlative.value, filter_date_gt.value, filter_date_lt.value, filter_invoice.value).then((res) => {
    appStore.setPendingInvoicesServiceCount(res.data.pending_invoices)
  }).catch(() => {})
}



const limpiarFechas = () => {
  filter_date_gt.value = ''
  filter_date_lt.value = ''
  applyFilters()
}



// Obtener órdenes
const retrieveOrders = () => {
  loading_list.value = true
  const token = beginOrdersLoad()   // guard de secuencia: gana la carga más reciente
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
    false,
    filter_invoice.value
  )
      .then((res) => {
        if (!isLatestOrdersLoad(token)) return   // llegó una carga más nueva → no pisar
        orders.value = res.data.results.map(orden => OrderMappers.getMap(orden))
        total_orders.value = res.data.count
      })
      .finally(() => {
        if (isLatestOrdersLoad(token)) loading_list.value = false
      })
}

// Manejador centralizado de clics en la fila (UX de Expansión)
const manejarClicFila = (event, { item }) => {
  // Ignoramos clics en elementos interactivos (Vuetify ya maneja el ícono de expansión)
  if (event.target.closest('button') || event.target.closest('.v-btn') || event.target.closest('.v-chip') || event.target.closest('.v-data-table__expand-icon')) {
    return
  }
  
  if (isOrderExpanded(item)) {
    expanded.value = []
  } else {
    // Al usar return-object, almacenamos el objeto completo para evitar conflictos de estado interno
    expanded.value = [item.raw || item]
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

const getCurrencySymbol = (currency) => {
  const symbols = { 'PEN': 'S/', 'USD': '$', 'EUR': '€' }
  return symbols[currency] || 'S/'
}

// --- LOGICA DEL SEMÁFORO FINANCIERO (VÍNCULO) ---
// Única columna financiera de la tabla: ya no hay un "Estado" aparte
// leyendo o.status crudo — ese campo queda congelado para órdenes
// facturadas desde que el pago vive en la Factura, no en la Orden
// (ver Order.estado_financiero en el backend). Todo sale de ahí.
// El estado sale ÚNICAMENTE de estado_financiero (que el backend calcula
// agregando las facturas de la orden). Los campos total_pagado/saldo_pendiente
// ya NO existen en la orden — usarlos daba siempre "pagado" por undefined.
// estado_financiero: 1=En Proceso, 2=Deuda, 3=Abonado, 4=Anulada, 5=Pagado, 6=Excedido
const getColorSemaforoFinanciero = (o) => {
  if (o.wants_invoice === false) {
    // Sin comprobante: verde si ya tiene abono (pagado), gris si aún no.
    return o.estado_financiero === 5 ? 'success' : 'grey-darken-2'
  }
  switch (o.estado_financiero) {
    case 4: return 'grey-darken-1'   // Anulada
    case 6: return 'blue-darken-1'   // Excedido
    case 5: return 'success'         // Pagado
    case 3: return 'warning'         // Abonado (parcial)
    case 2: return 'error'           // Deuda
    case 1:
    default: return 'grey'           // En proceso / sin factura
  }
}

const getIconoSemaforoFinanciero = (o) => {
  // Ícono único de trazo fino, adaptado al estado financiero
  if (o.wants_invoice === false) {
    return o.estado_financiero === 5 ? 'mdi-file-document-check-outline' : 'mdi-file-document-remove-outline'
  }
  switch (o.estado_financiero) {
    case 4: return 'mdi-file-document-remove-outline' // Anulada
    case 6: return 'mdi-file-document-alert-outline'  // Excedido
    case 5: return 'mdi-file-document-check-outline'  // Pagado
    case 3: return 'mdi-file-document-edit-outline'   // Abonado parcial
    case 2: return 'mdi-file-document-alert-outline'  // Deuda
    case 1:
    default: return 'mdi-file-document-outline'  // Libre / sin factura
  }
}

const getTextoSemaforoFinanciero = (o) => {
  if (o.wants_invoice === false) {
    return o.estado_financiero === 5 ? 'Sin comprobante · Pagado' : 'Sin comprobante · Sin abono aún'
  }
  const n = o.invoices ? o.invoices.length : 0
  const cuantas = n > 1 ? `${n} facturas` : (o.invoices[0]?.invoice_number || '')
  switch (o.estado_financiero) {
    case 4: return 'Orden anulada'
    case 6: return `Excedido (${cuantas})`
    case 5: return `Pagado (${cuantas})`
    case 3: return `Abono parcial (${cuantas})`
    case 2: return `Sin abonos / Deuda (${cuantas})`
    case 1:
    default: return 'Sin factura — clic para ver'
  }
}

// Clic en el semáforo: si la orden tiene factura(s), enfoca el panel en
// TODAS ellas (por order_id, no por número — así una orden con 2+ facturas
// las muestra todas). Si está libre, la selecciona para vincular.
const seleccionarFacturaEnPanel = (o) => {
  // Siempre "ver": enfoca las facturas de esta orden (toggle). Para vincular
  // se usa el checkbox, no este botón. Al enfocar soltamos cualquier selección
  // (ver y vincular son excluyentes) para que el panel no quede en modo vincular.
  if (foco_order_id.value === o.id) {
    foco_order_id.value = null
    foco_order_number.value = ''
  } else {
    if (ordenes_seleccionadas.value.length > 0) ordenes_seleccionadas.value = []
    foco_order_id.value = o.id
    foco_order_number.value = o.order_number
  }
}

// "FACTURAR LOTE": crea UNA factura y la reparte automáticamente entre
// todas las órdenes marcadas (partes iguales, sin pedirte nada). Si es
// "CREAR FACTURA": abre DialogFactura para crear una factura nueva.
// Con 1 orden marcada la crea y vincula directo. Con varias, por ahora
// se crea sobre la primera y las demás se vinculan luego con VINCULAR
// (crear-factura-multi vive en la limpieza pendiente de DialogFactura).
// "CREAR FACTURA" desde la barra: una sola factura para TODAS las órdenes
// marcadas. Deben compartir moneda (el backend exige lo mismo al vincular).
const crearFacturaParaSeleccion = () => {
  const ordenes = ordenes_seleccionadas.value
  if (ordenes.length === 0) return
  // La moneda ya no depende de la orden: se elige en el diálogo de la factura.
  selected_order.value = null
  ordenes_factura_multi.value = [...ordenes]
  factura_modal.value = true
}

// Marca las órdenes seleccionadas como "no requiere comprobante". Vive en la
// barra (antes estaba en el header del panel, que mutaba de tamaño).
const marcarSinFactura = async () => {
  const ordenes = ordenes_seleccionadas.value
  if (ordenes.length === 0) return
  const r = await Swal.fire({
    title: '¿Sin comprobante?',
    html: `Se marcarán <b>${ordenes.length}</b> ${ordenes.length === 1 ? 'orden' : 'órdenes'} como "no requiere factura". Elige la moneda de su registro interno de abonos:`,
    icon: 'question',
    input: 'select',
    inputOptions: { PEN: 'Soles (S/)', USD: 'Dólares ($)' },
    inputValue: 'PEN',
    showCancelButton: true,
    confirmButtonText: 'Sí, sin factura', cancelButtonText: 'Cancelar',
  })
  if (!r.isConfirmed) return
  const currency = r.value || 'PEN'
  marcando_sin_factura.value = true
  try {
    for (const o of ordenes) {
      await OrderDataService.patch(o.id, { wants_invoice: false, currency })
    }
    Toast.fire({ timer: 2200, icon: 'success', title: 'Marcadas sin factura' })
    ordenes_seleccionadas.value = []
    // El WS refresca las filas de las órdenes afectadas.
  } catch (err) {
    const d = err.response?.data
    const msg = d?.wants_invoice?.[0] || d?.detail || 'No se pudo marcar alguna orden.'
    Swal.fire('No se pudo', msg, 'error')
  } finally {
    marcando_sin_factura.value = false
  }
}

// El botón de la barra es contextual: si TODAS las órdenes marcadas ya están
// "sin comprobante", ofrece re-activar; si no, ofrece marcarlas sin comprobante.
const seleccion_sin_factura = computed(() =>
  ordenes_seleccionadas.value.length > 0 &&
  ordenes_seleccionadas.value.every(o => o.wants_invoice === false)
)

// ¿La orden seleccionada ya tiene una factura fiscal? Entonces no se puede
// marcar sin comprobante (el botón se oculta).
const seleccion_tiene_factura_fiscal = computed(() =>
  ordenes_seleccionadas.value.length === 1 &&
  (ordenes_seleccionadas.value[0].invoices || []).some(f => f.es_fiscal)
)

// Re-activa "requiere comprobante". El backend (perform_update) descarta la
// factura interna vacía al pasar wants_invoice a true.
const requerirFactura = async () => {
  const ordenes = ordenes_seleccionadas.value
  if (ordenes.length === 0) return
  const r = await Swal.fire({
    title: '¿Requiere comprobante?',
    html: `Se marcarán <b>${ordenes.length}</b> ${ordenes.length === 1 ? 'orden' : 'órdenes'} como que SÍ requieren factura. Si tenían un contenedor de abonos vacío, se descarta.`,
    icon: 'question', showCancelButton: true,
    confirmButtonText: 'Sí, requiere factura', cancelButtonText: 'Cancelar',
  })
  if (!r.isConfirmed) return
  marcando_sin_factura.value = true
  try {
    for (const o of ordenes) {
      await OrderDataService.patch(o.id, { wants_invoice: true })
    }
    Toast.fire({ timer: 2200, icon: 'success', title: 'Marcadas: requieren factura' })
    ordenes_seleccionadas.value = []
  } catch (err) {
    const d = err.response?.data
    const msg = d?.wants_invoice?.[0] || d?.detail || 'No se pudo actualizar alguna orden.'
    Swal.fire('No se pudo', msg, 'error')
  } finally {
    marcando_sin_factura.value = false
  }
}

// ------------------------------------------------

// Guardado de factura desde el diálogo. En multi limpiamos la selección; en
// single refrescamos su fila. En ambos casos el WS refresca fila(s) y panel.
const onFacturaGuardada = (payload) => {
  if (ordenes_factura_multi.value) {
    ordenes_seleccionadas.value = []
  } else if (payload && payload.id) {
    updateSingleOrderInList(payload)
  }
}
const cerrarFacturaModal = () => {
  factura_modal.value = false
  ordenes_factura_multi.value = null
}

const getProgreso = (o) => {
  if (!o.certificates) return { total: 0, listos: 0 }
  const v = o.certificates.filter(c => c.status !== 5)
  const l = v.filter(c => c.status === 4 || c.uploaded)
  return { total: v.length, listos: l.length }
}

const hasPermission = (id) => {
  if (is_admin) return true
  return user_permissions.includes(id)
}

// Acciones
const anulando = ref(false)
const anularSeleccion = async () => {
  const ordenes = ordenes_seleccionadas.value
  if (ordenes.length === 0) return
  const r = await Swal.fire({
    title: `¿Anular ${ordenes.length} ${ordenes.length === 1 ? 'orden' : 'órdenes'}?`,
    text: 'Se invalidarán las órdenes marcadas y sus equipos.',
    icon: 'warning', showCancelButton: true, confirmButtonText: 'Sí, anular',
  })
  if (!r.isConfirmed) return
  anulando.value = true
  try {
    for (const o of ordenes) {
      await OrderDataService.patch(o.id, { status: 4 })
      if (o.certificates?.length) {
        await Promise.all(o.certificates.map(c => CertificateDataService.patch(c.id, { status: 5 })))
      }
    }
    Toast.fire({ timer: 2200, icon: 'success', title: 'Órdenes anuladas' })
    ordenes_seleccionadas.value = []
    retrieveOrders()
  } catch (e) {
    Swal.fire('Error', 'No se pudieron anular todas las órdenes.', 'error')
  } finally {
    anulando.value = false
  }
}

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
          Toast.fire({ timer: 2200, icon: 'success', title: 'Orden anulada' })
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

const abrirEditarOrden = (o) => {
  // 1. Forzar la expansión visual de la tabla (abre TableServiceDetails)
  if (!isOrderExpanded(o)) {
    expanded.value = [o]
  }
  
  // 2. Traer la data completa (con client_data dentro de certificates) 
  // para que EditOrder.vue no falle al renderizar a los dueños.
  OrderDataService.get(o.id).then(response => {
    if (response && response.data) {
      updateSingleOrderInList(response.data)
      selected_order.value = response.data
      edit_order_modal.value = true
    }
  }).catch(() => {
    // Fallback de seguridad en caso de error de red
    selected_order.value = o
    edit_order_modal.value = true
  })
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
    Object.assign(orders.value[index], OrderMappers.getMap(updatedOrder))
  }
}

const handleWssReload = () => {
  retrieveOrders()
}

// Watchers (igual que en ListCertificates)
watch(options, () => { retrieveOrders() }, { deep: true })

// Quitamos filter_date_gt y filter_date_lt para que solo se apliquen con el botón "Aplicar"
// Debounce: espera a que el usuario deje de teclear antes de pegarle al backend.
watch([filter_order, filter_correlative, filter_invoice, filter_client_id, filter_status], () => {
  clearTimeout(debounceTimeout)
  debounceTimeout = setTimeout(applyFilters, 350)
})

// Ciclo de vida
watch(() => route.query.buscar_orden, (val) => {
  if (val) filter_order.value = val
})

watch(() => route.query.buscar_factura, (val) => {
  if (val) filter_invoice.value = val
})

onMounted(() => {
  if (route.query.buscar_orden) {
    filter_order.value = route.query.buscar_orden
  }
  if (route.query.buscar_factura) {
    filter_invoice.value = route.query.buscar_factura
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
/* Panel de facturas: se mantiene fijo mientras la tabla de órdenes scrollea.
   El scroll de la página vive en .v-main (overflow-y:auto), así que el sticky
   se calcula respecto a ese contenedor. */
.panel-sticky-wrapper {
  position: sticky;
  top: 8px;
  z-index: 5;
}
/* La píldora flotante de selección vive ahora en el componente común
   @/components/commonComponents/SelectionBar.vue (estilos incluidos). */

/*
 * POR QUÉ FALLABAN LOS INTENTOS ANTERIORES
 * ──────────────────────────────────────────
 * Vuetify NO pinta el hover con background-color en el <tr>.
 * Lo hace con un pseudo-elemento ::after en cada <td>:
 *
 *   .v-table--hover tbody tr:hover > td::after {
 *     content: "";
 *     position: absolute;
 *     background: rgba(var(--v-border-color), var(--v-hover-opacity));
 *   }
 *
 * Todos los !important en background-color del tr eran invisibles porque
 * la capa de hover se pinta ENCIMA como overlay en el td.
 *
 * SOLUCIÓN: anular el td::after en las filas donde no queremos hover.
 *
 * ESTRUCTURA DOM al expandir:
 *   tr.fila-padre-activa   ← fila con datos de la orden
 *   tr.fila-activa         ← fila con TableServiceDetails (expanded-row)
 *     └─ v-table (sub-tabla interna con sus propios tr)
 */

/* ── Hover de filas normales (las no expandidas) ── */
/* Replicamos lo que haría Vuetify pero solo donde queremos */
.v-theme--light .tabla-ordenes-servicio tbody tr:not(.fila-padre-activa):not(.fila-activa):hover > td {
  background-color: rgba(0, 0, 0, 0.04) !important;
}
.v-theme--dark .tabla-ordenes-servicio tbody tr:not(.fila-padre-activa):not(.fila-activa):hover > td {
  background-color: rgba(255, 255, 255, 0.05) !important;
}

/* ── Anular el td::after de Vuetify en filas activas ── */
/* Esto elimina la capa de hover que Vuetify pinta encima */
.tabla-ordenes-servicio tbody tr.fila-padre-activa > td::after,
.tabla-ordenes-servicio tbody tr.fila-activa > td::after {
  display: none !important;
}

/* ── Anular el td::after en la sub-tabla interna (TableServiceDetails) ── */
.tabla-ordenes-servicio tr.fila-activa .v-table tbody tr > td::after {
  display: none !important;
}

/* ── Color de fondo del estado activo ── */
.v-theme--light .tabla-ordenes-servicio tbody tr.fila-padre-activa > td,
.v-theme--light .tabla-ordenes-servicio tbody tr.fila-activa > td {
  background-color: #e8e8e8 !important;
}
.v-theme--dark .tabla-ordenes-servicio tbody tr.fila-padre-activa > td,
.v-theme--dark .tabla-ordenes-servicio tbody tr.fila-activa > td {
  background-color: #292929 !important;
}

/* ── Sub-tabla transparente para heredar el fondo del padre ── */
.tabla-ordenes-servicio tr.fila-activa .v-table,
.tabla-ordenes-servicio tr.fila-activa .v-table__wrapper {
  background-color: transparent !important;
}
</style>