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

        <filter-pill
          :active="filtro_falta_pago"
          :count="appStore.pendingPaymentsServiceCount"
          color="error"
          icon="mdi-cash-remove"
          tooltip="Filtrar órdenes facturadas pero sin abonos"
          @click="toggleFiltroPago"
        >Falta Pago</filter-pill>

        <filter-pill
          :active="filtro_a_credito"
          :count="appStore.pendingCreditServiceCount"
          color="teal"
          icon="mdi-calendar-clock"
          tooltip="Filtrar órdenes a crédito que aún no vencen"
          @click="toggleFiltroCredito"
        >A Crédito</filter-pill>

        <filter-pill
          :active="filtro_sin_factura"
          :count="appStore.pendingInvoicesServiceCount"
          color="warning"
          icon="mdi-file-document-remove-outline"
          tooltip="Filtrar órdenes abiertas pendientes de facturar"
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
          <span :class="item.status === 4 ? 'anulado-atenuado' : ''">{{ item.client_data.name }}</span>
        </template>

        <template v-slot:item.progress="{ item }">
          <div v-if="item.status !== 4 && getProgreso(item).total > 0" class="mx-auto" style="width: 100px;">
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


        <template v-slot:item.actions="{ item }">
          <v-btn icon="mdi-dots-vertical" variant="text" density="comfortable" color="grey-darken-1"
                 @click.stop="alBotonDeFila($event, item)" />
        </template>

        <template v-slot:expanded-row="{ columns, item }">
          <tr class="fila-activa">
            <td :colspan="columns.length" class="pa-0">
              <table-service-details
                :order="item"
                @reload="retrieveOrders"
                @add-extra="prepareExtraEquipment(item)"
                @edit-certificate="openCertificateModal"
                @accion-certificados="abrirBatchModal"
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
    <batch-action-modal ref="batchActionModalRef" />

    <dialog-factura v-model="factura_modal" :order="selected_order" :orders="ordenes_factura_multi" :order_type="1" @updateOrder="onFacturaGuardada" @close="cerrarFacturaModal" />
    <edit-order v-model="edit_order_modal" :order="selected_order" @updateOrder="updateSingleOrderInList" @close="edit_order_modal = false" />
    <add-extra-equipment v-model="dialog_extra" :order="selected_order" @close="dialog_extra = false" @reload="retrieveOrders" />
    <certificate-modal ref="certificateModalRef" />
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useTheme } from 'vuetify'
import { useAppStore } from '@/stores/appStore'
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
import { debounce } from '@/utils/debounce'
import { throttle } from '@/utils/throttle'
import { getColorSemaforoFinanciero, getIconoSemaforoFinanciero, getTextoSemaforoFinanciero } from '@/utils/orders/cobro'
import FluentPagination from '@/components/commonComponents/FluentPagination.vue'
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
const filtro_falta_pago = ref(false)
const filtro_a_credito = ref(false)
const filtro_sin_factura = ref(false)

// Texto computado para el calendario elegante

// Estados de modales
const edit_order_modal = ref(false)
const dialog_extra = ref(false)
const factura_modal = ref(false)
const ordenes_factura_multi = ref(null) // órdenes para crear UNA factura por selección
const selected_order = ref(null)
const certificateModalRef = ref(null)
const batchActionModalRef = ref(null)

// Con uno solo la fila va marcada aunque ya tenga lo suyo, como en Certificados.
const abrirBatchModal = (accion, certs) => {
  batchActionModalRef.value?.open(accion, certs, certs.length === 1)
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
  { title: 'Opciones', key: 'actions', align: 'center', sortable: false },
  { title: '', key: 'data-table-expand' },
]

// Datos de tabla
const orders = ref([])
const expanded = ref([])
const { cargarItems, actualizarItems, reemplazarOrdenes } = useOrderItems(orders, 'certificates')

// --- LÓGICA DE EXPANSIÓN ROBUSTA (Resiliencia a return-object) ---
const getSafeId = (val) => {
  if (!val) return null
  return typeof val === 'object' ? (val.id || val.raw?.id || val.value) : val
}

const isOrderExpanded = (item) => {
  const targetId = getSafeId(item)
  return expanded.value.some(e => getSafeId(e) === targetId)
}

// Una sola orden abierta a la vez.
watch(expanded, (newVal) => {
  if (newVal.length > 1) {
    expanded.value = [newVal[newVal.length - 1]]
    return
  }
  if (expanded.value.length === 1) {
    cargarItems(getSafeId(expanded.value[0]), { mostrarCarga: true })
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

// Guard de secuencia: solo aplica la carga mas reciente.
const { begin: beginOrdersLoad, isLatest: isLatestOrdersLoad } = useLatestRequest()

// Funciones de filtro
const applyFilters = () => {
  // Si el panel de facturas está maximizado, tapa la tabla: al filtrar lo
  // achicamos para que se vean los resultados.
  panel_expandido.value = false
  options.value.page = 1
  retrieveOrders()
  cargarResumenes() // Sincroniza las píldoras cada vez que filtras
}

// Falta pago y A credito no comparten ordenes: prender una apaga la otra.
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

const toggleFiltroFactura = () => {
  filtro_sin_factura.value = !filtro_sin_factura.value
  applyFilters()
}

// Las pildoras de cobro, con los filtros de la pantalla.
const cargarResumenes = () => Promise.all([
  OrderDataService.getPendingPaymentsSummary(1, filter_client_id.value, filter_order.value, filter_correlative.value, filter_date_gt.value, filter_date_lt.value, filter_invoice.value)
    .then((res) => { appStore.setPendingPaymentsServiceCount(res.data.pending_payments) }).catch(() => {}),
  OrderDataService.getPendingInvoicesSummary(1, filter_client_id.value, filter_order.value, filter_correlative.value, filter_date_gt.value, filter_date_lt.value, filter_invoice.value)
    .then((res) => { appStore.setPendingInvoicesServiceCount(res.data.pending_invoices) }).catch(() => {}),
  OrderDataService.getPendingCreditSummary(1, filter_client_id.value, filter_order.value, filter_correlative.value, filter_date_gt.value, filter_date_lt.value, filter_invoice.value)
    .then((res) => { appStore.setPendingCreditServiceCount(res.data.pending_credit) }).catch(() => {}),
])

// Las mismas, cuando las pide un aviso: con el freno de los contadores.
const refrescarResumenes = throttle(cargarResumenes)


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
    filtro_a_credito.value,
    filter_invoice.value
  )
      .then((res) => {
        if (!isLatestOrdersLoad(token)) return   // llegó una carga más nueva → no pisar
        reemplazarOrdenes(res.data.results.map(orden => OrderMappers.getMap(orden)), idOrdenExpandida())
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


const getCurrencySymbol = (currency) => {
  const symbols = { 'PEN': 'S/', 'USD': '$', 'EUR': '€' }
  return symbols[currency] || 'S/'
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

// Una sola factura para todas: DialogFactura la crea y les vincula las ordenes.
// La moneda se elige ahi, la orden no tiene.
const facturar = (ordenes) => {
  selected_order.value = null
  ordenes_factura_multi.value = [...ordenes]
  factura_modal.value = true
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
  return o.progreso || { total: 0, listos: 0 }
}

const prepareExtraEquipment = (o) => {
  selected_order.value = o
  dialog_extra.value = true
}

const abrirEditarOrden = (o) => {
  // El modal solo usa los equipos con su dueño; el resto ya lo tiene la fila.
  OrderDataService.getEquipos(o.id).then(response => {
    selected_order.value = { ...o, certificates: response.data || [] }
    edit_order_modal.value = true
  }).catch(() => {
    selected_order.value = { ...o, certificates: [] }
    edit_order_modal.value = true
  })
}

const { menu, alClickDerecho, alBotonDeFila, estaEnElMenu, accionesDe, ejecutarAccion } =
  useOrderActions(ordenes_seleccionadas, {
    editar: abrirEditarOrden,
    agregarEquipo: prepareExtraEquipment,
    facturar,
  })

const idOrdenExpandida = () => (
  expanded.value.length === 1 ? getSafeId(expanded.value[0]) : null
)

// WebSockets
// La fila de la orden: barra, estado y cobro. Sus equipos tienen sus propios
// avisos, los de cada certificado.
// Devuelve la fila si la orden es de servicio, o null.
const refrescarFila = (orderId) => OrderDataService.getFila(orderId)
  .then(response => {
    const fila = response?.data
    if (!fila || (fila.order_type !== 1 && fila.order_type)) return null

    // Se vuelca tal cual: trae solo campos de fila, asi que no pisa los
    // equipos ni los abonos que la lista ya tenia.
    const index = orders.value.findIndex(o => o.id === fila.id)
    if (index !== -1) Object.assign(orders.value[index], fila)
    return fila
  })
  .catch(() => null)

// Cambio la orden (sus datos, facturas, abonos o cuantos equipos vivos tiene):
// la fila y las pildoras de cobro.
const fetchAndInjectSingleOrder = (event) => {
  refrescarFila(event.detail).then(fila => { if (fila) refrescarResumenes() })
}

// Solo cambio la barra: un equipo cambio de estado sin tocar el cobro.
const refrescarProgreso = (event) => refrescarFila(event.detail)

// Los certificados que cambiaron se reemplazan en su fila de la orden abierta.
const aplicarEquiposCambiados = (event) => actualizarItems(idOrdenExpandida(), [].concat(event.detail))

// Se creo o se borro un certificado: cambio quien esta en la orden.
const recargarEquiposPorWebSocket = () => cargarItems(idOrdenExpandida())

const updateSingleOrderInList = (updatedOrder) => {
  const index = orders.value.findIndex(o => o.id === updatedOrder.id)
  if (index !== -1) {
    // Los equipos los trae useOrderItems; el resto de la orden no los pisa.
    const equipos = orders.value[index].certificates
    Object.assign(orders.value[index], OrderMappers.getMap(updatedOrder), { certificates: equipos })
  }
}

const handleWssReload = () => {
  retrieveOrders()
  refrescarResumenes()
}

// Watchers (igual que en ListCertificates)
watch(options, () => { retrieveOrders() }, { deep: true })

// Quitamos filter_date_gt y filter_date_lt para que solo se apliquen con el botón "Aplicar"
// Debounce: espera a que el usuario deje de teclear antes de pegarle al backend.
watch([filter_order, filter_correlative, filter_invoice, filter_client_id, filter_status], debounce(applyFilters))

// Ciclo de vida
watch(() => route.query.buscar_orden, (val) => {
  if (val) filter_order.value = val
})

watch(() => route.query.buscar_factura, (val) => {
  if (val) filter_invoice.value = val
})

// Desde Inicio ("Ver los N") llegan las pildoras ya activadas.
const aplicarPildorasDeRuta = () => {
  let cambio = false
  if (route.query.sin_factura) { filtro_sin_factura.value = true; cambio = true }
  if (route.query.falta_pago)  { filtro_falta_pago.value = true; filtro_a_credito.value = false; cambio = true }
  if (cambio) applyFilters()
}
watch(() => [route.query.sin_factura, route.query.falta_pago], aplicarPildorasDeRuta)

onMounted(() => {
  if (route.query.buscar_orden) {
    filter_order.value = route.query.buscar_orden
  }
  if (route.query.buscar_factura) {
    filter_invoice.value = route.query.buscar_factura
  }
  aplicarPildorasDeRuta()

  cargarResumenes() // Cargamos el número para el badge rojo
  retrieveOrders()
  window.addEventListener('wss-reload-orders-service', handleWssReload)
  window.addEventListener('wss-update-order-row', fetchAndInjectSingleOrder)
  window.addEventListener('wss-update-order-progress', refrescarProgreso)
  window.addEventListener('wss-update-row', aplicarEquiposCambiados)
  window.addEventListener('wss-update-rows', aplicarEquiposCambiados)
  window.addEventListener('wss-reload-certificates', recargarEquiposPorWebSocket)
})

onUnmounted(() => {
  window.removeEventListener('wss-reload-orders-service', handleWssReload)
  window.removeEventListener('wss-update-order-row', fetchAndInjectSingleOrder)
  window.removeEventListener('wss-update-order-progress', refrescarProgreso)
  window.removeEventListener('wss-update-row', aplicarEquiposCambiados)
  window.removeEventListener('wss-update-rows', aplicarEquiposCambiados)
  window.removeEventListener('wss-reload-certificates', recargarEquiposPorWebSocket)
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
.v-theme--light .tabla-ordenes-servicio tbody tr:not(.fila-padre-activa):not(.fila-activa):not(.fila-en-menu):hover > td {
  background-color: rgba(0, 0, 0, 0.04) !important;
}
.v-theme--dark .tabla-ordenes-servicio tbody tr:not(.fila-padre-activa):not(.fila-activa):not(.fila-en-menu):hover > td {
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