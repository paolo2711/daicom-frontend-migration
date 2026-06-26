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

        <v-badge
          :model-value="filtro_detraccion && appStore.afectasDetraccionRentalCount > 0"
          :content="appStore.afectasDetraccionRentalCount"
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
            <v-tooltip activator="parent" location="top">Filtrar alquileres afectos a detracción SUNAT</v-tooltip>
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
        :hover="false"
        class="elevation-0 rounded-lg tabla-mejorada tabla-ordenes-alquiler bg-surface"
        style="border: 1px solid #FFCA28;"
        v-model:page="options.page"
        v-model:items-per-page="options.itemsPerPage"
        hide-default-footer
        @click:row="manejarClicFila"

        :row-props="(data) => ({ 
          class: expanded.includes(data.item.id || (data.item.raw && data.item.raw.id)) ? 'fila-padre-activa' : '' 
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
          <v-chip v-if="item.client_order_reference" size="x-small" variant="outlined" color="blue-grey-darken-2" class="font-weight-bold px-2" style="background-color: #f1f3f4 !important;">
            <v-icon start size="x-small" color="blue-grey-darken-2">mdi-pound</v-icon>
            {{ item.client_order_reference }}
          </v-chip>
          <span v-else class="text-grey text-caption">---</span>
        </template>

        <template v-slot:item.client_data.name="{ item }">
          <span :class="item.status === 4 ? 'anulado-atenuado' : ''">{{ item.client_data.name }}</span>
        </template>

        <template v-slot:item.status="{ item }">
          <div class="d-flex align-center justify-center">
            <v-chip :color="getStatusFinancialColor(item)" size="small" class="text-white font-weight-medium" style="width: 100px; justify-content: center;">
              {{ getStatusFinancialLabel(item) }}
            </v-chip>
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

            <v-tooltip location="top" v-if="item.client_oc_pdf">
              <template v-slot:activator="{ props }">
                <v-btn icon variant="text" density="comfortable" size="x-small" color="primary" :href="item.client_oc_pdf" target="_blank" v-bind="props" class="mx-1">
                  <v-icon>mdi-file-document</v-icon>
                </v-btn>
              </template>
              <span>OC Cliente</span>
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

            <span v-if="!item.quote_pdf && !item.client_oc_pdf && !item.dispatch_guide_pdf && !item.return_guide_pdf" class="text-grey text-caption">Sin Docs</span>
          </div>
        </template>

        <template v-slot:item.facturacion="{ item }">
          <div class="d-flex align-center justify-end w-100">
            <div class="d-flex flex-column align-end pr-1">
              <div class="font-weight-medium body-2 mb-n1" :class="item.status === 4 ? 'text-grey' : (isDark ? 'text-grey-lighten-2' : 'text-grey-darken-3')">
                {{ item.total_facturado > 0 || (item.wants_invoice === false && item.total_pagado > 0) ? 'S/ ' + formatMoney(item.neto_a_cobrar) : '---' }}
              </div>
              <div class="text-caption text-grey" style="font-size: 10px !important;">
                <span v-if="item.wants_invoice === false">Sin comprobante</span>
                <span v-else-if="item.has_detraccion">Detr: -S/ {{ formatMoney(item.detraccion_total) }}</span>
              </div>
            </div>
            <div class="d-flex pl-1">
              <v-tooltip location="bottom">
                <template v-slot:activator="{ props }">
                  <v-btn
                    icon
                    :color="item.status === 4 ? 'grey-lighten-2' : ((item.invoices?.length > 0 || item.wants_invoice === false) ? 'primary' : 'grey')"
                    :disabled="item.status === 4"
                    variant="text"
                    density="compact"
                    @click.stop="abrirFactura(item)"
                    v-bind="props"
                  >
                    <v-icon size="small">{{ item.wants_invoice === false ? 'mdi-file-document-remove-outline' : (item.invoices?.length > 0 ? 'mdi-file-document-check' : 'mdi-file-document-plus') }}</v-icon>
                  </v-btn>
                </template>
                <span>{{ item.wants_invoice === false ? 'Sin Comprobante (Ver)' : (item.invoices?.length > 0 ? 'Ver/Editar Factura' : 'Subir Factura') }}</span>
              </v-tooltip>
            </div>
          </div>
        </template>

        <template v-slot:item.cobros="{ item }">
          <div class="d-flex align-center justify-end w-100">
            <div class="d-flex flex-column align-end pr-1">
              <div class="font-weight-medium body-2 mb-n1" :class="item.status === 4 ? 'text-grey' : (isDark ? 'text-grey-lighten-2' : 'text-grey-darken-3')">
                {{ item.total_pagado > 0 ? 'S/ ' + formatMoney(item.total_pagado) : '---' }}
              </div>
              <div v-if="item.payments?.length > 0" class="text-caption text-grey" style="font-size: 10px !important;">
                {{ item.payments.length }} {{ item.payments.length === 1 ? 'abono' : 'abonos' }}
              </div>
            </div>
            <div class="d-flex pl-1">
              <v-tooltip location="bottom">
                <template v-slot:activator="{ props }">
                  <v-btn
                    icon
                    :color="item.status === 4 ? 'grey-lighten-2' : ((item.payments && item.payments.length > 0) ? 'primary' : 'grey')"
                    :disabled="item.status === 4"
                    variant="text"
                    density="compact"
                    @click.stop="abrirPago(item)"
                    v-bind="props"
                  >
                    <v-icon size="small">{{ (item.payments && item.payments.length > 0) ? 'mdi-cash-check' : 'mdi-cash-plus' }}</v-icon>
                  </v-btn>
                </template>
                <span>{{ (item.payments && item.payments.length > 0) ? 'Ver/Editar Pagos' : 'Registrar Pago' }}</span>
              </v-tooltip>
            </div>
          </div>
        </template>


        <template v-slot:item.actions="{ item }">
          <v-tooltip location="bottom" color="primary">
            <template v-slot:activator="{ props }">
              <v-btn v-bind="props" icon variant="text" density="comfortable" @click="abrirEditarOrden(item)" :disabled="item.status === 4">
                <v-icon>mdi-pencil</v-icon>
              </v-btn>
            </template>
            <span>Editar Cliente</span>
          </v-tooltip>

          <v-tooltip location="bottom" color="error" v-if="hasPermission(13) && item.status !== 4">
            <template v-slot:activator="{ props }">
              <v-btn v-bind="props" icon variant="text" density="comfortable" color="red-darken-2" @click="anularOrderConfirm(item)">
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

    <!-- MODALES -->
    <dialog-factura v-model="factura_modal" :order="selected_order" @updateOrder="updateSingleOrderInList" @close="factura_modal = false" />
    <dialog-liquidacion v-model="liquidacion_modal" :order="selected_order" @updateOrder="updateSingleOrderInList" @close="liquidacion_modal = false" />
    <edit-order v-model="edit_order_modal" :order="selected_order" @updateOrder="updateSingleOrderInList" @close="edit_order_modal = false" />
    
    <add-extra-equipment v-model="dialog_extra" :order="selected_order" @close="dialog_extra = false" @reload="expanded = []; retrieveOrders()" />
  </div>
</template>

<script>
import { defineAsyncComponent, ref, watch, onMounted, onUnmounted, computed as vueComputed } from 'vue'
import Swal from 'sweetalert2'
import { useTheme } from 'vuetify'
import FluentPagination from "@/components/commonComponents/FluentPagination.vue"
import OrderDataService from "@/services/certificates/orderDataService"
import ClientDataService from "@/services/clients/clientDataService"
import ClientMappers from "@/mappers/clientMappers"
import { usePaginatedSearch } from '@/composables/usePaginatedSearch'
import { useAppStore } from '@/stores/appStore'
import DialogFactura from "./DialogFactura.vue"
import DialogLiquidacion from "./DialogLiquidacion.vue"
import EditOrder from "./EditOrder.vue"
import TableRentalDetails from "./TableRentalDetails.vue"
import TableLoadingOverlay from '@/components/commonComponents/TableLoadingOverlay.vue'
import AddExtraEquipment from "./AddExtraEquipment.vue"

export default {
  name: "TabOrdersRental",
  components: {
    FluentPagination,
    DatePicker: defineAsyncComponent(() => import("@/components/commonComponents/DatePicker.vue")),
    DialogFactura, DialogLiquidacion, EditOrder, TableRentalDetails, TableLoadingOverlay, AddExtraEquipment
  },
  setup() {
    const theme = useTheme()
    const isDark = vueComputed(() => theme.global.current.value.dark)
    
    // PUENTE: Instanciamos el Composable y lo devolvemos para que Options API lo vea en 'this'
    const filter_client_id = ref(null)
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
    
    const appStore = useAppStore()

    return { isDark, filter_client_id, clients, loading_clients, search_client, retrieveClientes, appStore }
  },
  data: () => ({
    edit_order_modal: false, factura_modal: false, liquidacion_modal: false, dialog_extra: false, selected_order: null,
    headers: [
      { title: 'Nro Alquiler',   key: 'order_number' },
      { title: 'Ref. Cliente',   key: 'client_order_reference' },
      { title: 'Empresa',        key: 'client_data.name' },
      { title: 'Documentos',     key: 'documentos',  align: 'center', sortable: false },
      { title: 'Facturación',    key: 'facturacion', align: 'center', sortable: false },
      { title: 'Cobro',         key: 'cobros',      align: 'center', sortable: false },
      { title: 'Estado',         key: 'status',      align: 'center', sortable: false },
      { title: 'Opciones',       key: 'actions',     align: 'center', sortable: false },
      { title: '',               key: 'data-table-expand' },
    ],
    orders: [], expanded: [], filter_order: '', filter_client_ref: '', 
    filter_date_gt: '', filter_date_lt: '', filter_status: '',
    mostrar_filtros_avanzados: false, menu_fechas: false,
    filtro_falta_pago: false, filtro_sin_factura: false, filtro_detraccion: false,
    order_statuses: [ {id: 1, name: 'En Proceso'}, {id: 2, name: 'Deuda'}, {id: 3, name: 'Abonado'}, {id: 4, name: 'Pagado'}, {id: 5, name: 'Anulada'}, {id: 6, name: 'Excedido'} ],
    loading_list: false, total_orders: 0, options: { page: 1, itemsPerPage: 15 },
    is_admin: false, user_permissions: [],
  }),
  computed: {
    textoRangoFechas() {
      if (!this.filter_date_gt && !this.filter_date_lt) return 'Cualquier fecha'
      if (this.filter_date_gt && !this.filter_date_lt) return `Desde el ${this.filter_date_gt}`
      if (!this.filter_date_gt && this.filter_date_lt) return `Hasta el ${this.filter_date_lt}`
      return `${this.filter_date_gt} al ${this.filter_date_lt}`
    }
  },
  watch: {
    options: { handler() { this.retrieveOrders() }, deep: true },
    filter_order() { this.applyFilters() },
    filter_client_ref() { this.applyFilters() },
    filter_client_id() { this.applyFilters() },
    filter_status() { this.applyFilters() },
    // Expansión única y Carga Perezosa de Equipos Alquilados
    expanded(newVal) {
      if (newVal.length > 1) {
        this.expanded = [newVal[newVal.length - 1]]
      }
      if (this.expanded.length === 1) {
        const orderId = this.expanded[0]
        OrderDataService.get(orderId).then(response => {
          if (response && response.data) {
            this.updateSingleOrderInList(response.data)
          }
        }).catch(() => {})
      }
    }
  },
  mounted() {
    const user = JSON.parse(localStorage.getItem('user')) || {}
    this.is_admin = user.kind !== undefined && user.kind < 1
    this.user_permissions = user.action_permissions || []
    this.retrieveClientes()
    this.retrieveOrders()
    this.cargarResumenes()
    window.addEventListener('wss-reload-orders-rental', this.handleWssReload)
    window.addEventListener('wss-update-order-row', this.fetchAndInjectSingleOrder)
  },
  beforeUnmount() {
    window.removeEventListener('wss-reload-orders-rental', this.handleWssReload)
    window.removeEventListener('wss-update-order-row', this.fetchAndInjectSingleOrder)
  },
  methods: {
    manejarClicFila(event, { item }) {
      if (event.target.closest('button') || event.target.closest('.v-btn') || event.target.closest('.v-chip') || event.target.closest('.v-data-table__expand-icon')) {
        return
      }
      const itemId = item.id || (item.raw && item.raw.id) || item.value
      if (this.expanded.includes(itemId)) {
        this.expanded = []
      } else {
        this.expanded = [itemId]
      }
    },
    toggleFiltroPago() {
      this.filtro_falta_pago = !this.filtro_falta_pago
      this.applyFilters()
    },
    toggleFiltroFactura() {
      this.filtro_sin_factura = !this.filtro_sin_factura
      this.applyFilters()
    },
    toggleFiltroDetraccion() {
      this.filtro_detraccion = !this.filtro_detraccion
      this.applyFilters()
    },
    limpiarFechas() {
      this.filter_date_gt = ''
      this.filter_date_lt = ''
      this.applyFilters()
    },
    cargarResumenes() {
      OrderDataService.getPendingPaymentsSummary(2, this.filter_client_id, this.filter_order, this.filter_client_ref, this.filter_date_gt, this.filter_date_lt).then((res) => {
        this.appStore.setPendingPaymentsRentalCount(res.data.pending_payments)
      }).catch(() => {})
      
      OrderDataService.getPendingInvoicesSummary(2, this.filter_client_id, this.filter_order, this.filter_client_ref, this.filter_date_gt, this.filter_date_lt).then((res) => {
        this.appStore.setPendingInvoicesRentalCount(res.data.pending_invoices)
      }).catch(() => {})

      if (this.filtro_detraccion) {
        OrderDataService.getAfectasDetraccionSummary(2, this.filter_client_id, this.filter_order, this.filter_client_ref, this.filter_date_gt, this.filter_date_lt).then((res) => {
          this.appStore.setAfectasDetraccionRentalCount(res.data.afectas_detraccion)
        }).catch(() => {})
      } else {
        this.appStore.setAfectasDetraccionRentalCount(0)
      }
    },
    handleWssReload() {
      this.retrieveOrders()
      this.cargarResumenes()
    },
    applyFilters() {
      this.options.page = 1
      this.retrieveOrders()
      this.cargarResumenes() // Sincroniza las píldoras al filtrar
    },
    onDateGtChange(value) {
      this.filter_date_gt = value
      this.applyFilters()
    },
    onDateLtChange(value) {
      this.filter_date_lt = value
      this.applyFilters()
    },
    
    fetchAndInjectSingleOrder(event) {
      const orderId = event.detail
      OrderDataService.get(orderId).then(response => {
        if (response && response.data) {
          if (response.data.order_type === 2) {
            this.updateSingleOrderInList(response.data)
            
            // Refrescar resúmenes con Debounce de 1.5s para evitar DDoS
            if (this.debounceTimeout) clearTimeout(this.debounceTimeout)
            this.debounceTimeout = setTimeout(() => { this.cargarResumenes() }, 1500)
          }
        }
      }).catch(() => {})
    },
    updateSingleOrderInList(updatedOrder) {
      const index = this.orders.findIndex(o => o.id === updatedOrder.id)
      if (index !== -1) {
        this.orders.splice(index, 1, { ...this.orders[index], ...updatedOrder })
        this.orders = [...this.orders]
      }
      // Se eliminó this.cargarResumenes() aquí porque el Anti-DDoS (setTimeout) 
      // del WebSocket ya se encarga de llamarlo de forma segura.
    },
    retrieveOrders() {
      this.loading_list = true
      let limite = this.options.itemsPerPage > 0 ? this.options.itemsPerPage : 100000
      OrderDataService.getFiltered(
        this.options.page, limite, this.filter_client_id, this.filter_order,
        this.filter_client_ref, this.filter_date_gt, this.filter_date_lt,
        this.filter_status, 2, this.filtro_falta_pago, this.filtro_sin_factura, this.filtro_detraccion
      ).then(res => {
        this.orders = res.data.results
        this.total_orders = res.data.count
      }).finally(() => { this.loading_list = false })
    },
    getStatusFinancialLabel(o) {
      const map = { 1: 'En Proceso', 2: 'Deuda', 3: 'Abonado', 4: 'Anulada', 5: 'Pagado', 6: 'Excedido' }
      return map[o.status] || 'En Proceso'
    },
    getStatusFinancialColor(o) {
      const map = { 1: 'grey-darken-1', 2: 'error', 3: 'warning', 4: 'grey-darken-1', 5: 'success', 6: 'blue-darken-1' }
      return map[o.status] || 'grey-darken-1'
    },
    formatMoney(val) {
      const num = parseFloat(val || 0)
      return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    },
    anularOrderConfirm(order) {
      Swal.fire({
        title: '¿Anular Alquiler?', text: `Se invalidará la orden de alquiler ${order.order_number}`,
        icon: 'warning', showCancelButton: true, confirmButtonText: 'Sí, anular'
      }).then((result) => {
        if (result.isConfirmed) {
          OrderDataService.patch(order.id, { status: 4 }).then(() => {
            Swal.fire('Completado', 'Orden anulada.', 'success')
            this.retrieveOrders()
          })
        }
      })
    },
    abrirFactura(i) { this.selected_order = i; this.factura_modal = true },
    abrirPago(i) { this.selected_order = i; this.liquidacion_modal = true },
    abrirEditarOrden(o) { this.selected_order = o; this.edit_order_modal = true },
    prepareExtraEquipment(o) { this.selected_order = o; this.dialog_extra = true },
    hasPermission(id) {
      if (this.is_admin) return true
      return this.user_permissions.includes(id)
    }
  }
}
</script>

<style lang="scss">
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