<template>
  <div>
    <!-- FILTROS -->
    <v-card variant="flat" class="border rounded-lg mb-4">
      <div class="py-4 px-4">
        <v-row align="center" class="mb-0">
          <v-col cols="12" md="3" class="d-flex align-center text-medium-emphasis">
            <v-icon color="primary" class="mr-2">mdi-filter-variant</v-icon>
            <span class="text-subtitle-1 font-weight-medium">Filtros de alquiler</span>
          </v-col>
        </v-row>
        <v-row>
          <v-col cols="12" md="2">
            <v-text-field v-model="filter_order" label="Nro Orden Alquiler" prepend-inner-icon="mdi-folder-search" variant="outlined" density="compact" hide-details clearable @update:model-value="applyFilters" />
          </v-col>
          <v-col cols="12" md="2">
            <v-text-field v-model="filter_client_ref" label="Ref. OC Cliente" prepend-inner-icon="mdi-pound" variant="outlined" density="compact" hide-details clearable @update:model-value="applyFilters" />
          </v-col>
          <v-col cols="12" md="2">
            <v-autocomplete
              v-model="filter_client_id"
              hide-details
              density="compact"
              :loading="loading_clients"
              prepend-inner-icon="mdi-account-group"
              :items="clients"
              v-model:search="search_client"
              item-title="name"
              item-value="id"
              placeholder="Buscar..."
              no-data-text="No se encontraron clientes"
              clearable
              variant="outlined"
              label="Cliente"
              @update:model-value="applyFilters"
            />
          </v-col>
          <v-col cols="12" md="2">
            <date-picker :date="filter_date_gt" label="Desde:" @setPickedDate="onDateGtChange" />
          </v-col>
          <v-col cols="12" md="2">
            <date-picker :date="filter_date_lt" label="Hasta:" @setPickedDate="onDateLtChange" />
          </v-col>
          <v-col cols="12" md="2">
            <v-select v-model="filter_status" hide-details density="compact" prepend-inner-icon="mdi-list-status" :items="order_statuses" item-title="name" item-value="id" clearable variant="outlined" label="Estado de Facturación" @update:model-value="applyFilters" />
          </v-col>
        </v-row>
      </div>
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
        style="border: 1px solid #FFCA28;"
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

        <template v-slot:item.client_order_reference="{ item }">
          <v-chip v-if="item.client_order_reference" size="x-small" variant="outlined" color="blue-grey-darken-2" class="font-weight-bold px-2" style="background-color: #f1f3f4 !important;">
            <v-icon start size="x-small" color="blue-grey-darken-2">mdi-pound</v-icon>
            {{ item.client_order_reference }}
          </v-chip>
          <span v-else class="text-grey text-caption">---</span>
        </template>

        <template v-slot:item.client_data.name="{ item }">
          <span class="font-weight-bald">{{ item.client_data.name }}</span>
        </template>

        <template v-slot:item.status="{ item }">
          <div class="d-flex justify-center">
            <v-chip :color="getStatusOrderColor(item)" size="small" class="text-white font-weight-medium" style="width: 100px; justify-content: center;">
              {{ getStatusOrderLabel(item) }}
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

        <template v-slot:item.cobros="{ item }">
          <div class="d-flex align-center mx-auto" style="width: 190px;">
            <div class="text-left" style="width: 100px;">
              <template v-if="item.payments && item.payments.length > 0">
                <div class="font-weight-medium text-body-2 mb-n1" :class="item.status === 4 ? 'text-grey' : (isDark ? 'text-grey-lighten-2' : 'text-grey-darken-3')">
                  S/ {{ totalPagos(item) }}
                </div>
                <div class="text-caption text-grey">
                  {{ item.payments.length }} {{ item.payments.length === 1 ? 'abono' : 'abonos' }}
                </div>
              </template>
              <template v-else>
                <div class="font-weight-medium text-body-2 text-grey" :class="isDark ? 'text-darken-1' : 'text-lighten-1'">
                  ---
                </div>
              </template>
            </div>

            <div class="d-flex justify-end" style="width: 90px;">
              <v-tooltip location="bottom">
                <template v-slot:activator="{ props }">
                  <span v-bind="props" class="d-inline-block">
                    <v-btn icon variant="text" density="comfortable" :color="item.status === 4 ? 'grey-lighten-2' : (item.billed || item.billed_pdf ? 'primary' : 'grey')" :disabled="item.status === 4" @click="abrirFactura(item)">
                      <v-icon>{{ item.billed || item.billed_pdf ? 'mdi-file-document-check' : 'mdi-file-document-plus' }}</v-icon>
                    </v-btn>
                  </span>
                </template>
                <span>{{ item.billed || item.billed_pdf ? 'Ver/Editar Factura' : 'Subir Factura' }}</span>
              </v-tooltip>

              <v-tooltip location="bottom">
                <template v-slot:activator="{ props }">
                  <span v-bind="props" class="d-inline-block">
                    <v-btn icon variant="text" density="comfortable" :color="item.status === 4 ? 'grey-lighten-2' : (item.sent || (item.payments && item.payments.length > 0) ? 'primary' : 'grey')" :disabled="item.status === 4" @click="abrirPago(item)">
                      <v-icon>{{ item.sent || (item.payments && item.payments.length > 0) ? 'mdi-cash-check' : 'mdi-cash-plus' }}</v-icon>
                    </v-btn>
                  </span>
                </template>
                <span>{{ item.sent || (item.payments && item.payments.length > 0) ? 'Ver/Editar Pagos' : 'Registrar Pago' }}</span>
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
          <tr class="fila-activa-alq">
            <td :colspan="columns.length" class="pa-0">
              <table-rental-details :order="item" @reload="retrieveOrders" />
            </td>
          </tr>
        </template>
      </v-data-table-server>
    </table-loading-overlay>

    <!-- MODALES -->
    <dialog-factura v-model="factura_modal" :order="selected_order" @updateOrder="updateSingleOrderInList" @close="factura_modal = false" />
    <dialog-liquidacion v-model="liquidacion_modal" :order="selected_order" @updateOrder="updateSingleOrderInList" @close="liquidacion_modal = false" />
    <edit-order v-model="edit_order_modal" :order="selected_order" @updateOrder="updateSingleOrderInList" @close="edit_order_modal = false" />
  </div>
</template>

<script>
import { defineAsyncComponent, ref, watch, onMounted, onUnmounted, computed as vueComputed } from 'vue'
import { useTheme } from 'vuetify'
import FluentPagination from "@/components/commonComponents/FluentPagination.vue"
import OrderDataService from "@/services/certificates/orderDataService"
import ClientDataService from "@/services/clients/clientDataService"
import ClientMappers from "@/mappers/clientMappers"
import DialogFactura from "./DialogFactura.vue"
import DialogLiquidacion from "./DialogLiquidacion.vue"
import EditOrder from "./EditOrder.vue"
import TableRentalDetails from "./TableRentalDetails.vue"
import TableLoadingOverlay from '@/components/commonComponents/TableLoadingOverlay.vue'

export default {
  name: "TabOrdersRental",
  components: {
    FluentPagination,
    DatePicker: defineAsyncComponent(() => import("@/components/commonComponents/DatePicker.vue")),
    DialogFactura, DialogLiquidacion, EditOrder, TableRentalDetails
  },
  setup() {
    const theme = useTheme()
    const isDark = vueComputed(() => theme.global.current.value.dark)
    return { isDark }
  },
  data: () => ({
    edit_order_modal: false, factura_modal: false, liquidacion_modal: false, selected_order: null,
    headers: [
      { title: 'Nro Alquiler',   key: 'order_number' },
      { title: 'Ref. Cliente',   key: 'client_order_reference' },
      { title: 'Empresa',        key: 'client_data.name' },
      { title: 'Estado',         key: 'status',      align: 'center', sortable: false },
      { title: 'Documentos',     key: 'documentos',  align: 'center', sortable: false },
      { title: 'Cobros',         key: 'cobros',      align: 'center', sortable: false },
      { title: 'Opciones',       key: 'actions',     align: 'center', sortable: false },
      { title: '',               key: 'data-table-expand' },
    ],
    orders: [], expanded: [], filter_order: '', filter_client_ref: '', filter_client_id: '',
    clients: [], loading_clients: false, search_client: '', filter_date_gt: '', filter_date_lt: '', filter_status: '',
    order_statuses: [ {id: 1, name: 'Abierta'}, {id: 2, name: 'Facturada'}, {id: 3, name: 'Pagada'}, {id: 4, name: 'Anulada'} ],
    loading_list: false, total_orders: 0, options: { page: 1, itemsPerPage: 15 },
    is_admin: false, user_permissions: [],
  }),
  watch: {
    options: { handler() { this.retrieveOrders() }, deep: true },
    filter_order() { this.applyFilters() },
    filter_client_ref() { this.applyFilters() },
    filter_client_id() { this.applyFilters() },
    filter_date_gt() { this.applyFilters() },
    filter_date_lt() { this.applyFilters() },
    filter_status() { this.applyFilters() },
    search_client(val) { this.retrieveClientes(val) },
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
    window.addEventListener('wss-reload-orders-rental', this.retrieveOrders)
    window.addEventListener('wss-update-order-row', this.fetchAndInjectSingleOrder)
  },
  beforeUnmount() {
    window.removeEventListener('wss-reload-orders-rental', this.retrieveOrders)
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
    applyFilters() {
      this.options.page = 1
      this.retrieveOrders()
    },
    onDateGtChange(value) {
      this.filter_date_gt = value
      this.applyFilters()
    },
    onDateLtChange(value) {
      this.filter_date_lt = value
      this.applyFilters()
    },
    retrieveClientes(client) {
      this.loading_clients = true
      ClientDataService.getFiltered(1, 10, client || '').then((res) => {
        this.loading_clients = false
        this.clients = res.data.results.map(ClientMappers.getMap)
      })
    },
    fetchAndInjectSingleOrder(event) {
      const orderId = event.detail
      OrderDataService.get(orderId).then(response => {
        if (response && response.data) {
          if (response.data.order_type === 2) {
            this.updateSingleOrderInList(response.data)
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
    },
    retrieveOrders() {
      this.loading_list = true
      let limite = this.options.itemsPerPage > 0 ? this.options.itemsPerPage : 100000
      OrderDataService.getFiltered(
        this.options.page, limite, this.filter_client_id, this.filter_order,
        this.filter_client_ref, this.filter_date_gt, this.filter_date_lt,
        this.filter_status, 2
      ).then(res => {
        this.orders = res.data.results
        this.total_orders = res.data.count
      }).finally(() => { this.loading_list = false })
    },
    getStatusOrderLabel(o) {
      if (o.status === 4) return 'Anulada'
      if (o.sent || (o.payments && o.payments.length > 0)) return 'Liquidada'
      if (o.billed || o.billed_pdf) return 'Facturada'
      return 'En Proceso'
    },
    getStatusOrderColor(o) {
      if (o.status === 4) return 'red-darken-2'
      if (o.sent || (o.payments && o.payments.length > 0)) return 'success'
      if (o.billed || o.billed_pdf) return 'warning'
      return 'grey-darken-1'
    },
    totalPagos(o) {
      if (!o.payments || !o.payments.length) return '0.00'
      const t = o.payments.reduce((acc, p) => acc + parseFloat(p.amount || 0), 0)
      return t.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    },
    anularOrderConfirm(order) {
      this.$swal.fire({
        title: '¿Anular Alquiler?', text: `Se invalidará la orden de alquiler ${order.order_number}`,
        icon: 'warning', showCancelButton: true, confirmButtonText: 'Sí, anular'
      }).then((result) => {
        if (result.isConfirmed) {
          OrderDataService.patch(order.id, { status: 4 }).then(() => {
            this.$swal.fire('Completado', 'Orden anulada.', 'success')
            this.retrieveOrders()
          })
        }
      })
    },
    abrirFactura(i) { this.selected_order = i; this.factura_modal = true },
    abrirPago(i) { this.selected_order = i; this.liquidacion_modal = true },
    abrirEditarOrden(o) { this.selected_order = o; this.edit_order_modal = true },
    hasPermission(id) {
      if (this.is_admin) return true
      return this.user_permissions.includes(id)
    }
  }
}
</script>

<style>
.v-theme--light .tabla-mejorada tbody tr.fila-activa-alq,
.v-theme--light .tabla-mejorada tbody tr.v-data-table__tr--expanded { background-color: #FFF8E1 !important; }
.v-theme--dark .tabla-mejorada tbody tr.fila-activa-alq,
.v-theme--dark .tabla-mejorada tbody tr.v-data-table__tr--expanded { background-color: #424242 !important; }
.tabla-mejorada tr.v-data-table__expanded__content .v-data-table {
  background-color: transparent !important;
}

/* --- UX: Filas Clickables --- */
.tabla-mejorada tbody tr {
  cursor: pointer;
  transition: background-color 0.2s ease;
}

/* Hover suave: Solo aplica a la fila principal */
.v-theme--light .tabla-mejorada tbody tr:not(.v-data-table__expanded__content):hover {
  background-color: rgba(0, 0, 0, 0.04) !important;
}
.v-theme--dark .tabla-mejorada tbody tr:not(.v-data-table__expanded__content):hover {
  background-color: rgba(255, 255, 255, 0.05) !important;
}
</style>