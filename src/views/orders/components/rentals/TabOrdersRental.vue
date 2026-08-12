<template>
  <div>
    <!-- FILTROS -->
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
          v-model="filter_client_ref"
          hide-details
          density="compact"
          prepend-inner-icon="mdi-pound"
          variant="outlined"
          label="Ref. OC Cliente"
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
          :model-value="appStore.pendingPaymentsRentalCount > 0"
          :content="appStore.pendingPaymentsRentalCount"
          color="error"
          offset-x="4"
          offset-y="4"
        >
          <v-chip
            :color="(appStore.pendingPaymentsRentalCount > 0 && !filtro_falta_pago) ? 'grey-darken-1' : (filtro_falta_pago ? 'error' : 'grey-darken-1')"
            class="font-weight-bold cursor-pointer transition-swing"
            @click="toggleFiltroPago"
          >
            <v-icon start size="small">mdi-cash-remove</v-icon>
            Falta Pago
            <v-tooltip activator="parent" location="top">Filtrar alquileres facturados sin abonos</v-tooltip>
          </v-chip>
        </v-badge>

        <v-badge
          :model-value="appStore.pendingInvoicesRentalCount > 0"
          :content="appStore.pendingInvoicesRentalCount"
          color="warning"
          offset-x="4"
          offset-y="4"
        >
          <v-chip
            :color="(appStore.pendingInvoicesRentalCount > 0 && !filtro_sin_factura) ? 'grey-darken-1' : (filtro_sin_factura ? 'warning' : 'grey-darken-1')"
            class="font-weight-bold cursor-pointer transition-swing"
            @click="toggleFiltroFactura"
          >
            <v-icon start size="small">mdi-file-document-remove-outline</v-icon>
            Sin Emitir Factura
            <v-tooltip activator="parent" location="top">Filtrar alquileres abiertos pendientes de facturar</v-tooltip>
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
      <!-- IZQUIERDA: tabla operativa (colapsa al expandir el panel) -->
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
        class="elevation-0 rounded-lg tabla-mejorada tabla-ordenes-alquiler bg-surface"
        style="border: 1px solid #FFCA28;"
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

        <template v-slot:item.client_order_reference="{ item }">
          <v-chip v-if="item.documentos && item.documentos.oc_ref" size="x-small" variant="outlined" color="blue-grey-darken-2" class="font-weight-bold px-2" style="background-color: #f1f3f4 !important;">
            <v-icon start size="x-small" color="blue-grey-darken-2">mdi-pound</v-icon>
            {{ item.documentos.oc_ref }}
          </v-chip>
          <span v-else class="text-grey text-caption">---</span>
        </template>

        <template v-slot:item.client_data.name="{ item }">
          <span :class="item.status === 4 ? 'anulado-atenuado' : ''">{{ item.client_data.name }}</span>
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

        <template v-slot:item.documentos="{ item }">
          <div class="d-flex justify-center">
            <v-tooltip location="top" v-if="item.quote_pdf">
              <template v-slot:activator="{ props }">
                <v-btn icon variant="text" density="comfortable" size="x-small" color="error" :href="item.quote_pdf" target="_blank" v-bind="props" class="mx-1">
                  <v-icon>mdi-file-pdf-box</v-icon>
                </v-btn>
              </template>
              <span>Cotización DAICOM</span>
            </v-tooltip>

            <v-tooltip location="top" v-if="item.documentos && item.documentos.oc_count > 0">
              <template v-slot:activator="{ props }">
                <v-chip v-bind="props" size="x-small" color="primary" variant="tonal" class="mx-1 px-2 font-weight-bold"
                        :href="item.documentos.oc_last_pdf" target="_blank">
                  <v-icon size="x-small" class="mr-1">mdi-file-document</v-icon>{{ item.documentos.oc_count }}
                </v-chip>
              </template>
              <span>Abrir última OC ({{ item.documentos.oc_count }} en total · todas en Editar)</span>
            </v-tooltip>

            <v-tooltip location="top" v-if="item.documentos && item.documentos.val_count > 0">
              <template v-slot:activator="{ props }">
                <v-chip v-bind="props" size="x-small" color="teal" variant="tonal" class="mx-1 px-2 font-weight-bold"
                        :href="item.documentos.val_last_pdf" target="_blank">
                  <v-icon size="x-small" class="mr-1">mdi-cash-multiple</v-icon>{{ item.documentos.val_count }}
                </v-chip>
              </template>
              <span>Abrir última valorización ({{ item.documentos.val_count }} en total · todas en Editar)</span>
            </v-tooltip>

            <v-tooltip location="top" v-if="item.dispatch_guide_pdf">
              <template v-slot:activator="{ props }">
                <v-btn icon variant="text" density="comfortable" size="x-small" color="success" :href="item.dispatch_guide_pdf" target="_blank" v-bind="props" class="mx-1">
                  <v-icon>mdi-truck-fast</v-icon>
                </v-btn>
              </template>
              <span>Guía Salida</span>
            </v-tooltip>

            <v-tooltip location="top" v-if="item.return_guide_pdf">
              <template v-slot:activator="{ props }">
                <v-btn icon variant="text" density="comfortable" size="x-small" color="blue-grey" :href="item.return_guide_pdf" target="_blank" v-bind="props" class="mx-1">
                  <v-icon>mdi-truck-check</v-icon>
                </v-btn>
              </template>
              <span>Guía Retorno</span>
            </v-tooltip>

            <span v-if="!item.quote_pdf && !item.dispatch_guide_pdf && !item.return_guide_pdf && (!item.documentos || (item.documentos.oc_count === 0 && item.documentos.val_count === 0))" class="text-grey text-caption">Sin Docs</span>
          </div>
        </template>



        <template v-slot:item.actions="{ item }">
          <v-tooltip location="bottom" color="primary">
            <template v-slot:activator="{ props }">
              <v-btn v-bind="props" icon variant="text" density="comfortable" @click="abrirEditarOrden(item)" :disabled="item.status === 4">
                <v-icon>mdi-pencil</v-icon>
              </v-btn>
            </template>
            <span>Editar alquiler</span>
          </v-tooltip>

          <v-tooltip location="bottom" color="error" v-if="hasPermission(1004) && item.status !== 4">
            <template v-slot:activator="{ props }">
              <v-btn v-bind="props" icon variant="text" density="comfortable" @click="anularOrderConfirm(item)">
                <v-icon>mdi-delete-outline</v-icon>
              </v-btn>
            </template>
            <span>Anular Orden Alquiler</span>
          </v-tooltip>
        </template>

        <template v-slot:expanded-row="{ columns, item }">
          <tr class="fila-activa">
            <td :colspan="columns.length" class="pa-0">
              <table-rental-details :order="item" @add-rental="prepareExtraEquipment(item)" @reload="expanded = []; retrieveOrders()" />
            </td>
          </tr>
        </template>
      </v-data-table-server>
    </table-loading-overlay>
      </v-col>

      <!-- DERECHA: panel de facturas (order_type=2 = alquiler) -->
      <v-col cols="12" :md="panel_expandido ? 12 : 4" class="pa-0 pl-md-2 transition-swing">
        <div class="panel-sticky-wrapper">
          <panel-facturas
            :order_type="2"
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

    <!-- Barra flotante de selección (crear factura / sin factura) -->
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
    <dialog-factura v-model="factura_modal" :order="selected_order" :orders="ordenes_factura_multi" :order_type="2" @updateOrder="onFacturaGuardada" @close="cerrarFacturaModal" />
    <edit-order v-model="edit_order_modal" :order="selected_order" @updateOrder="updateSingleOrderInList" @close="edit_order_modal = false" />
    
    <add-extra-equipment v-model="dialog_extra" :order="selected_order" @close="dialog_extra = false" @reload="expanded = []; retrieveOrders()" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { Toast } from '@/plugins/alerts'
import { useRoute } from 'vue-router'
import { useTheme } from 'vuetify'
import Swal from 'sweetalert2'
import FluentPagination from '@/components/commonComponents/FluentPagination.vue'
import DatePicker from '@/components/commonComponents/DatePicker.vue'
import TableLoadingOverlay from '@/components/commonComponents/TableLoadingOverlay.vue'
import OrderDataService from '@/services/certificates/orderDataService'
import ClientDataService from '@/services/clients/clientDataService'
import ClientMappers from '@/mappers/clientMappers'
import OrderMappers from '@/mappers/orderMappers'
import { usePaginatedSearch } from '@/composables/usePaginatedSearch'
import { useAppStore } from '@/stores/appStore'
import DialogFactura from '../DialogFactura.vue'
import EditOrder from '../EditOrder.vue'
import AddExtraEquipment from '../AddExtraEquipment.vue'
import TableRentalDetails from './TableRentalDetails.vue'
import PanelFacturas from '../PanelFacturas.vue'
import SelectionBar from '@/components/commonComponents/SelectionBar.vue'

const route = useRoute()
const theme = useTheme()
const appStore = useAppStore()
const isDark = computed(() => theme.global.current.value.dark)

// ── Búsqueda paginada de clientes (autocomplete del filtro) ──
const filter_client_id = ref(null)
const {
  items: clients,
  loading: loading_clients,
  searchQuery: search_client,
  retrieveData: retrieveClientes,
} = usePaginatedSearch(
  (page, size, query) => ClientDataService.getFiltered(page, size, query),
  ClientMappers.getMap,
  () => filter_client_id.value
)

// ── Estado UI (modales + split-screen del panel de facturas) ──
const edit_order_modal = ref(false)
const factura_modal = ref(false)
const dialog_extra = ref(false)
const selected_order = ref(null)
const ordenes_seleccionadas = ref([])
const panel_expandido = ref(false)
const foco_order_id = ref(null)
const foco_order_number = ref('')
const ordenes_factura_multi = ref(null) // órdenes para crear UNA factura por selección
const marcando_sin_factura = ref(false)

const headers = [
  { title: 'Nro Alquiler',      key: 'order_number' },
  { title: 'Ref. Cliente',      key: 'client_order_reference' },
  { title: 'Empresa',           key: 'client_data.name' },
  { title: 'Documentos',        key: 'documentos',  align: 'center', sortable: false },
  { title: 'Estado Financiero', key: 'vinculo_financiero', align: 'center', sortable: false },
  { title: 'Opciones',          key: 'actions',     align: 'center', sortable: false },
  { title: '',                  key: 'data-table-expand' },
]

// ── Tabla + filtros ──
const orders = ref([])
const expanded = ref([])

// Resiliencia a return-object: el id puede venir suelto o dentro de un objeto.
const getSafeId = (val) => {
  if (!val) return null
  return typeof val === 'object' ? (val.id || val.raw?.id || val.value) : val
}
const isOrderExpanded = (item) => {
  const targetId = getSafeId(item)
  return expanded.value.some(e => getSafeId(e) === targetId)
}
const filter_order = ref('')
const filter_client_ref = ref('')
const filter_invoice = ref('')
const filter_date_gt = ref('')
const filter_date_lt = ref('')
const filter_status = ref('')
const mostrar_filtros_avanzados = ref(false)
const menu_fechas = ref(false)
const filtro_falta_pago = ref(false)
const filtro_sin_factura = ref(false)

// IDs según Order.OrderStatus del backend (4=Anulada, 5=Pagado).
const order_statuses = [
  { id: 1, name: 'En Proceso' },
  { id: 2, name: 'Deuda' },
  { id: 3, name: 'Abonado' },
  { id: 5, name: 'Pagado' },
  { id: 6, name: 'Excedido' },
  { id: 4, name: 'Anulada' },
]

const loading_list = ref(false)
const total_orders = ref(0)
const options = ref({ page: 1, itemsPerPage: 15 })
const is_admin = ref(false)
const user_permissions = ref([])

let debounceTimeout = null

const textoRangoFechas = computed(() => {
  if (!filter_date_gt.value && !filter_date_lt.value) return 'Cualquier fecha'
  if (filter_date_gt.value && !filter_date_lt.value) return `Desde el ${filter_date_gt.value}`
  if (!filter_date_gt.value && filter_date_lt.value) return `Hasta el ${filter_date_lt.value}`
  return `${filter_date_gt.value} al ${filter_date_lt.value}`
})

// ── Data ──
const retrieveOrders = () => {
  loading_list.value = true
  const limite = options.value.itemsPerPage > 0 ? options.value.itemsPerPage : 100000
  OrderDataService.getFiltered(
    options.value.page, limite, filter_client_id.value, filter_order.value,
    filter_client_ref.value, filter_date_gt.value, filter_date_lt.value,
    filter_status.value, 2, filtro_falta_pago.value, filtro_sin_factura.value, false,
    filter_invoice.value
  ).then(res => {
    orders.value = res.data.results.map(orden => OrderMappers.getMap(orden))
    total_orders.value = res.data.count
  }).finally(() => { loading_list.value = false })
}

const cargarResumenes = () => {
  OrderDataService.getPendingPaymentsSummary(2, filter_client_id.value, filter_order.value, filter_client_ref.value, filter_date_gt.value, filter_date_lt.value, filter_invoice.value)
    .then((res) => { appStore.setPendingPaymentsRentalCount(res.data.pending_payments) }).catch(() => {})

  OrderDataService.getPendingInvoicesSummary(2, filter_client_id.value, filter_order.value, filter_client_ref.value, filter_date_gt.value, filter_date_lt.value, filter_invoice.value)
    .then((res) => { appStore.setPendingInvoicesRentalCount(res.data.pending_invoices) }).catch(() => {})
}

const applyFilters = () => {
  // Si el panel de facturas está maximizado, tapa la tabla: al filtrar lo
  // achicamos para que se vean los resultados.
  panel_expandido.value = false
  options.value.page = 1
  retrieveOrders()
  cargarResumenes() // Sincroniza las píldoras al filtrar
}

// ── Filtros rápidos ──
const toggleFiltroPago = () => { filtro_falta_pago.value = !filtro_falta_pago.value; applyFilters() }
const toggleFiltroFactura = () => { filtro_sin_factura.value = !filtro_sin_factura.value; applyFilters() }
const limpiarFechas = () => { filter_date_gt.value = ''; filter_date_lt.value = ''; applyFilters() }

// ── WebSockets ──
const handleWssReload = () => { retrieveOrders(); cargarResumenes() }

const fetchAndInjectSingleOrder = (event) => {
  const orderId = event.detail
  OrderDataService.get(orderId).then(response => {
    if (response && response.data && response.data.order_type === 2) {
      updateSingleOrderInList(response.data)
      // Anti-DDoS: refresca los resúmenes con debounce de 1.5s
      if (debounceTimeout) clearTimeout(debounceTimeout)
      debounceTimeout = setTimeout(() => { cargarResumenes() }, 1500)
    }
  }).catch(() => {})
}

const updateSingleOrderInList = (updatedOrder) => {
  const index = orders.value.findIndex(o => o.id === updatedOrder.id)
  if (index !== -1) {
    Object.assign(orders.value[index], OrderMappers.getMap(updatedOrder))
  }
  // El Anti-DDoS (setTimeout) del WebSocket ya llama a cargarResumenes.
}

// ── Filas / expansión ──
const manejarClicFila = (event, { item }) => {
  if (event.target.closest('button') || event.target.closest('.v-btn') || event.target.closest('.v-chip') || event.target.closest('.v-data-table__expand-icon')) return
  expanded.value = isOrderExpanded(item) ? [] : [item.raw || item]
}

// ── Semáforo financiero (estado_financiero: 1=Proceso 2=Deuda 3=Abonado 4=Anulada 5=Pagado 6=Excedido) ──
const getColorSemaforoFinanciero = (o) => {
  if (o.wants_invoice === false) {
    return o.estado_financiero === 5 ? 'success' : 'grey-darken-2'
  }
  switch (o.estado_financiero) {
    case 4: return 'grey-darken-1'   // Anulada
    case 6: return 'blue-darken-1'   // Excedido
    case 5: return 'success'         // Pagado
    case 3: return 'warning'         // Abonado parcial
    case 2: return 'error'           // Deuda
    case 1:
    default: return 'grey'           // En proceso / sin factura
  }
}
const getIconoSemaforoFinanciero = (o) => {
  if (o.wants_invoice === false) {
    return o.estado_financiero === 5 ? 'mdi-file-document-check-outline' : 'mdi-file-document-remove-outline'
  }
  switch (o.estado_financiero) {
    case 4: return 'mdi-file-document-remove-outline'
    case 6: return 'mdi-file-document-alert-outline'
    case 5: return 'mdi-file-document-check-outline'
    case 3: return 'mdi-file-document-edit-outline'
    case 2: return 'mdi-file-document-alert-outline'
    case 1:
    default: return 'mdi-file-document-outline'
  }
}
const getTextoSemaforoFinanciero = (o) => {
  if (o.wants_invoice === false) {
    return o.estado_financiero === 5 ? 'Sin comprobante · Pagado' : 'Sin comprobante · Sin abono aún'
  }
  const n = o.invoices ? o.invoices.length : 0
  const cuantas = n > 1 ? `${n} facturas` : (o.invoices?.[0]?.invoice_number || '')
  switch (o.estado_financiero) {
    case 4: return 'Alquiler anulado'
    case 6: return `Excedido (${cuantas})`
    case 5: return `Pagado (${cuantas})`
    case 3: return `Abono parcial (${cuantas})`
    case 2: return `Sin abonos / Deuda (${cuantas})`
    case 1:
    default: return 'Sin factura — clic para ver'
  }
}
// Clic en el semáforo: enfoca el panel en las facturas de la orden; si está
// libre, la selecciona para vincular.
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

// ── Acciones ──
const anulando = ref(false)
const anularSeleccion = async () => {
  const ordenes = ordenes_seleccionadas.value
  if (ordenes.length === 0) return
  const r = await Swal.fire({
    title: `¿Anular ${ordenes.length} ${ordenes.length === 1 ? 'alquiler' : 'alquileres'}?`,
    text: 'Se invalidarán las órdenes marcadas.',
    icon: 'warning', showCancelButton: true, confirmButtonText: 'Sí, anular',
  })
  if (!r.isConfirmed) return
  anulando.value = true
  try {
    for (const o of ordenes) {
      await OrderDataService.patch(o.id, { status: 4 })
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
    title: '¿Anular Alquiler?', text: `Se invalidará la orden de alquiler ${order.order_number}`,
    icon: 'warning', showCancelButton: true, confirmButtonText: 'Sí, anular'
  }).then((result) => {
    if (result.isConfirmed) {
      OrderDataService.patch(order.id, { status: 4 }).then(() => {
        Toast.fire({ timer: 2200, icon: 'success', title: 'Orden anulada' })
        retrieveOrders()
      })
    }
  })
}
const abrirEditarOrden = (o) => { selected_order.value = o; edit_order_modal.value = true }
const prepareExtraEquipment = (o) => { selected_order.value = o; dialog_extra.value = true }
const hasPermission = (id) => (is_admin.value ? true : user_permissions.value.includes(id))

// ── Panel de facturas: crear por selección / sin factura ──
// "CREAR FACTURA": una sola factura para TODAS las órdenes marcadas. La moneda
// se elige en el diálogo de la factura (la orden ya no tiene moneda propia).
const crearFacturaParaSeleccion = () => {
  const ordenes = ordenes_seleccionadas.value
  if (ordenes.length === 0) return
  selected_order.value = null
  ordenes_factura_multi.value = [...ordenes]
  factura_modal.value = true
}

// "SIN FACTURA": marca las órdenes marcadas como "no requiere comprobante".
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
  } catch (err) {
    const d = err.response?.data
    const msg = d?.wants_invoice?.[0] || d?.detail || 'No se pudo marcar alguna orden.'
    Swal.fire('No se pudo', msg, 'error')
  } finally {
    marcando_sin_factura.value = false
  }
}

// Botón contextual: si TODAS las marcadas ya están "sin comprobante", re-activar.
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

// Re-activa "requiere comprobante". El backend descarta la interna vacía.
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

// Guardado desde el diálogo: en multi limpia la selección; en single refresca su fila.
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

// ── Watchers ──
watch(options, () => { retrieveOrders() }, { deep: true })
watch(filter_order, () => { applyFilters() })
watch(filter_invoice, () => { applyFilters() })
watch(filter_client_ref, () => { applyFilters() })
watch(filter_client_id, () => { applyFilters() })
watch(filter_status, () => { applyFilters() })
watch(() => route.query.buscar_orden, (val) => { if (val) filter_order.value = val })
watch(() => route.query.buscar_factura, (val) => { if (val) filter_invoice.value = val })
// Expansión única + carga perezosa de equipos alquilados
watch(expanded, (newVal) => {
  if (newVal.length > 1) {
    expanded.value = [newVal[newVal.length - 1]]
    return
  }
  if (expanded.value.length === 1) {
    const orderId = getSafeId(expanded.value[0])
    if (!orderId) return
    OrderDataService.get(orderId).then(response => {
      if (response && response.data) updateSingleOrderInList(response.data)
    }).catch(() => {})
  }
})

// Ver (foco) y seleccionar (vincular) son modos excluyentes. Al MARCAR órdenes
// (selección no vacía) soltamos el foco. Si la selección quedó vacía NO tocamos
// el foco: así no pisamos un foco recién puesto por el semáforo.
watch(ordenes_seleccionadas, (val) => {
  if (val.length > 0 && foco_order_id.value !== null) {
    foco_order_id.value = null
    foco_order_number.value = ''
  }
})

onMounted(() => {
  const user = JSON.parse(localStorage.getItem('user')) || {}
  is_admin.value = user.kind !== undefined && user.kind < 1
  user_permissions.value = user.action_permissions || []
  if (route.query.buscar_orden) filter_order.value = route.query.buscar_orden
  if (route.query.buscar_factura) filter_invoice.value = route.query.buscar_factura
  retrieveClientes()
  retrieveOrders()
  cargarResumenes()
  window.addEventListener('wss-reload-orders-rental', handleWssReload)
  window.addEventListener('wss-update-order-row', fetchAndInjectSingleOrder)
})

onUnmounted(() => {
  window.removeEventListener('wss-reload-orders-rental', handleWssReload)
  window.removeEventListener('wss-update-order-row', fetchAndInjectSingleOrder)
})
</script>

<style lang="scss">
.panel-sticky-wrapper {
  position: sticky;
  top: 8px;
  z-index: 5;
}

.anulado-atenuado {
  opacity: 0.25 !important;
  pointer-events: none;
}

.tabla-ordenes-alquiler tbody tr {
  cursor: pointer;
}

/* ── Hover de filas normales ── */
.v-theme--light .tabla-ordenes-alquiler tbody tr:not(.fila-padre-activa):not(.fila-activa):hover > td {
  background-color: rgba(0, 0, 0, 0.04) !important;
}
.v-theme--dark .tabla-ordenes-alquiler tbody tr:not(.fila-padre-activa):not(.fila-activa):hover > td {
  background-color: rgba(255, 255, 255, 0.05) !important;
}

/* ── Anular el td::after de Vuetify en filas activas ── */
.tabla-ordenes-alquiler tbody tr.fila-padre-activa > td::after,
.tabla-ordenes-alquiler tbody tr.fila-activa > td::after {
  display: none !important;
}

/* ── Anular el td::after en la sub-tabla interna (TableRentalDetails) ── */
.tabla-ordenes-alquiler tr.fila-activa .v-table tbody tr > td::after {
  display: none !important;
}

/* ── Color de fondo del estado activo ── */
.v-theme--light .tabla-ordenes-alquiler tbody tr.fila-padre-activa > td,
.v-theme--light .tabla-ordenes-alquiler tbody tr.fila-activa > td {
  background-color: #e8e8e8 !important;
}
.v-theme--dark .tabla-ordenes-alquiler tbody tr.fila-padre-activa > td,
.v-theme--dark .tabla-ordenes-alquiler tbody tr.fila-activa > td {
  background-color: #292929 !important;
}

/* ── Sub-tabla transparente para heredar el fondo del padre ── */
.tabla-ordenes-alquiler tr.fila-activa .v-table,
.tabla-ordenes-alquiler tr.fila-activa .v-table__wrapper {
  background-color: transparent !important;
}
</style>