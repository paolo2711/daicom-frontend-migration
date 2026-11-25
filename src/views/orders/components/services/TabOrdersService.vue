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

    <resizable-split v-model:ancho-de-la-lista="anchoDeLaLista" v-model:abierto="enCobro" clave="ordenes.servicio" class="mt-2">
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
          <order-progress :orden="item" listos="Equipos" />
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

        <template v-slot:item.actions="{ item }">
          <v-btn icon="mdi-dots-vertical" variant="text" density="comfortable" color="grey-darken-1"
                 :disabled="!accionesDe([item]).length" @click.stop="alBotonDeFila($event, item)" />
        </template>

        <template v-slot:expanded-row="{ columns, item }">
          <tr class="fila-activa">
            <td :colspan="columns.length" class="pa-0">
              <table-service-details
                v-model:seleccion="equipos_seleccionados"
                :order="item"
                :muestra-fecha="!hayEspacio"
                @reload="retrieveOrders"
                @editar="abrirEditarOrden(item)"
                @edit-certificate="openCertificateModal"
                @accion-certificados="abrirBatchModal"
                @lineas-cambiaron="alCambiarLineas(item)"
              />
            </td>
          </tr>
        </template>
      </v-data-table-server>
    </table-loading-overlay>
      <template #lado>
        <panel-facturas :order_type="SERVICIO" :orden="foco" :ordenes_seleccionadas="ordenes_seleccionadas"
                        :acciones-de="accionesDeCobro" :ejecutar-accion="ejecutarAccion"
                        @limpiar-seleccion="ordenes_seleccionadas = []" @limpiar-foco="cerrarCobro" />
      </template>
    </resizable-split>

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
    <batch-action-modal ref="batchActionModalRef" @hecha="soltarEquipos" />

    <add-order ref="editarOrdenRef" @guardada="alCambiarLineas" />
    <certificate-modal ref="certificateModalRef" />
  </div>
</template>

<script setup>
import { computed, ref, watch, onMounted, onUnmounted } from 'vue'
import { useAppStore } from '@/stores/appStore'
import { Toast } from '@/plugins/alerts'
import { mensajeDeError } from '@/utils/errors'
import { abrirIngreso } from '@/utils/orders/ingreso'
import OrderDataService from '@/services/orders/orderDataService'
import ClientSelect from '@/components/shared/ClientSelect.vue'
import OrderPills from '../OrderPills.vue'
import OrderProgress from '../OrderProgress.vue'
import DateRangeFilter from '@/components/shared/DateRangeFilter.vue'
import OrderMappers from '@/mappers/orderMappers'
import ActionMenu from '@/components/shared/ActionMenu.vue'
import { useOrderActions } from '@/composables/useOrderActions'
import { useOrderCobro } from '@/composables/useOrderCobro'
import { seguirLaLista, soltar, unaSolaSeleccion } from '@/composables/useCurrentRows'
import { useOrderColumns } from '@/composables/useOrderColumns'
import { fechaCorta } from '@/utils/dates'
import { FILTRO_DE_ESTADO, SERVICIO, esDeServicio, viva } from '@/utils/orders/estado'
import { lineaAnulada } from '@/utils/orders/lineas'
import { useLatestRequest } from '@/composables/useLatestRequest'
import { useOrderItems } from '@/composables/useOrderItems'
import { useOrderRouteFilters } from '@/composables/useOrderRouteFilters'
import { usePage } from '@/composables/usePage'
import { debounce } from '@/utils/debounce'
import { throttle } from '@/utils/throttle'
import { getColorSemaforoFinanciero, getIconoSemaforoFinanciero, getTextoSemaforoFinanciero } from '@/utils/orders/cobro'
import { leerPagina } from '@/utils/pagination'
import FluentPagination from '@/components/commonComponents/FluentPagination.vue'
import SelectionBar from '@/components/commonComponents/SelectionBar.vue'
import AddOrder from '../AddOrder.vue'
import TableServiceDetails from './TableServiceDetails.vue'
import TableLoadingOverlay from '@/components/commonComponents/TableLoadingOverlay.vue'
import CertificateModal from '@/views/certificates/components/CertificateModal.vue'
import PanelFacturas from '../PanelFacturas.vue'
import ResizableSplit from '@/components/shared/ResizableSplit.vue'
import { defineAsyncComponent } from 'vue'

const BatchActionModal = defineAsyncComponent(() => import('@/views/certificates/components/BatchActionModal.vue'))

const appStore = useAppStore()

// Estado UI Split-Screen
const ordenes_seleccionadas = ref([])
// Los de la orden abierta. Una sola seleccion a la vez: marcar equipos
// desmarca las ordenes (y el panel sale de vincular), y al reves.
const equipos_seleccionados = ref([])
unaSolaSeleccion(ordenes_seleccionadas, equipos_seleccionados)

// Nuevos estados UI de Filtros Avanzados y Chips
const mostrar_filtros_avanzados = ref(false)
const pildora = ref(null)
const cuentas = computed(() => ({ missing_payment: appStore.pendingPaymentsServiceCount,
                                  a_credito: appStore.pendingCreditServiceCount,
                                  missing_invoice: appStore.pendingInvoicesServiceCount }))

// Texto computado para el calendario elegante

// Estados de modales
const certificateModalRef = ref(null)
const batchActionModalRef = ref(null)

// Con uno solo la fila va marcada aunque ya tenga lo suyo, como en Certificados.
const abrirBatchModal = (accion, certs) => {
  batchActionModalRef.value?.open(accion, certs, certs.length === 1)
}
const soltarEquipos = (certs) => soltar(equipos_seleccionados, certs)

const openCertificateModal = (cert) => {
  certificateModalRef.value?.open(cert)
}

// Headers
const columnas = [
  { title: 'Nro Orden', key: 'order_number' },
  { title: 'Cliente', key: 'client_data.name' },
  { title: 'Progreso', key: 'progress', align: 'center', sortable: false },
  { title: 'Estado Financiero', key: 'vinculo_financiero', align: 'center', sortable: false },
  { title: 'Opciones', key: 'actions', align: 'center', sortable: false },
  { title: '', key: 'data-table-expand' },
]
const { anchoDeLaLista, hayEspacio, headers } = useOrderColumns(columnas)

// Datos de tabla
const orders = ref([])
seguirLaLista(orders, ordenes_seleccionadas)
const { foco, abierto: enCobro, abrirCobro, cerrarCobro, alSemaforo } = useOrderCobro(orders, ordenes_seleccionadas)
// Los avisos de equipos llegan por certificado: una linea se reconoce por el suyo.
const {
  expanded, idOrdenExpandida, isOrderExpanded, cargarItems, actualizarItems, reemplazarOrdenes,
} = useOrderItems(orders, 'items', { clave: linea => linea.certificate?.id, anulado: lineaAnulada })

// Los equipos marcados son de la orden abierta: al cambiar de orden se desmarcan.
watch(idOrdenExpandida, () => { equipos_seleccionados.value = [] })
const total_orders = ref(0)
const loading_list = ref(false)
const { opciones: options, alInicio } = usePage(() => retrieveOrders())

// Filtros
const filter_order = ref('')
const filter_correlative = ref('')
const filter_invoice = ref('')

const filter_client_id = ref(null)
const filter_date_gt = ref('')
const filter_date_lt = ref('')
const filter_status = ref('')

// Clientes

// Guard de secuencia: solo aplica la carga mas reciente.
const { begin: beginOrdersLoad, isLatest: isLatestOrdersLoad } = useLatestRequest()

// Funciones de filtro
const applyFilters = () => {
  alInicio()
  cargarResumenes() // Sincroniza las píldoras cada vez que filtras
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
  OrderDataService.getFiltered(
    options.value.page,
    options.value.itemsPerPage,
    filter_client_id.value,
    filter_order.value,
    filter_correlative.value,
    filter_date_gt.value,
    filter_date_lt.value,
    filter_status.value,
    1,
    pildora.value,
    filter_invoice.value
  )
      .then((res) => {
        if (!isLatestOrdersLoad(token)) return   // llegó una carga más nueva → no pisar
        const pagina = leerPagina(res.data)
        reemplazarOrdenes(pagina.filas.map(orden => OrderMappers.getMap(orden)))
        total_orders.value = pagina.total
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


const editarOrdenRef = ref(null)
const abrirEditarOrden = (o) => editarOrdenRef.value?.editar(o)

const imprimirIngreso = (o) => abrirIngreso(o.id)
  .catch(error => Toast.fire({ ...appStore.toastErrorRed,
                               title: mensajeDeError(error, 'No se pudo abrir el ingreso.') }))

const { menu, alClickDerecho, alBotonDeFila, estaEnElMenu, accionesDe, accionesDeCobro, ejecutarAccion } =
  useOrderActions(orders, ordenes_seleccionadas, {
    editar: abrirEditarOrden,
    imprimirIngreso,
    abrirCobro,
  })

// La fila de la orden (barra, estado y cobro), o null si no es de servicio. Los equipos avisan por su certificado.
const refrescarFila = (orderId) => OrderDataService.getFila(orderId)
  .then(response => {
    const fila = response?.data
    if (!fila || !esDeServicio(fila)) return null

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

// Una linea sin certificado no avisa sola: se recargan sus equipos y la barra de la fila.
function alCambiarLineas (orden) {
  cargarItems(orden.id)
  refrescarFila(orden.id)
}

const handleWssReload = () => {
  retrieveOrders()
  refrescarResumenes()
}

useOrderRouteFilters(filter_order, pildora, applyFilters)

// Las fechas no: se aplican con su botón.
watch([filter_order, filter_correlative, filter_invoice, filter_client_id, filter_status], debounce(applyFilters))

// Ciclo de vida
onMounted(() => {
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
