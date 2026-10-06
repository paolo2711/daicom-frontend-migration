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

        <filter-pill
          :active="filtro_falta_pago"
          :count="appStore.pendingPaymentsRentalCount"
          color="error"
          icon="mdi-cash-remove"
          tooltip="Filtrar alquileres facturados sin abonos"
          @click="toggleFiltroPago"
        >Falta Pago</filter-pill>

        <filter-pill
          :active="filtro_a_credito"
          :count="appStore.pendingCreditRentalCount"
          color="teal"
          icon="mdi-calendar-clock"
          tooltip="Filtrar alquileres a crédito que aún no vencen"
          @click="toggleFiltroCredito"
        >A Crédito</filter-pill>

        <filter-pill
          :active="filtro_sin_factura"
          :count="appStore.pendingInvoicesRentalCount"
          color="warning"
          icon="mdi-file-document-remove-outline"
          tooltip="Filtrar alquileres abiertos pendientes de facturar"
          @click="toggleFiltroFactura"
        >Sin Emitir Factura</filter-pill>

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
              <date-range-filter
                v-model:desde="filter_date_gt"
                v-model:hasta="filter_date_lt"
                label="Rango de Fechas"
                clearable
                @apply="applyFilters"
                @clear="limpiarFechas"
              />
            </v-col>

            <v-col cols="12" md="4">
              <client-select v-model="filter_client_id" @update:model-value="applyFilters" />
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
        v-model:page="options.page"
        v-model:items-per-page="options.itemsPerPage"
        hide-default-footer
        @click:row="manejarClicFila"
        @contextmenu:row="alClickDerecho"
        :row-props="(data) => ({
          class: { 'fila-padre-activa': isOrderExpanded(data.item), 'fila-en-menu': estaEnElMenu(data.item) }
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
          <v-btn icon="mdi-dots-vertical" variant="text" density="comfortable" color="grey-darken-1"
                 :disabled="!accionesDe([item]).length" @click.stop="alBotonDeFila($event, item)" />
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

    <!-- Con órdenes marcadas, el panel de facturas ya está en modo vincular:
         tocar una factura ahí las vincula. -->
    <selection-bar
      :count="ordenes_seleccionadas.length"
      label="seleccionada(s)"
      :acciones="accionesDe(ordenes_seleccionadas)"
      @accion="clave => ejecutarAccion(clave, ordenes_seleccionadas)"
      @clear="ordenes_seleccionadas = []"
    />

    <action-menu :menu="menu" :acciones="accionesDe(menu.filas)"
                 @accion="clave => ejecutarAccion(clave, menu.filas)" />

    <!-- MODALES -->
    <dialog-factura v-model="factura_modal" :order="selected_order" :orders="ordenes_factura_multi" :order_type="2" @updateOrder="onFacturaGuardada" @close="cerrarFacturaModal" />
    <edit-order v-model="edit_order_modal" :order="selected_order" @updateOrder="updateSingleOrderInList" @close="edit_order_modal = false" />
    
    <add-extra-equipment v-model="dialog_extra" :order="selected_order" @close="dialog_extra = false" @reload="expanded = []; retrieveOrders()" />
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import FluentPagination from '@/components/commonComponents/FluentPagination.vue'
import TableLoadingOverlay from '@/components/commonComponents/TableLoadingOverlay.vue'
import OrderDataService from '@/services/orders/orderDataService'
import ClientSelect from '@/components/shared/ClientSelect.vue'
import FilterPill from '@/components/shared/FilterPill.vue'
import DateRangeFilter from '@/components/shared/DateRangeFilter.vue'
import OrderMappers from '@/mappers/orderMappers'
import ActionMenu from '@/components/shared/ActionMenu.vue'
import { useOrderActions } from '@/composables/useOrderActions'
import { usePaginatedSearch } from '@/composables/usePaginatedSearch'
import { useLatestRequest } from '@/composables/useLatestRequest'
import { useOrderItems } from '@/composables/useOrderItems'
import { throttle } from '@/utils/throttle'
import { getColorSemaforoFinanciero, getIconoSemaforoFinanciero, getTextoSemaforoFinanciero } from '@/utils/orders/cobro'
import { useAppStore } from '@/stores/appStore'
import DialogFactura from '../DialogFactura.vue'
import EditOrder from '../EditOrder.vue'
import AddExtraEquipment from '../AddExtraEquipment.vue'
import TableRentalDetails from './TableRentalDetails.vue'
import PanelFacturas from '../PanelFacturas.vue'
import SelectionBar from '@/components/commonComponents/SelectionBar.vue'

const route = useRoute()
const appStore = useAppStore()

// ── Búsqueda paginada de clientes (autocomplete del filtro) ──
const filter_client_id = ref(null)

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
const { cargarItems, reemplazarOrdenes } = useOrderItems(orders, 'rentals')

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
const filtro_falta_pago = ref(false)
const filtro_a_credito = ref(false)
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

// ── Data ──
const { begin: beginOrdersLoad, isLatest: isLatestOrdersLoad } = useLatestRequest()

const retrieveOrders = () => {
  loading_list.value = true
  const token = beginOrdersLoad()   // guard de secuencia: gana la carga más reciente
  const limite = options.value.itemsPerPage > 0 ? options.value.itemsPerPage : 100000
  OrderDataService.getFiltered(
    options.value.page, limite, filter_client_id.value, filter_order.value,
    filter_client_ref.value, filter_date_gt.value, filter_date_lt.value,
    filter_status.value, 2, filtro_falta_pago.value, filtro_sin_factura.value, filtro_a_credito.value,
    filter_invoice.value
  ).then(res => {
    if (!isLatestOrdersLoad(token)) return   // llegó una carga más nueva → no pisar
    reemplazarOrdenes(res.data.results.map(orden => OrderMappers.getMap(orden)), idOrdenExpandida())
    total_orders.value = res.data.count
  }).finally(() => {
    if (isLatestOrdersLoad(token)) loading_list.value = false
  })
}

// Las pildoras de cobro, con los filtros de la pantalla.
const cargarResumenes = () => Promise.all([
  OrderDataService.getPendingPaymentsSummary(2, filter_client_id.value, filter_order.value, filter_client_ref.value, filter_date_gt.value, filter_date_lt.value, filter_invoice.value)
    .then((res) => { appStore.setPendingPaymentsRentalCount(res.data.pending_payments) }).catch(() => {}),
  OrderDataService.getPendingInvoicesSummary(2, filter_client_id.value, filter_order.value, filter_client_ref.value, filter_date_gt.value, filter_date_lt.value, filter_invoice.value)
    .then((res) => { appStore.setPendingInvoicesRentalCount(res.data.pending_invoices) }).catch(() => {}),
  OrderDataService.getPendingCreditSummary(2, filter_client_id.value, filter_order.value, filter_client_ref.value, filter_date_gt.value, filter_date_lt.value, filter_invoice.value)
    .then((res) => { appStore.setPendingCreditRentalCount(res.data.pending_credit) }).catch(() => {}),
])

// Las mismas, cuando las pide un aviso: con el freno de los contadores.
const refrescarResumenes = throttle(cargarResumenes)

const applyFilters = () => {
  // Si el panel de facturas está maximizado, tapa la tabla: al filtrar lo
  // achicamos para que se vean los resultados.
  panel_expandido.value = false
  options.value.page = 1
  retrieveOrders()
  cargarResumenes() // Sincroniza las píldoras al filtrar
}

// ── Filtros rápidos ──
// Falta pago y A credito no comparten alquileres: prender una apaga la otra.
const toggleFiltroPago = () => {
  filtro_falta_pago.value = !filtro_falta_pago.value
  if (filtro_falta_pago.value) filtro_a_credito.value = false
  applyFilters()
}
const toggleFiltroCredito = () => {
  filtro_a_credito.value = !filtro_a_credito.value
  if (filtro_a_credito.value) filtro_falta_pago.value = false
  applyFilters()
}
const toggleFiltroFactura = () => { filtro_sin_factura.value = !filtro_sin_factura.value; applyFilters() }
const limpiarFechas = () => { filter_date_gt.value = ''; filter_date_lt.value = ''; applyFilters() }

// ── WebSockets ──
const handleWssReload = () => { retrieveOrders(); refrescarResumenes() }

const idOrdenExpandida = () => (
  expanded.value.length === 1 ? getSafeId(expanded.value[0]) : null
)

const fetchAndInjectSingleOrder = (event) => {
  OrderDataService.getFila(event.detail).then(response => {
    const fila = response?.data
    if (!fila || fila.order_type !== 2) return

    const index = orders.value.findIndex(o => o.id === fila.id)
    if (index !== -1) Object.assign(orders.value[index], fila)

    // Las lineas no tienen avisos propios: cambian con los de su orden.
    if (String(idOrdenExpandida()) === String(fila.id)) cargarItems(fila.id)
    refrescarResumenes()
  }).catch(() => {})
}

const updateSingleOrderInList = (updatedOrder) => {
  const index = orders.value.findIndex(o => o.id === updatedOrder.id)
  if (index !== -1) {
    // Las lineas las trae useOrderItems; el resto de la orden no las pisa.
    const lineas = orders.value[index].rentals
    Object.assign(orders.value[index], OrderMappers.getMap(updatedOrder), { rentals: lineas })
  }
  // El Anti-DDoS (setTimeout) del WebSocket ya llama a cargarResumenes.
}

// ── Filas / expansión ──
const manejarClicFila = (event, { item }) => {
  if (event.target.closest('button') || event.target.closest('.v-btn') || event.target.closest('.v-chip') || event.target.closest('.v-data-table__expand-icon')) return
  expanded.value = isOrderExpanded(item) ? [] : [item.raw || item]
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
const abrirEditarOrden = (o) => { selected_order.value = o; edit_order_modal.value = true }
const prepareExtraEquipment = (o) => { selected_order.value = o; dialog_extra.value = true }

// Una sola factura para todas: DialogFactura la crea y les vincula las ordenes.
// La moneda se elige ahi, la orden no tiene.
const facturar = (ordenes) => {
  selected_order.value = null
  ordenes_factura_multi.value = [...ordenes]
  factura_modal.value = true
}

const { menu, alClickDerecho, alBotonDeFila, estaEnElMenu, accionesDe, ejecutarAccion } =
  useOrderActions(ordenes_seleccionadas, {
    editar: abrirEditarOrden,
    agregarEquipo: prepareExtraEquipment,
    facturar,
  })

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
    cargarItems(getSafeId(expanded.value[0]), { mostrarCarga: true })
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
  if (route.query.buscar_orden) filter_order.value = route.query.buscar_orden
  if (route.query.buscar_factura) filter_invoice.value = route.query.buscar_factura
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

/* El ambar distingue Alquileres de Servicios de un vistazo. Pisa el marco
   comun de _table.scss a proposito. */
.v-application .tabla-ordenes-alquiler {
  border-color: #FFCA28;
}

.tabla-ordenes-alquiler tbody tr {
  cursor: pointer;
}

/* ── Hover de filas normales ── */
.v-theme--light .tabla-ordenes-alquiler tbody tr:not(.fila-padre-activa):not(.fila-activa):not(.fila-en-menu):hover > td {
  background-color: rgba(0, 0, 0, 0.04) !important;
}
.v-theme--dark .tabla-ordenes-alquiler tbody tr:not(.fila-padre-activa):not(.fila-activa):not(.fila-en-menu):hover > td {
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