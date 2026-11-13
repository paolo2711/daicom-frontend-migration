<template>
  <pdf-drop-zone label="Suelta el PDF para subir la factura" @file="subir" @invalid="avisarSoloPdf">
    <filter-bar>
      <v-text-field v-model="filtros.q" hide-details density="compact" prepend-inner-icon="mdi-magnify"
                    variant="outlined" label="Buscar N.°" clearable />
      <v-select v-model="filtros.estado" :items="FILTRO_DE_ESTADO" item-title="name" item-value="id"
                prepend-inner-icon="mdi-list-status" label="Estado" clearable
                density="compact" variant="outlined" hide-details />
      <v-select v-model="filtros.currency" :items="MONEDAS" prepend-inner-icon="mdi-currency-usd" label="Moneda"
                clearable density="compact" variant="outlined" hide-details />
      <v-select v-model="filtros.detraccion" :items="DETRACCION" prepend-inner-icon="mdi-percent-outline"
                label="Detracción" clearable density="compact" variant="outlined" hide-details />
      <v-select v-model="filtros.tipo" :items="TIPO" prepend-inner-icon="mdi-file-document-outline" label="Tipo"
                clearable density="compact" variant="outlined" hide-details />
      <v-select v-model="filtros.order_type" :items="TIPO_DE_ORDEN" prepend-inner-icon="mdi-briefcase-outline"
                label="Órdenes de" clearable density="compact" variant="outlined" hide-details />
    </filter-bar>

    <pdf-split-view v-model="vista" :items="facturas" :pdf-de="f => f.pdf_url" :titulo-de="tituloDe" clave="facturas">
      <table-loading-overlay :loading="cargando" :isEmpty="facturas.length === 0">
        <v-data-table-server :headers="columnas" :items="facturas" :items-length="total" :loading="cargando"
                             item-value="id" class="elevation-0 rounded-lg tabla-mejorada bg-surface"
                             v-model:page="opciones.page" v-model:items-per-page="opciones.itemsPerPage"
                             hide-default-footer
                             @click:row="(_, { item }) => abrir(item)"
                             @contextmenu:row="alClickDerecho"
                             :row-props="({ item }) => ({ class: {
                               'fila-en-menu': estaEnElMenu(item), 'fila-con-pdf': Boolean(item.pdf_url),
                               'fila-en-vista': item.id === vista,
                             } })">
          <template #bottom>
            <fluent-pagination v-model:page="opciones.page" v-model:itemsPerPage="opciones.itemsPerPage"
                               :totalItems="total" />
          </template>
          <!-- El color de la pildora es el estado; la leyenda va debajo de la tabla. -->
          <template #item.numero="{ item }">
            <v-chip :color="estadoDe(item).color" class="font-weight-bold">
              {{ item.invoice_number || 'Sin número' }}
            </v-chip>
            <div v-if="!item.es_fiscal" class="text-caption text-medium-emphasis">Sin comprobante</div>
          </template>
          <template #item.fecha="{ item }">
            <div class="text-no-wrap">{{ fechaCorta(item.invoice_date) || '—' }}</div>
            <div v-if="vencimiento(item)" class="text-caption" :class="`text-${vencimiento(item).color}`">
              {{ vencimiento(item).texto }}
            </div>
          </template>
          <template #item.cliente="{ item }">{{ item.cliente || '—' }}</template>
          <template #item.monto="{ item }">
            <div class="font-weight-medium text-no-wrap">{{ montoDe(item) ? monto(item.amount, item.currency) : '—' }}</div>
            <div v-if="saldoDe(item)" class="text-caption text-no-wrap" :class="saldoDe(item).clase">{{ saldoDe(item).texto }}</div>
          </template>
          <template #item.detraccion="{ item }">
            <span v-if="item.detraccion_applies" class="text-deep-orange font-weight-medium text-no-wrap">
              {{ monto(item.detraccion_amount, item.currency) }}
            </span>
            <span v-else class="text-disabled">—</span>
          </template>
          <template #item.abonado="{ item }">
            <template v-if="item.total_pagado > 0">
              <div class="text-success font-weight-medium text-no-wrap">{{ monto(item.total_pagado, item.currency) }}</div>
              <div class="text-caption text-medium-emphasis text-no-wrap">{{ item.payments.length }} abono(s)</div>
            </template>
            <span v-else class="text-disabled">—</span>
          </template>
          <template #item.ordenes="{ item }">
            <div v-for="o in item.ordenes_vinculadas" :key="o.order_id" class="text-no-wrap">{{ o.order_number }}</div>
            <span v-if="!item.ordenes_vinculadas.length" class="text-disabled">—</span>
          </template>
          <template #item.acciones="{ item }">
            <v-btn icon="mdi-dots-vertical" variant="text" density="comfortable" color="grey-darken-1"
                   @click.stop="alBotonDeFila($event, item)" />
          </template>
        </v-data-table-server>
      </table-loading-overlay>
    </pdf-split-view>

    <state-legend titulo="Estados de la factura:" :estados="ESTADOS" />

    <action-menu v-model:menu="menu" :acciones="accionesDe(menu.filas)"
                 @accion="clave => ejecutarAccion(clave, menu.filas)" />
    <dialog-invoice v-model="creando" :pdf="pdfSoltado" @close="pdfSoltado = null" />
    <dialog-invoice v-model="editando" :invoice-to-edit="enEdicion" @close="enEdicion = null" />
    <dialog-invoice-payments v-model="enAbonos" :invoice="conAbonos" @close="enAbonos = false" />
  </pdf-drop-zone>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import TableLoadingOverlay from '@/components/commonComponents/TableLoadingOverlay.vue'
import FluentPagination from '@/components/commonComponents/FluentPagination.vue'
import PdfDropZone from '@/components/commonComponents/PdfDropZone.vue'
import ActionMenu from '@/components/shared/ActionMenu.vue'
import FilterBar from '@/components/shared/FilterBar.vue'
import PdfSplitView from '@/components/shared/PdfSplitView.vue'
import StateLegend from '@/components/shared/StateLegend.vue'
import { useContextMenu } from '@/composables/useContextMenu'
import { useLatestRequest } from '@/composables/useLatestRequest'
import { useSwal } from '@/composables/useSwal'
import InvoiceMappers from '@/mappers/invoiceMappers'
import BillingDataService from '@/services/billing/billingDataService'
import { accionesPara } from '@/utils/actions'
import { ACCIONES_FACTURA } from '@/utils/billing/acciones'
import { FILTRO_DE_ESTADO, desvincular, estadoDe, montoDe, saldoDe } from '@/utils/billing/facturas'
import { fechaCorta } from '@/utils/dates'
import { debounce } from '@/utils/debounce'
import { avisarHecho } from '@/utils/documents/avisos'
import { mensajeDeError } from '@/utils/errors'
import { MONEDAS, monto } from '@/utils/money'
import { vencimiento } from '@/utils/orders/cobro'
import { ALQUILER, ESTADOS, SERVICIO } from '@/utils/orders/estado'
import { abrirEnOtraPestana, avisarSoloPdf } from '@/utils/pdf'
import DialogInvoice from './DialogInvoice.vue'
import DialogInvoicePayments from './DialogInvoicePayments.vue'

const swal = useSwal()

const DETRACCION = [{ title: 'Con detracción', value: 'si' }, { title: 'Sin detracción', value: 'no' }]
const TIPO = [{ title: 'Facturas', value: 'fiscal' }, { title: 'Sin comprobante', value: 'interna' }]
const TIPO_DE_ORDEN = [{ title: 'Servicio', value: SERVICIO }, { title: 'Alquiler', value: ALQUILER }]

const EN_LA_LISTA_ANGOSTA = ['numero', 'fecha', 'cliente']
const columnas = computed(() => [
  { title: 'Factura', key: 'numero', sortable: false },
  { title: 'Fecha', key: 'fecha', sortable: false },
  { title: 'Cliente', key: 'cliente', sortable: false },
  { title: 'Monto', key: 'monto', align: 'end', sortable: false },
  { title: 'Detracción', key: 'detraccion', align: 'end', sortable: false },
  { title: 'Abonado', key: 'abonado', align: 'end', sortable: false },
  { title: 'Órdenes', key: 'ordenes', sortable: false },
  { title: 'Opciones', key: 'acciones', align: 'center', sortable: false },
].filter(c => vista.value === null || EN_LA_LISTA_ANGOSTA.includes(c.key)))

const facturas = ref([])
const total = ref(0)
const cargando = ref(false)
const opciones = ref({ page: 1, itemsPerPage: 30 })
const filtros = ref({ q: '', estado: null, currency: null, detraccion: null, tipo: null, order_type: null })
const vista = ref(null)
const tituloDe = (factura) => [factura.invoice_number, factura.cliente].filter(Boolean).join(' · ')

const { begin, isLatest } = useLatestRequest()

async function recargar () {
  cargando.value = true
  const turno = begin()
  const conValor = Object.fromEntries(Object.entries(filtros.value).filter(([, v]) => v))
  try {
    const { page, itemsPerPage } = opciones.value
    const { data } = await BillingDataService.listInvoices({ ...conValor, page, page_size: itemsPerPage })
    if (!isLatest(turno)) return
    facturas.value = data.results.map(InvoiceMappers.getMap)
    total.value = data.count
  } catch {
    if (!isLatest(turno)) return
    facturas.value = []
    total.value = 0
  } finally {
    if (isLatest(turno)) cargando.value = false
  }
}

// Una factura cambio (abono, estado, edicion): se trae solo esa; si no esta en la pagina, se recarga.
async function refrescarFila (event) {
  const posicion = facturas.value.findIndex(f => f.id === event.detail)
  if (posicion === -1) return recargar()
  try {
    const fresca = (await BillingDataService.listInvoices({ invoice_id: event.detail })).data.results[0]
    if (!fresca) return recargar()
    facturas.value[posicion] = InvoiceMappers.getMap(fresca)
    if (conAbonos.value?.id === event.detail) conAbonos.value = facturas.value[posicion]
  } catch {
    recargar()
  }
}

const creando = ref(false)
const pdfSoltado = ref(null)
const editando = ref(false)
const enEdicion = ref(null)
const enAbonos = ref(false)
const conAbonos = ref(null)

function subir (pdf = null) {
  pdfSoltado.value = pdf
  creando.value = true
}

function abrirAbonos (factura) {
  conAbonos.value = factura
  enAbonos.value = true
}

// Con PDF se ve al costado; sin PDF (las sin comprobante) se abren sus abonos.
function abrir (factura) {
  if (factura.pdf_url) vista.value = factura.id
  else abrirAbonos(factura)
}

async function desvincularUna (factura) {
  const ordenes = factura.ordenes_vinculadas
  let orden = ordenes[0]
  if (ordenes.length > 1) {
    const { value } = await swal.fire({
      title: '¿De qué orden?', input: 'select', showCancelButton: true, cancelButtonText: 'Cancelar',
      inputOptions: Object.fromEntries(ordenes.map(o => [o.order_id, o.order_number])),
    })
    orden = ordenes.find(o => String(o.order_id) === value)
  }
  if (orden && await desvincular(factura, orden)) recargar()
}

async function eliminar (factura) {
  const vinculadas = factura.ordenes_vinculadas.length
  const { isConfirmed } = await swal.fire({
    title: '¿Eliminar esta factura?', icon: 'warning', showCancelButton: true,
    html: `<b>${factura.invoice_number || 'Sin número'}</b><br>`
      + (vinculadas ? `Está vinculada a ${vinculadas} ${vinculadas === 1 ? 'orden' : 'órdenes'}. ` : '')
      + 'Se eliminará la factura y todos sus abonos.',
    confirmButtonText: 'Sí, eliminar', cancelButtonText: 'Cancelar',
  })
  if (!isConfirmed) return
  try {
    await BillingDataService.deleteInvoice(factura.id)
    avisarHecho('Factura eliminada')
    recargar()
  } catch (error) {
    swal.fire({ icon: 'error', title: 'No se eliminó', text: mensajeDeError(error, 'No se pudo eliminar.') })
  }
}

const { menu, alClickDerecho, alBotonDeFila, estaEnElMenu } = useContextMenu()
const accionesDe = (filas) => accionesPara(ACCIONES_FACTURA, filas, () => true)
function ejecutarAccion (clave, [factura]) {
  switch (clave) {
    case 'pdf': return abrirEnOtraPestana(factura.pdf_url)
    case 'abonos': return abrirAbonos(factura)
    case 'editar':
      enEdicion.value = factura
      return nextTick(() => { editando.value = true })
    case 'desvincular': return desvincularUna(factura)
    case 'eliminar': return eliminar(factura)
  }
}

watch(opciones, recargar, { deep: true })
watch(filtros, debounce(() => {
  if (opciones.value.page === 1) recargar()
  else opciones.value.page = 1
}), { deep: true })

onMounted(() => {
  recargar()
  window.addEventListener('wss-reload-invoices', recargar)
  window.addEventListener('wss-update-invoice-row', refrescarFila)
})
onUnmounted(() => {
  window.removeEventListener('wss-reload-invoices', recargar)
  window.removeEventListener('wss-update-invoice-row', refrescarFila)
})

defineExpose({ nuevo: () => subir() })
</script>
