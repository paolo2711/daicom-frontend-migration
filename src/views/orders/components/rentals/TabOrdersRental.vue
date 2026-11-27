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
        />

        <v-divider vertical class="mx-2 d-none d-md-block" style="height: 32px;"></v-divider>

        <order-pills v-model="pildora" :cuentas="cuentas" @update:model-value="applyFilters" />

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
              <client-select v-model="filter_client_id" />
            </v-col>

            <v-col cols="12" md="4">
              <v-select
                v-model="filter_status"
                prepend-inner-icon="mdi-list-status"
                :items="FILTRO_DE_ESTADO"
                item-title="name"
                item-value="id"
                clearable
                variant="outlined"
                density="compact"
                hide-details="auto"
                label="Estado"
              />
            </v-col>
          </v-row>
        </div>
      </v-expand-transition>
    </v-card>

    <resizable-split v-model:ancho-de-la-lista="anchoDeLaLista" v-model:abierto="enCobro" clave="ordenes.alquiler" class="mt-2">
    <table-loading-overlay :loading="loading_list" :isEmpty="orders.length === 0">
      <v-data-table-server :key="claveDeLaTabla"
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
        class="elevation-0 rounded-lg tabla-mejorada tabla-ordenes bg-surface"
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

        <template v-slot:item.client_data.name="{ item }">
          <span :class="viva(item) ? '' : 'anulado-atenuado'">{{ item.client_data.name }}</span>
        </template>

        <template v-slot:item.progress="{ item }">
          <order-progress :orden="item" listos="devueltos" />
        </template>

        <template v-slot:item.created_at="{ item }">
          <span class="text-no-wrap">{{ fechaCorta(item.created_at) }}</span>
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
                  :disabled="!viva(item)"
                  :color="getColorSemaforoFinanciero(item)"
                  @click.stop="alSemaforo(item)"
                >
                  <v-icon size="small">{{ getIconoSemaforoFinanciero(item) }}</v-icon>
                </v-btn>
              </template>
              <span class="font-weight-bold">{{ getTextoSemaforoFinanciero(item) }}</span>
            </v-tooltip>
          </div>
        </template>

        <template v-slot:item.documentos="{ item }">
          <v-btn variant="text" size="small" density="comfortable" prepend-icon="mdi-paperclip" :disabled="!viva(item)"
                 :title="viva(item) ? 'Ver sus documentos' : 'La orden está anulada'" @click.stop="abrirDocumentos(item)">
            {{ item.documentos }}
          </v-btn>
        </template>

        <template v-slot:item.actions="{ item }">
          <v-btn icon="mdi-dots-vertical" variant="text" density="comfortable" color="grey-darken-1"
                 :disabled="!accionesDe([item]).length" @click.stop="alBotonDeFila($event, item)" />
        </template>

        <template v-slot:expanded-row="{ columns, item }">
          <tr class="fila-activa">
            <td :colspan="columns.length" class="pa-0">
              <table-rental-details v-model:seleccion="equipos_seleccionados" :order="item" :muestra-fecha="!hayEspacio"
                                    @editar="abrirEditarOrden(item)" @reload="cargarItems(item.id)" />
            </td>
          </tr>
        </template>
      </v-data-table-server>
    </table-loading-overlay>
      <template #lado>
        <panel-facturas :order_type="ALQUILER" :orden="foco" :ordenes_seleccionadas="ordenes_seleccionadas"
                        :acciones-de="accionesDeCobro" :ejecutar-accion="ejecutarAccion"
                        @limpiar-seleccion="ordenes_seleccionadas = []" @limpiar-foco="cerrarCobro" />
      </template>
    </resizable-split>

    <state-legend titulo="Estados del equipo:" :estados="ESTADOS_ALQUILER" />

    <!-- Con órdenes marcadas, la factura que se elige en el buscador del panel las vincula. -->
    <selection-bar
      :count="ordenes_seleccionadas.length"
      label="seleccionada(s)"
      :acciones="accionesDe(ordenes_seleccionadas)"
      @accion="clave => ejecutarAccion(clave, ordenes_seleccionadas)"
      @clear="ordenes_seleccionadas = []"
    />

    <action-menu v-model:menu="menu" :acciones="accionesDe(menu.filas)"
                 @accion="clave => ejecutarAccion(clave, menu.filas)" />

    <!-- MODALES -->
    <add-order ref="editarOrdenRef" @guardada="o => fetchAndInjectSingleOrder({ detail: o.id })" />
    
  </div>
</template>

<script setup>
import { computed, ref, watch, onMounted, onUnmounted } from 'vue'
import FluentPagination from '@/components/commonComponents/FluentPagination.vue'
import TableLoadingOverlay from '@/components/commonComponents/TableLoadingOverlay.vue'
import OrderDataService from '@/services/orders/orderDataService'
import ClientSelect from '@/components/shared/ClientSelect.vue'
import OrderPills from '../OrderPills.vue'
import OrderProgress from '../OrderProgress.vue'
import DateRangeFilter from '@/components/shared/DateRangeFilter.vue'
import OrderMappers from '@/mappers/orderMappers'
import ActionMenu from '@/components/shared/ActionMenu.vue'
import { useOrderActions } from '@/composables/useOrderActions'
import { useOrderCobro } from '@/composables/useOrderCobro'
import { seguirLaLista, unaSolaSeleccion } from '@/composables/useCurrentRows'
import { useOrderColumns } from '@/composables/useOrderColumns'
import { fechaCorta } from '@/utils/dates'
import { ALQUILER, FILTRO_DE_ESTADO, esAlquiler, viva } from '@/utils/orders/estado'
import { useLatestRequest } from '@/composables/useLatestRequest'
import { useOrderItems } from '@/composables/useOrderItems'
import { useOrderRouteFilters } from '@/composables/useOrderRouteFilters'
import { usePage } from '@/composables/usePage'
import { debounce } from '@/utils/debounce'
import { throttle } from '@/utils/throttle'
import { getColorSemaforoFinanciero, getIconoSemaforoFinanciero, getTextoSemaforoFinanciero } from '@/utils/orders/cobro'
import { leerPagina } from '@/utils/pagination'
import { useAppStore } from '@/stores/appStore'
import AddOrder from '../AddOrder.vue'
import TableRentalDetails from './TableRentalDetails.vue'
import PanelFacturas from '../PanelFacturas.vue'
import ResizableSplit from '@/components/shared/ResizableSplit.vue'
import SelectionBar from '@/components/commonComponents/SelectionBar.vue'
import StateLegend from '@/components/shared/StateLegend.vue'
import { ESTADOS_ALQUILER } from '@/utils/orders/alquiler'

const appStore = useAppStore()

// ── Búsqueda paginada de clientes (autocomplete del filtro) ──
const filter_client_id = ref(null)

const ordenes_seleccionadas = ref([])
// Los de la orden abierta.
const equipos_seleccionados = ref([])
unaSolaSeleccion(ordenes_seleccionadas, equipos_seleccionados)

const columnas = [
  { title: 'Nro Alquiler',      key: 'order_number' },
  { title: 'Cliente',           key: 'client_data.name' },
  { title: 'Equipos',           key: 'progress',    align: 'center', sortable: false },
  { title: 'Documentos',        key: 'documentos',  align: 'center', sortable: false, conEspacio: true },
  { title: 'Estado Financiero', key: 'vinculo_financiero', align: 'center', sortable: false },
  { title: 'Opciones',          key: 'actions',     align: 'center', sortable: false },
  { title: '',                  key: 'data-table-expand' },
]
const { anchoDeLaLista, hayEspacio, headers, claveDeLaTabla } = useOrderColumns(columnas)

// ── Tabla + filtros ──
const orders = ref([])
seguirLaLista(orders, ordenes_seleccionadas)
const { foco, abierto: enCobro, abrirCobro, cerrarCobro, alSemaforo } = useOrderCobro(orders, ordenes_seleccionadas)
const { expanded, idOrdenExpandida, isOrderExpanded, cargarItems, reemplazarOrdenes } = useOrderItems(orders, 'rentals')
watch(idOrdenExpandida, () => { equipos_seleccionados.value = [] })
const filter_order = ref('')
const filter_client_ref = ref('')
const filter_invoice = ref('')
const filter_date_gt = ref('')
const filter_date_lt = ref('')
const filter_status = ref('')
const mostrar_filtros_avanzados = ref(false)
const pildora = ref(null)
const cuentas = computed(() => ({ missing_payment: appStore.pendingPaymentsRentalCount,
                                  a_credito: appStore.pendingCreditRentalCount,
                                  missing_invoice: appStore.pendingInvoicesRentalCount }))


const loading_list = ref(false)
const total_orders = ref(0)
const { opciones: options, alInicio } = usePage(() => retrieveOrders())

// ── Data ──
const { begin: beginOrdersLoad, isLatest: isLatestOrdersLoad } = useLatestRequest()

const retrieveOrders = () => {
  loading_list.value = true
  const token = beginOrdersLoad()   // guard de secuencia: gana la carga más reciente
  OrderDataService.getFiltered(
    options.value.page, options.value.itemsPerPage, filter_client_id.value, filter_order.value,
    filter_client_ref.value, filter_date_gt.value, filter_date_lt.value,
    filter_status.value, 2, pildora.value,
    filter_invoice.value
  ).then(res => {
    if (!isLatestOrdersLoad(token)) return   // llegó una carga más nueva → no pisar
    const pagina = leerPagina(res.data)
    reemplazarOrdenes(pagina.filas.map(orden => OrderMappers.getMap(orden)))
    total_orders.value = pagina.total
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
  alInicio()
  cargarResumenes() // Sincroniza las píldoras al filtrar
}

const limpiarFechas = () => { filter_date_gt.value = ''; filter_date_lt.value = ''; applyFilters() }

// ── WebSockets ──
const handleWssReload = () => { retrieveOrders(); refrescarResumenes() }

const fetchAndInjectSingleOrder = (event) => {
  OrderDataService.getFila(event.detail).then(response => {
    const fila = response?.data
    if (!fila || !esAlquiler(fila)) return

    const index = orders.value.findIndex(o => o.id === fila.id)
    if (index !== -1) Object.assign(orders.value[index], fila)

    // Las lineas no tienen avisos propios: cambian con los de su orden.
    if (String(idOrdenExpandida()) === String(fila.id)) cargarItems(fila.id)
    refrescarResumenes()
  }).catch(() => {})
}

// ── Filas / expansión ──
const manejarClicFila = (event, { item }) => {
  if (event.target.closest('button') || event.target.closest('.v-btn') || event.target.closest('.v-chip') || event.target.closest('.v-data-table__expand-icon')) return
  expanded.value = isOrderExpanded(item) ? [] : [item.raw || item]
}


// ── Acciones ──
const editarOrdenRef = ref(null)
const abrirEditarOrden = (o) => editarOrdenRef.value?.editar(o)
const abrirDocumentos = (o) => editarOrdenRef.value?.editar(o, 'documentos')

const { menu, alClickDerecho, alBotonDeFila, estaEnElMenu, accionesDe, accionesDeCobro, ejecutarAccion } =
  useOrderActions(orders, ordenes_seleccionadas, {
    editar: abrirEditarOrden,
    abrirCobro,
  })

// ── Watchers ──
useOrderRouteFilters(filter_order, pildora, applyFilters)
watch([filter_order, filter_client_ref, filter_invoice, filter_client_id, filter_status], debounce(applyFilters))

onMounted(() => {
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
