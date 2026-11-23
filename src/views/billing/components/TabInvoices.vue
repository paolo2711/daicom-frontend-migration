<template>
  <pdf-drop-zone label="Suelta el PDF para subir la factura" @file="subir" @invalid="avisarSoloPdf">
    <filter-bar>
      <v-text-field v-model="filtros.q" hide-details density="compact" prepend-inner-icon="mdi-magnify"
                    variant="outlined" label="Buscar N.° o cliente" clearable />
      <template #pildoras>
        <filter-pill v-for="p in PILDORAS_DE_FACTURAS" :key="p.valor" :active="filtros.pildora === p.valor"
                     :color="p.color" :icon="p.icono" :tooltip="p.detalle" @click="alternarPildora(p.valor)">
          {{ p.texto }}
        </filter-pill>
      </template>
      <template #avanzados>
        <v-col cols="12" sm="6" md="3">
          <date-range-filter v-model:desde="rango.desde" v-model:hasta="rango.hasta" label="Fecha de emisión"
                             clearable @apply="aplicarRango" @clear="limpiarRango" />
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <client-select v-model="filtros.cliente" />
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-select v-model="filtros.estado" :items="FILTRO_DE_ESTADO" item-title="name" item-value="id"
                    prepend-inner-icon="mdi-list-status" label="Estado" clearable
                    density="compact" variant="outlined" hide-details />
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-select v-model="filtros.currency" :items="MONEDAS" prepend-inner-icon="mdi-currency-usd" label="Moneda"
                    clearable density="compact" variant="outlined" hide-details />
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-select v-model="filtros.detraccion" :items="DETRACCION" prepend-inner-icon="mdi-percent-outline"
                    label="Detracción" clearable density="compact" variant="outlined" hide-details />
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-select v-model="filtros.order_type" :items="TIPO_DE_ORDEN" prepend-inner-icon="mdi-briefcase-outline"
                    label="Órdenes de" clearable density="compact" variant="outlined" hide-details />
        </v-col>
      </template>
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
            <v-chip :color="estadoDe(item).color"
                    :class="{ 'text-medium-emphasis': estadoDe(item).tenue }" class="font-weight-bold"
                    :title="tipoDe(item).texto">
              <v-icon start :icon="tipoDe(item).icono" />
              {{ item.invoice_number || 'Sin número' }}
            </v-chip>
          </template>
          <template #item.cliente="{ item }">
            <div>{{ item.cliente || '—' }}</div>
            <div v-if="item.ordenes_vinculadas.length" class="text-caption text-medium-emphasis">
              {{ item.ordenes_vinculadas.map(o => o.order_number).join(' · ') }}
            </div>
          </template>
          <template #item.fecha="{ item }">
            <div class="text-no-wrap">{{ fechaCorta(item.invoice_date) || '—' }}</div>
            <div class="text-caption text-no-wrap"
                 :class="condicionDe(item).vencida ? 'text-error' : 'text-medium-emphasis'">
              {{ condicionDe(item).texto }}
            </div>
          </template>
          <template #item.total="{ item }">
            <div class="font-weight-medium text-no-wrap">{{ montoDe(item) ? monto(item.amount, item.currency) : '—' }}</div>
            <div class="text-caption text-no-wrap text-medium-emphasis">
              {{ item.detraccion_applies ? `Detracción ${importe(item.detraccion_amount)}` : 'Sin detracción' }}
            </div>
            <div v-for="nota in item.notas" :key="nota.id" class="text-caption text-no-wrap"
                 :class="nota.estado === ACEPTADA ? 'text-medium-emphasis' : `text-${ESTADOS_SUNAT[nota.estado].color}`">
              {{ nota.estado === ACEPTADA ? 'Con nota' : 'Nota' }} {{ nota.numero }}
              {{ Number(nota.total) ? ` · − ${monto(nota.total, item.currency)}` : '' }}
              <template v-if="nota.estado !== ACEPTADA"> · {{ ESTADOS_SUNAT[nota.estado].texto }}</template>
            </div>
          </template>
          <template #item.cobro="{ item }">
            <div class="font-weight-medium text-no-wrap" :class="cobroDe(item).tono && `text-${cobroDe(item).tono}`">
              {{ cobroDe(item).texto }}
            </div>
            <v-progress-linear v-if="cobroDe(item).porcentaje !== null" :model-value="cobroDe(item).porcentaje"
                               color="success" bg-color="grey" rounded height="4" class="my-1" />
            <div v-if="cobroDe(item).detalle" class="text-caption text-no-wrap text-medium-emphasis">
              {{ cobroDe(item).detalle }}
            </div>
          </template>
          <template #item.acciones="{ item }">
            <v-btn icon="mdi-dots-vertical" variant="text" density="comfortable" color="grey-darken-1"
                   @click.stop="alBotonDeFila($event, item)" />
          </template>
        </v-data-table-server>
      </table-loading-overlay>
    </pdf-split-view>

    <state-legend titulo="Cobro:" :estados="TONOS_DE_FACTURA" />
    <state-legend titulo="Tipos:" :estados="TIPOS" />

    <action-menu v-model:menu="menu" :acciones="accionesDe(menu.filas)"
                 @accion="clave => ejecutarAccion(clave, menu.filas)" />
    <dialog-invoice v-model="creando" :pdf="pdfSoltado" @close="pdfSoltado = null" />
    <dialog-invoice v-model="editando" :invoice-to-edit="enEdicion" @close="enEdicion = null" />
    <dialog-invoice-payments v-model="enAbonos" :invoice="conAbonos" @close="enAbonos = false" />
    <dialog-emit-invoice ref="emision" @emitida="alEmitir" />
    <dialog-credit-note ref="nota" @emitida="alEmitirNota" />
    <panel-sunat :abierto="Boolean(notaAbierta)" tipo="creditnote" :id="notaAbierta?.id" nombre="Nota de crédito"
                 :numero="notaAbierta?.numero" :estado-sunat="notaAbierta?.estado" :respuesta="notaAbierta?.respuesta"
                 :filas="filasDeNota" :acciones="accionesDeNota" :corregible="notaCorregible"
                 @cerrar="notaAbierta = null" @accion="accionDeNota" />
    <panel-info-invoice v-model="abierta" :corregible="corregible" :acciones="abierta ? accionesDe([abierta]) : []"
                        @corregir="corregir" @accion="clave => ejecutarAccion(clave, [abierta])"
                        @cambiada="reemplazar" />
    <dialog-cancel-invoice v-model="enBaja" @enviada="f => { abierta = reemplazar(f) }" />
  </pdf-drop-zone>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import TableLoadingOverlay from '@/components/commonComponents/TableLoadingOverlay.vue'
import FluentPagination from '@/components/commonComponents/FluentPagination.vue'
import PdfDropZone from '@/components/commonComponents/PdfDropZone.vue'
import ActionMenu from '@/components/shared/ActionMenu.vue'
import ClientSelect from '@/components/shared/ClientSelect.vue'
import DateRangeFilter from '@/components/shared/DateRangeFilter.vue'
import FilterBar from '@/components/shared/FilterBar.vue'
import FilterPill from '@/components/shared/FilterPill.vue'
import PdfSplitView from '@/components/shared/PdfSplitView.vue'
import StateLegend from '@/components/shared/StateLegend.vue'
import { useContextMenu } from '@/composables/useContextMenu'
import { useOpenRow } from '@/composables/useCurrentRows'
import { useDateRangeFilter } from '@/composables/useDateRangeFilter'
import { useDownload } from '@/composables/useDownload'
import { useEmissionPanel } from '@/composables/useEmissionPanel'
import { useLatestRequest } from '@/composables/useLatestRequest'
import { useSwal } from '@/composables/useSwal'
import InvoiceMappers from '@/mappers/invoiceMappers'
import BillingDataService from '@/services/billing/billingDataService'
import { accionesPara } from '@/utils/actions'
import { ACCIONES_FACTURA } from '@/utils/billing/acciones'
import {
  EMITIR, FILTRO_DE_ESTADO, PILDORAS_DE_FACTURAS, TIPOS, TONOS_DE_FACTURA, cobroDe, condicionDe, desvincular, eliminar, estadoDe, montoDe, tipoDe,
} from '@/utils/billing/facturas'
import { preguntarFactura, reintentarFactura } from '@/utils/billing/pendientes'
import { ACEPTADA, ESTADOS as ESTADOS_SUNAT } from '@/utils/billing/sunat'
import { fechaCorta } from '@/utils/dates'
import { debounce } from '@/utils/debounce'
import { mensajeDeError } from '@/utils/errors'
import { MONEDAS, importe, monto } from '@/utils/money'
import { ALQUILER, SERVICIO } from '@/utils/orders/estado'
import { OTRA_PESTANA, abrirEnOtraPestana, avisarSoloPdf } from '@/utils/pdf'
import DialogCancelInvoice from './DialogCancelInvoice.vue'
import DialogCreditNote from './DialogCreditNote.vue'
import DialogEmitInvoice from './DialogEmitInvoice.vue'
import DialogInvoice from './DialogInvoice.vue'
import DialogInvoicePayments from './DialogInvoicePayments.vue'
import PanelInfoInvoice from './PanelInfoInvoice.vue'
import PanelSunat from './PanelSunat.vue'

const swal = useSwal()
const route = useRoute()
const router = useRouter()

const DETRACCION = [{ title: 'Con detracción', value: 'si' }, { title: 'Sin detracción', value: 'no' }]
const TIPO_DE_ORDEN = [{ title: 'Servicio', value: SERVICIO }, { title: 'Alquiler', value: ALQUILER }]

const EN_LA_LISTA_ANGOSTA = ['numero', 'cliente', 'cobro']
const columnas = computed(() => [
  { title: 'Factura', key: 'numero', sortable: false },
  { title: 'Cliente · órdenes', key: 'cliente', sortable: false },
  { title: 'Emisión', key: 'fecha', sortable: false },
  { title: 'Total', key: 'total', align: 'end', sortable: false },
  { title: 'Cobro', key: 'cobro', sortable: false },
  { title: 'Opciones', key: 'acciones', align: 'center', sortable: false },
].filter(c => vista.value === null || EN_LA_LISTA_ANGOSTA.includes(c.key)))

const facturas = ref([])
const total = ref(0)
const cargando = ref(false)
const opciones = ref({ page: 1, itemsPerPage: 30 })
const filtros = ref({ q: '', pildora: null, cliente: null, desde: '', hasta: '', estado: null, currency: null,
                      detraccion: null, order_type: null })
const alternarPildora = (valor) => { filtros.value.pildora = filtros.value.pildora === valor ? null : valor }
const { rango, aplicarRango, limpiarRango } = useDateRangeFilter(filtros)
const vista = ref(null)
const tituloDe = (factura) => [factura.invoice_number, factura.cliente].filter(Boolean).join(' · ')

const { begin, isLatest } = useLatestRequest()

async function recargar () {
  cargando.value = true
  const turno = begin()
  const conValor = Object.fromEntries(Object.entries(filtros.value).filter(([, v]) => v))
  try {
    const { page, itemsPerPage } = opciones.value
    const { data } = await BillingDataService.listInvoices({ ...conValor, tipo: 'fiscal', page, page_size: itemsPerPage })
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
  } catch {
    recargar()
  }
}

// La que se anula. Lo que vuelve reemplaza su fila y la del panel, que puede no estar en la pagina.
const enBaja = ref(null)
function reemplazar (fresca) {
  const fila = InvoiceMappers.getMap(fresca)
  const posicion = facturas.value.findIndex(f => f.id === fila.id)
  if (posicion !== -1) facturas.value.splice(posicion, 1, fila)
  if (abierta.value?.id === fila.id) abierta.value = fila
  return fila
}

const creando = ref(false)
const pdfSoltado = ref(null)
const editando = ref(false)
const enEdicion = ref(null)
const enAbonos = ref(false)
const conAbonos = useOpenRow(facturas)

function subir (pdf = null) {
  pdfSoltado.value = pdf
  creando.value = true
}

const emision = ref(null)
// La que se mira en su panel: la de Ver informacion o la recien emitida.
const { abierta, corregible, alEmitir, corregir } =
  useEmissionPanel(emision, recargar, facturas, InvoiceMappers.getMap)

// La nota de credito: su formulario y, al emitirla, su panel como el de la factura.
const nota = ref(null)
const notasDeLaLista = computed(() => facturas.value.flatMap(f => f.notas))
const { abierta: notaAbierta, corregible: notaCorregible, alEmitir: alEmitirNota, corregir: corregirNota } =
  useEmissionPanel(nota, recargar, notasDeLaLista)
const filasDeNota = computed(() => notaAbierta.value ? [
  ['Cliente', notaAbierta.value.cliente], ['Factura', notaAbierta.value.factura_numero],
  ['Total', monto(notaAbierta.value.total, notaAbierta.value.moneda)],
] : [])
const accionesDeNota = computed(() => notaAbierta.value?.pdf_url
  ? [{ clave: 'pdf', grupo: 'ver', texto: OTRA_PESTANA, icono: 'mdi-open-in-new' }] : [])
const accionDeNota = (clave) => clave === 'corregir' ? corregirNota() : abrirEnOtraPestana(notaAbierta.value.pdf_url)
async function abrirNota (factura) {
  try {
    nota.value.open((await BillingDataService.newCreditNote(factura.id)).data)
  } catch (error) {
    swal.fire({ icon: 'error', title: 'No se abrió la nota', text: mensajeDeError(error, 'No se pudieron leer los datos.') })
  }
}
// `plantilla`: otra factura emitida, que llena el formulario con sus items y condiciones.
async function abrirEmision (ordenIds = [], plantilla = null) {
  try {
    const [{ data: nueva }, base] = await Promise.all([BillingDataService.newInvoice(ordenIds),
      plantilla ? BillingDataService.getInvoiceInfo(plantilla.id) : { data: null }])
    emision.value?.open(nueva, base.data)
  } catch (error) {
    swal.fire({ icon: 'error', title: 'No se abrió la factura', text: mensajeDeError(error, 'No se pudieron leer los datos.') })
  }
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
  const ordenes = factura.ordenes_vinculadas.map(o => ({ id: o.order_id, order_number: o.order_number }))
  let orden = ordenes[0]
  if (ordenes.length > 1) {
    const { value } = await swal.fire({
      title: '¿De qué orden?', input: 'select', showCancelButton: true, cancelButtonText: 'Cancelar',
      inputOptions: Object.fromEntries(ordenes.map(o => [o.id, o.order_number])),
    })
    orden = ordenes.find(o => String(o.id) === value)
  }
  if (orden && await desvincular(factura, orden)) recargar()
}

async function eliminarUna (factura) {
  if (await eliminar(factura)) recargar()
}

const { menu, alClickDerecho, alBotonDeFila, estaEnElMenu } = useContextMenu(facturas)
const { descargar } = useDownload()
const accionesDe = (filas) => accionesPara(ACCIONES_FACTURA, filas, () => true)
function ejecutarAccion (clave, [factura]) {
  switch (clave) {
    case 'pdf': return abrirEnOtraPestana(factura.pdf_url)
    case 'descargar': return descargar(factura.pdf_url, factura.nombre_pdf, 'el PDF')
    case 'xml': return abrirEnOtraPestana(factura.xml)
    case 'cdr': return abrirEnOtraPestana(factura.cdr)
    case 'info':
      abierta.value = factura
      return
    case 'consultar':
      return preguntarFactura(factura.id, factura.invoice_number).then(r => r && reemplazar(r))
    case 'plantilla': return abrirEmision([], factura)
    case 'reintentar':
      return reintentarFactura(factura.id, factura.invoice_number).then(r => r && reemplazar(r))
    case 'abonos': return abrirAbonos(factura)
    case 'editar':
      enEdicion.value = factura
      return nextTick(() => { editando.value = true })
    case 'desvincular': return desvincularUna(factura)
    case 'nota': return abrirNota(factura)
    case 'anular':
      enBaja.value = factura
      return
    case 'eliminar': return eliminarUna(factura)
  }
}

watch(opciones, recargar, { deep: true })
watch(filtros, debounce(() => {
  if (opciones.value.page === 1) recargar()
  else opciones.value.page = 1
}), { deep: true })

// Desde Órdenes llega con ?ordenes=1,2: la factura se abre llena con sus equipos.
onMounted(() => {
  window.addEventListener('wss-reload-invoices', recargar)
  window.addEventListener('wss-update-invoice-row', refrescarFila)
  // Despues de la lista: las por enviar y las bajas en proceso van en segundo plano y sus filas se refrescan solas.
  recargar()
  const ids = String(route.query.ordenes || '').split(',').filter(Boolean)
  if (!ids.length) return
  router.replace({ query: {} })
  abrirEmision(ids)
})
onUnmounted(() => {
  window.removeEventListener('wss-reload-invoices', recargar)
  window.removeEventListener('wss-update-invoice-row', refrescarFila)
})

defineExpose({ nuevo: (opcion) => (opcion === EMITIR ? abrirEmision() : subir()) })
</script>
