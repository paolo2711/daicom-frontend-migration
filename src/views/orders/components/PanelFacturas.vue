<template>
  <pdf-drop-zone label="Suelta el PDF para subir la factura" @file="onPdfDropped" @invalid="pdfInvalido">
  <v-card
    class="panel-facturas d-flex flex-column position-relative"
    elevation="0" rounded="lg" border
  >
    <!-- Cabecera compacta propia (misma altura de arranque que la tabla de órdenes) -->
    <div class="panel-header d-flex align-center px-3 flex-shrink-0">
      <v-icon size="18" color="primary" class="mr-2">
        {{ modo_seleccion ? 'mdi-link-variant' : 'mdi-file-document-multiple-outline' }}
      </v-icon>
      <span class="text-subtitle-2 font-weight-bold">
        {{ modo_seleccion ? 'Elige una factura' : 'Facturas' }}
      </span>
      <span class="text-caption text-medium-emphasis ml-2">
        <template v-if="modo_seleccion">
          · vincular {{ ordenes_seleccionadas.length }} {{ ordenes_seleccionadas.length === 1 ? 'orden' : 'órdenes' }}
        </template>
      </span>

      <v-spacer />

      <!-- "+ Factura" crea una factura suelta (independiente). Se oculta con un
           filtro activo: la suelta no coincidiría con el filtro y "desaparece",
           confundiendo al usuario (cree que se enlaza sola). -->
      <v-btn v-if="!modo_seleccion && !search_query && !foco_order_number" color="primary" variant="flat" size="small" class="mr-1" @click="abrirCrearSuelta">
        <v-icon start size="16">mdi-plus</v-icon> Factura
      </v-btn>

      <!-- Filtro: ícono limpio con puntito solo cuando hay filtro activo -->
      <v-menu :close-on-content-click="false">
        <template v-slot:activator="{ props: mprops }">
          <v-btn icon size="small" variant="text" v-bind="mprops"
                 :color="hay_filtros ? 'primary' : undefined">
            <v-icon size="20">{{ hay_filtros ? 'mdi-filter' : 'mdi-filter-outline' }}</v-icon>
          </v-btn>
        </template>
        <v-card min-width="220" class="pa-3">
          <v-select v-model="currency_filter" :items="currency_options" label="Moneda"
                    density="compact" variant="outlined" hide-details class="mb-3" />
          <v-select v-model="estado_filter" :items="estado_options" label="Estado"
                    density="compact" variant="outlined" hide-details class="mb-3" />
          <v-select v-model="detraccion_filter" :items="detraccion_options" label="Detracción"
                    density="compact" variant="outlined" hide-details />
        </v-card>
      </v-menu>

      <v-tooltip location="bottom" :text="expandido ? 'Contraer' : 'Expandir'">
        <template v-slot:activator="{ props: tprops }">
          <v-btn icon size="small" variant="text" v-bind="tprops"
                 @click="$emit('update:expandido', !expandido)">
            <v-icon size="20">{{ expandido ? 'mdi-arrow-collapse' : 'mdi-arrow-expand' }}</v-icon>
          </v-btn>
        </template>
      </v-tooltip>
    </div>

    <!-- Aviso modo selección -->
    <div v-if="modo_seleccion" class="px-2 pb-2 flex-shrink-0">
      <v-alert type="info" variant="tonal" density="compact" class="text-caption py-1">
        Toca la factura a la que quieres vincular. Para crear una nueva o marcar "sin comprobante", usa la barra de selección.
      </v-alert>
    </div>

    <!-- Indicador de filtro activo -->
    <div v-if="search_query || foco_order_number" class="px-3 pb-2 flex-shrink-0">
      <v-chip v-if="foco_order_number" color="primary" variant="tonal" size="small" closable
              @click:close="$emit('limpiar-foco-orden')">
        <v-icon start size="14">mdi-filter</v-icon>
        Facturas de la orden {{ foco_order_number }}
      </v-chip>
      <v-chip v-else color="primary" variant="tonal" size="small" closable
              @click:close="$emit('limpiar-busqueda')">
        <v-icon start size="14">mdi-filter</v-icon>
        Filtrando: {{ search_query }}
      </v-chip>
    </div>

    <v-divider />

    <table-loading-overlay
      :loading="loading"
      :isEmpty="facturas.length === 0"
      text="Cargando facturas..."
      :offset="300"
      class="lista-scroll flex-grow-1"
    >
      <div v-if="facturas.length === 0" class="text-center text-caption text-medium-emphasis py-8">
        No hay facturas con estos filtros.
      </div>

      <!-- ══ MODO EXPANDIDO: tabla real con columnas ══ -->
      <template v-else-if="expandido">
        <!-- Header sticky DENTRO del scroll: se desplaza en horizontal junto a
             las filas y queda fijo al hacer scroll vertical. -->
        <div class="tabla-header d-flex align-center px-3">
          <div class="col-estado" />
          <div class="col-numero text-caption font-weight-bold text-medium-emphasis">N° Factura</div>
          <div class="col-fecha text-caption font-weight-bold text-medium-emphasis">Fecha</div>
          <div class="col-monto text-caption font-weight-bold text-medium-emphasis text-right">Monto</div>
          <div class="col-detr text-caption font-weight-bold text-medium-emphasis text-right">Detracción</div>
          <div class="col-abonado text-caption font-weight-bold text-medium-emphasis text-right">Abonado</div>
          <div class="col-estado-txt text-caption font-weight-bold text-medium-emphasis text-center">Estado</div>
          <div class="col-ordenes text-caption font-weight-bold text-medium-emphasis text-center">Órdenes</div>
          <div class="col-acciones text-caption font-weight-bold text-medium-emphasis text-right">Acciones</div>
        </div>

        <div
          v-for="inv in facturas_mostradas"
          :key="inv.id"
          class="factura-row-exp d-flex align-center px-3"
          :class="{
            'factura-row--selectable': modo_seleccion && puede_vincular(inv),
            'factura-row--disabled': modo_seleccion && !puede_vincular(inv),
          }"
          :title="modo_seleccion && !puede_vincular(inv) ? motivoNoVincular(inv) : undefined"
          @click="modo_seleccion && puede_vincular(inv) ? confirmarVinculo(inv) : null"
        >
          <div class="col-estado">
            <div class="estado-dot" :style="{ backgroundColor: estado_color(inv.status) }" />
          </div>
          <div class="col-numero d-flex align-center ga-1 overflow-hidden">
            <span class="text-body-2 font-weight-medium text-truncate">{{ inv.invoice_number || 'Sin número' }}</span>
          </div>
          <div class="col-fecha text-caption text-medium-emphasis">{{ inv.invoice_date || '—' }}</div>
          <div class="col-monto text-right">
            <div class="text-body-2 font-weight-medium">{{ montoMostrar(inv) }}</div>
            <div v-if="saldoInfo(inv)" class="text-caption" :class="saldoInfo(inv).cls">{{ saldoInfo(inv).text }}</div>
          </div>
          <div class="col-detr text-right">
            <span v-if="inv.detraccion_applies" class="text-deep-orange text-body-2 font-weight-medium">{{ simbolo(inv.currency) }} {{ money(inv.detraccion_amount) }}</span>
            <span v-else class="text-disabled">—</span>
          </div>
          <div class="col-abonado text-right">
            <template v-if="inv.total_pagado > 0">
              <div class="text-success text-body-2 font-weight-medium">{{ simbolo(inv.currency) }} {{ money(inv.total_pagado) }}</div>
              <div class="text-medium-emphasis text-caption">{{ (inv.payments || []).length }} abono(s)</div>
            </template>
            <span v-else class="text-disabled">—</span>
          </div>
          <div class="col-estado-txt text-center">
            <v-chip size="small" :color="estado_color(inv.status)" variant="tonal" class="estado-chip">{{ estado_texto(inv.status) }}</v-chip>
          </div>
          <div class="col-ordenes text-center">
            <v-tooltip location="top" v-if="inv.ordenes_vinculadas.length">
              <template v-slot:activator="{ props: tprops }">
                <v-chip v-bind="tprops" size="x-small" variant="tonal" color="primary" style="cursor:pointer" @click.stop="verOrdenesDeFactura(inv)">{{ inv.ordenes_vinculadas.length }}</v-chip>
              </template>
              <div class="text-caption">
                <div v-for="o in inv.ordenes_vinculadas" :key="o.order_id">{{ o.order_number }}</div>
                <div class="text-medium-emphasis mt-1" style="font-size:10px;">Clic para ver sus órdenes</div>
              </div>
            </v-tooltip>
            <span v-else class="text-disabled">—</span>
          </div>
          <div class="col-acciones d-flex justify-end" v-if="!modo_seleccion">
            <v-btn v-if="inv.pdf_url" icon size="x-small" variant="text" color="primary" :href="inv.pdf_url" target="_blank" @click.stop>
              <v-icon size="18">mdi-file-eye-outline</v-icon>
            </v-btn>
            <v-btn icon size="x-small" variant="text" color="success" @click.stop="abrirAbonos(inv)">
              <v-icon size="18">mdi-cash-plus</v-icon>
            </v-btn>
            <v-btn v-if="inv.es_fiscal" icon size="x-small" variant="text" color="grey-darken-1" @click.stop="editarFactura(inv)">
              <v-icon size="18">mdi-pencil</v-icon>
            </v-btn>
            <v-menu location="bottom end">
              <template v-slot:activator="{ props: mprops }">
                <v-btn v-bind="mprops" icon size="x-small" variant="text" color="grey-darken-1" @click.stop>
                  <v-icon size="18">mdi-dots-vertical</v-icon>
                </v-btn>
              </template>
              <v-list density="compact" min-width="210">
                <template v-if="inv.es_fiscal && inv.ordenes_vinculadas.length">
                  <v-list-subheader class="text-caption">Desvincular orden</v-list-subheader>
                  <v-list-item v-for="o in inv.ordenes_vinculadas" :key="o.order_id" @click="desvincularOrden(inv, o)">
                    <template v-slot:prepend><v-icon size="18" color="grey-darken-1">mdi-link-off</v-icon></template>
                    <v-list-item-title class="text-body-2">{{ o.order_number }}</v-list-item-title>
                  </v-list-item>
                  <v-divider class="my-1" />
                </template>
                <v-list-item @click="eliminarFactura(inv)">
                  <template v-slot:prepend><v-icon size="18" color="error">mdi-delete-outline</v-icon></template>
                  <v-list-item-title class="text-body-2 text-error">Eliminar factura</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
          </div>
        </div>
      </template>

      <!-- ══ MODO COMPACTO: filas delgadas ══ -->
      <template v-else>
        <div
          v-for="inv in facturas_mostradas"
          :key="inv.id"
          class="factura-row d-flex align-center px-3"
          :class="{
            'factura-row--selectable': modo_seleccion && puede_vincular(inv),
            'factura-row--disabled': modo_seleccion && !puede_vincular(inv),
          }"
          :title="modo_seleccion && !puede_vincular(inv) ? motivoNoVincular(inv) : undefined"
          @click="modo_seleccion && puede_vincular(inv) ? confirmarVinculo(inv) : null"
        >
          <div class="estado-dot flex-shrink-0" :style="{ backgroundColor: estado_color(inv.status) }" />

          <div class="factura-main flex-grow-1 overflow-hidden">
            <div class="d-flex align-center ga-1">
              <span class="text-body-2 font-weight-medium text-truncate">{{ inv.invoice_number || 'Sin número' }}</span>
            </div>
            <div class="text-caption text-medium-emphasis text-truncate">{{ inv.invoice_date || '—' }}</div>
          </div>

          <div class="factura-monto flex-shrink-0 text-right">
            <div class="text-body-2 font-weight-medium">{{ montoMostrar(inv) }}</div>
            <div v-if="saldoInfo(inv)" class="text-caption" :class="saldoInfo(inv).cls">{{ saldoInfo(inv).text }}</div>
          </div>

          <div class="factura-ordenes flex-shrink-0 text-center">
            <v-tooltip location="top" v-if="inv.ordenes_vinculadas.length">
              <template v-slot:activator="{ props: tprops }">
                <v-chip v-bind="tprops" size="x-small" variant="tonal" color="primary" style="cursor:pointer" @click.stop="verOrdenesDeFactura(inv)">
                  <v-icon start size="12">mdi-link-variant</v-icon>{{ inv.ordenes_vinculadas.length }}
                </v-chip>
              </template>
              <div class="text-caption">
                <div v-for="o in inv.ordenes_vinculadas" :key="o.order_id">{{ o.order_number }}</div>
                <div class="text-medium-emphasis mt-1" style="font-size:10px;">Clic para ver sus órdenes</div>
              </div>
            </v-tooltip>
            <span v-else class="text-caption text-disabled">—</span>
          </div>

          <div class="factura-acciones flex-shrink-0 d-flex justify-end" v-if="!modo_seleccion">
            <v-btn v-if="inv.pdf_url" icon size="small" variant="text" color="primary" :href="inv.pdf_url" target="_blank" @click.stop>
              <v-icon size="18">mdi-file-eye-outline</v-icon>
              <v-tooltip activator="parent" location="top">Ver PDF</v-tooltip>
            </v-btn>
            <v-btn icon size="small" variant="text" color="success" @click.stop="abrirAbonos(inv)">
              <v-icon size="18">mdi-cash-plus</v-icon>
              <v-tooltip activator="parent" location="top">Abonos</v-tooltip>
            </v-btn>
            <v-btn v-if="inv.es_fiscal" icon size="small" variant="text" color="grey-darken-1" @click.stop="editarFactura(inv)">
              <v-icon size="18">mdi-pencil</v-icon>
              <v-tooltip activator="parent" location="top">Editar factura</v-tooltip>
            </v-btn>
            <v-menu location="bottom end">
              <template v-slot:activator="{ props: mprops }">
                <v-btn v-bind="mprops" icon size="small" variant="text" color="grey-darken-1" @click.stop>
                  <v-icon size="18">mdi-dots-vertical</v-icon>
                </v-btn>
              </template>
              <v-list density="compact" min-width="210">
                <template v-if="inv.es_fiscal && inv.ordenes_vinculadas.length">
                  <v-list-subheader class="text-caption">Desvincular orden</v-list-subheader>
                  <v-list-item v-for="o in inv.ordenes_vinculadas" :key="o.order_id" @click="desvincularOrden(inv, o)">
                    <template v-slot:prepend><v-icon size="18" color="grey-darken-1">mdi-link-off</v-icon></template>
                    <v-list-item-title class="text-body-2">{{ o.order_number }}</v-list-item-title>
                  </v-list-item>
                  <v-divider class="my-1" />
                </template>
                <v-list-item @click="eliminarFactura(inv)">
                  <template v-slot:prepend><v-icon size="18" color="error">mdi-delete-outline</v-icon></template>
                  <v-list-item-title class="text-body-2 text-error">Eliminar factura</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
          </div>
        </div>
      </template>
    </table-loading-overlay>

    <fluent-pagination
      v-if="!loading && total_items > 0"
      :page="page"
      :items-per-page="page_size"
      :total-items="total_items"
      @update:page="onPage"
      @update:itemsPerPage="onPageSize"
      class="flex-shrink-0"
    />

    <dialog-factura
      v-model="modal_crear"
      :order="null"
      :order_type="order_type"
      :prefill="prefill_data"
      @close="cerrarCrear"
      @updateOrder="onFacturaCreada"
    />

    <dialog-factura
      v-model="modal_editar"
      :order="null"
      :invoice-to-edit="factura_editar"
      @close="cerrarEditar"
      @updateOrder="onFacturaEditada"
    />

    <dialog-liquidacion
      v-model="modal_abonos"
      :invoice="factura_abonos"
      @close="modal_abonos = false"
      @updateOrder="onAbonoActualizado"
    />
  </v-card>
  </pdf-drop-zone>
</template>

<script setup>
import { Toast } from '@/plugins/alerts'
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import Swal from 'sweetalert2'
import OrderDataService from '@/services/certificates/orderDataService'
import InvoiceMappers from '@/mappers/invoiceMappers'
import FluentPagination from '@/components/commonComponents/FluentPagination.vue'
import TableLoadingOverlay from '@/components/commonComponents/TableLoadingOverlay.vue'
import DialogFactura from './DialogFactura.vue'
import DialogLiquidacion from './DialogLiquidacion.vue'
import PdfDropZone from '@/components/commonComponents/PdfDropZone.vue'

const props = defineProps({
  order_type:            { type: Number, required: true },
  ordenes_seleccionadas: { type: Array, default: () => [] },
  expandido:             { type: Boolean, default: false },
  search:                { type: String, default: '' },  // viene de Filtros Generales
  foco_order_id:         { type: Number, default: null }, // enfocar facturas de una orden
  foco_order_number:     { type: String, default: '' },
})
const emit = defineEmits(['update:expandido', 'recargar-ordenes', 'limpiar-seleccion', 'limpiar-busqueda', 'limpiar-foco-orden', 'filtrar-ordenes-por-factura'])

const loading = ref(false)
const facturas = ref([])
const total_items = ref(0)
const page = ref(1)
const page_size = ref(30)
const currency_filter = ref(null)
const estado_filter = ref(null)
const detraccion_filter = ref(null)

// El buscador ya no vive en el panel: llega de Filtros Generales por prop.
const search_query = computed(() => props.search || '')

// Drag & drop + crear suelta
const modal_crear = ref(false)
const prefill_data = ref(null)

const modal_editar = ref(false)
const factura_editar = ref(null)
const modal_abonos = ref(false)
const factura_abonos = ref(null)

const modo_seleccion = computed(() => props.ordenes_seleccionadas.length > 0)

// Al vincular, las no-facturas no aplican: están atadas a su propia orden y no
// pueden vincularse a otras. Se ocultan en modo selección.
const facturas_mostradas = computed(() =>
  modo_seleccion.value ? facturas.value.filter(f => f.es_fiscal) : facturas.value
)

const currency_options = [
  { title: 'Todas las monedas', value: null },
  { title: 'Soles (PEN)', value: 'PEN' },
  { title: 'Dólares (USD)', value: 'USD' },
]
const estado_options = [
  { title: 'Todos los estados', value: null },
  { title: 'En proceso', value: 1 },
  { title: 'Deuda', value: 2 },
  { title: 'Abonado', value: 3 },
  { title: 'Pagado', value: 5 },
  { title: 'Excedido', value: 6 },
  { title: 'Anulada', value: 4 },
]
const detraccion_options = [
  { title: 'Todas', value: null },
  { title: 'Con detracción', value: 'si' },
  { title: 'Sin detracción', value: 'no' },
]
const hay_filtros = computed(() => !!(currency_filter.value || estado_filter.value || detraccion_filter.value))

// 1 En proceso (gris), 2 Deuda (rojo), 3 Abonado (naranja), 4 Anulada (azul-gris,
// distinto del gris de "En proceso"), 5 Pagado (verde), 6 Excedido (azul).
const ESTADO_COLORS = { 1: '#9e9e9e', 2: '#e53935', 3: '#fb8c00', 4: '#546e7a', 5: '#43a047', 6: '#1e88e5' }
const estado_color = (s) => ESTADO_COLORS[s] || ESTADO_COLORS[2]
const ESTADO_TEXTOS = { 1: 'En proceso', 2: 'Deuda', 3: 'Abonado', 4: 'Anulada', 5: 'Pagado', 6: 'Excedido' }
const estado_texto = (s) => ESTADO_TEXTOS[s] || 'Deuda'
const simbolo = (c) => (c === 'USD' ? '$' : 'S/')
const money = (v) => Number(v || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
// Facturas internas nacen en 0 (aún sin abono): mostramos "--" en vez de 0.00
const montoMostrar = (inv) => {
  const v = Number(inv.amount || 0)
  return v > 0 ? `${simbolo(inv.currency)} ${money(v)}` : '—'
}
// Resto de la factura: "Pdte X" (rojo) si falta cobrar, "Exc. X" (azul, color
// de Excedido) si pagaron de más, null si está justo/pagado.
const saldoInfo = (inv) => {
  const s = Number(inv.saldo_pendiente || 0)
  if (s > 0) return { text: `Pdte ${money(s)}`, cls: 'text-error' }
  if (s < 0) return { text: `Exc. ${money(-s)}`, cls: 'text-blue-darken-1' }
  return null
}

let searchTimeout = null
const cargar = async () => {
  loading.value = true
  try {
    const res = await OrderDataService.listInvoices({
      order_type: props.order_type,
      order_id: props.foco_order_id || undefined,
      currency: currency_filter.value || undefined,
      estado: estado_filter.value || undefined,
      detraccion: detraccion_filter.value || undefined,
      q: search_query.value || undefined,
      page: page.value,
      page_size: page_size.value,
    })
    facturas.value = (res.data.results || []).map(f => InvoiceMappers.getMap(f))
    total_items.value = res.data.count ?? facturas.value.length
  } catch (e) {
    facturas.value = []
    total_items.value = 0
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  cargar()
  window.addEventListener('wss-reload-invoices', onWsReloadInvoices)
  window.addEventListener('wss-update-invoice-row', onWsUpdateInvoiceRow)
})
onUnmounted(() => {
  window.removeEventListener('wss-reload-invoices', onWsReloadInvoices)
  window.removeEventListener('wss-update-invoice-row', onWsUpdateInvoiceRow)
})

// RELOAD_INVOICES: se creo o borro una factura -> recargamos la lista.
const onWsReloadInvoices = () => { cargar() }

// UPDATE_ROW invoice_id: cambio una factura puntual (abono, estado, edicion).
const onWsUpdateInvoiceRow = (event) => {
  const invId = event.detail
  const idx = facturas.value.findIndex(f => f.id === invId)
  if (idx === -1) {
    cargar()
    return
  }
  OrderDataService.listInvoices({ order_type: props.order_type, invoice_id: invId })
    .then(res => {
      const fresca = (res.data.results || [])[0]
      if (fresca) {
        facturas.value[idx] = InvoiceMappers.getMap(fresca)
        if (factura_abonos.value && factura_abonos.value.id === invId) {
          factura_abonos.value = facturas.value[idx]
        }
      } else {
        cargar()
      }
    })
    .catch(() => { cargar() })
}

watch(() => props.order_type, () => { page.value = 1; cargar() })
watch(() => props.foco_order_id, () => { page.value = 1; cargar() })
// Expandir/contraer es solo cambio de layout: NO recargamos ni perdemos la
// página (los datos son los mismos en ambas vistas).
watch([currency_filter, estado_filter, detraccion_filter], () => { page.value = 1; cargar() })
watch(search_query, () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => { page.value = 1; cargar() }, 350)
})

const onPage = (p) => { page.value = p; cargar() }
const onPageSize = (n) => { page_size.value = n; page.value = 1; cargar() }

// Moneda de la selección: una sola moneda si todas coinciden, 'MIXTA' si no,
// null si no hay selección. Para compartir una factura deben ser la misma.
const monedaSeleccion = computed(() => {
  const set = new Set(props.ordenes_seleccionadas.map(o => o.currency))
  if (set.size === 0) return null
  return set.size === 1 ? [...set][0] : 'MIXTA'
})

const puede_vincular = (inv) => {
  if (!inv.es_fiscal) return false  // las no-facturas no se vinculan a otras órdenes
  if (inv.order_type != null && inv.order_type !== props.order_type) return false
  if (monedaSeleccion.value === 'MIXTA') return false
  if (monedaSeleccion.value && inv.currency && inv.currency !== monedaSeleccion.value) return false
  const ids = props.ordenes_seleccionadas.map(o => o.id)
  if (inv.ordenes_vinculadas.some(o => ids.includes(o.order_id))) return false
  return true
}

// Motivo por el que NO se puede vincular (tooltip nativo en la fila deshabilitada).
const motivoNoVincular = (inv) => {
  if (inv.order_type != null && inv.order_type !== props.order_type) return 'Factura de otro tipo de orden'
  if (monedaSeleccion.value === 'MIXTA') return 'Las órdenes marcadas tienen monedas distintas'
  if (monedaSeleccion.value && inv.currency && inv.currency !== monedaSeleccion.value) return `Factura en ${inv.currency}: no coincide con la selección`
  const ids = props.ordenes_seleccionadas.map(o => o.id)
  if (inv.ordenes_vinculadas.some(o => ids.includes(o.order_id))) return 'Ya vinculada a una orden marcada'
  return ''
}

const confirmarVinculo = async (inv) => {
  const ordenes = props.ordenes_seleccionadas
  const nombres = ordenes.map(o => o.order_number).join(', ')
  const r = await Swal.fire({
    title: '¿Vincular a esta factura?',
    html: `Se vincularán <b>${nombres}</b><br>a la factura <b>${inv.invoice_number || 'sin número'}</b>.`,
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Sí, vincular',
    cancelButtonText: 'Cancelar',
  })
  if (!r.isConfirmed) return
  try {
    await OrderDataService.linkInvoice(inv.id, ordenes.map(o => o.id))
    Toast.fire({ timer: 2200, icon: 'success', title: 'Órdenes vinculadas' })
    emit('limpiar-seleccion')
    cargar() // refresco inmediato (además del WS)
  } catch (e) {
    const msg = e?.response?.data?.error || 'No se pudo vincular.'
    Swal.fire('Error', msg, 'error')
  }
}

// ── Desvincular una orden de la factura (conserva factura + abonos) ──
// Backend: DELETE /orders/invoices/<id>?order_id=<oid> quita solo esa
// asignación; si era la última, borra la factura completa.
const desvincularOrden = async (inv, orden) => {
  const r = await Swal.fire({
    title: '¿Desvincular esta orden?',
    html: `Se quitará <b>${orden.order_number}</b> de la factura <b>${inv.invoice_number || 'sin número'}</b>.<br>La factura y sus abonos se conservan.`,
    icon: 'question', showCancelButton: true,
    confirmButtonText: 'Sí, desvincular', cancelButtonText: 'Cancelar',
  })
  if (!r.isConfirmed) return
  try {
    await OrderDataService.deleteInvoice(inv.id, orden.order_id)
    Toast.fire({ timer: 2200, icon: 'success', title: 'Orden desvinculada' })
    cargar()
  } catch (e) {
    const msg = e?.response?.data?.error || 'No se pudo desvincular.'
    Swal.fire('Error', msg, 'error')
  }
}

// ── Eliminar la factura completa (sin order_id => borra el comprobante) ──
const eliminarFactura = async (inv) => {
  const vinc = inv.ordenes_vinculadas.length
  const advertencia = vinc
    ? `Está vinculada a ${vinc} ${vinc === 1 ? 'orden' : 'órdenes'}. Se eliminará la factura y todos sus abonos.`
    : 'Se eliminará la factura y todos sus abonos de forma permanente.'
  const r = await Swal.fire({
    title: '¿Eliminar esta factura?',
    html: `<b>${inv.invoice_number || 'Sin número'}</b><br>${advertencia}`,
    icon: 'warning', showCancelButton: true,
    confirmButtonText: 'Sí, eliminar', cancelButtonText: 'Cancelar',
  })
  if (!r.isConfirmed) return
  try {
    await OrderDataService.deleteInvoice(inv.id) // sin order_id => borra la factura completa
    Toast.fire({ timer: 2200, icon: 'success', title: 'Factura eliminada' })
    cargar()
  } catch (e) {
    const msg = e?.response?.data?.error || 'No se pudo eliminar.'
    Swal.fire('Error', msg, 'error')
  }
}

// Reverso del foco: desde una factura, filtra la TABLA de órdenes por su
// número (reusa el filtro "Nro Factura"; se limpia borrando ese campo).
const verOrdenesDeFactura = (inv) => {
  if (!inv.invoice_number) return
  // Toggle: si la tabla ya está filtrada por esta factura, el segundo clic limpia.
  if (props.search === inv.invoice_number) {
    emit('limpiar-busqueda')
  } else {
    emit('filtrar-ordenes-por-factura', inv.invoice_number)
  }
}

const abrirAbonos = (inv) => { factura_abonos.value = inv; modal_abonos.value = true }
// El refresco lo hace el WebSocket (wss-update-invoice-row). El diálogo
// puede quedar abierto; onWsUpdateInvoiceRow refresca su factura_abonos.
const onAbonoActualizado = () => { /* WS actualiza fila e historial */ }

const editarFactura = (inv) => {
  factura_editar.value = inv
  nextTick(() => { modal_editar.value = true })
}
const cerrarEditar = () => { modal_editar.value = false; factura_editar.value = null }
// WS (wss-update-invoice-row) refresca la fila editada.
const onFacturaEditada = () => { cerrarEditar() }

// ── Crear factura suelta (botón +) ──
const abrirCrearSuelta = () => { prefill_data.value = null; modal_crear.value = true }
const cerrarCrear = () => { modal_crear.value = false; prefill_data.value = null }
// WS (wss-reload-invoices) recarga la lista al crearse.
const onFacturaCreada = () => { cerrarCrear() }

// ── Drag & drop de PDF (UI en el común PdfDropZone) ──
const pdfInvalido = () => {
  Toast.fire({ timer: 2500, icon: 'info', title: 'Suelta un archivo PDF.' })
}
// Recibe el File ya validado desde PdfDropZone: extrae datos y abre el modal
// de crear factura pre-llenado.
const onPdfDropped = async (file) => {
  try {
    const data = new FormData()
    data.append('pdf', file)
    const res = await OrderDataService.extractInvoiceData(data)
    prefill_data.value = {
      invoice_number: res.data.invoice_number || '',
      invoice_date: res.data.invoice_date || '',
      amount: res.data.amount || '',
      pdf: file,
    }
    // Feedback de extracción (igual que el file-input del modal)
    const algo = res.data.invoice_number || res.data.invoice_date || res.data.amount
    if (res.data.warning) {
      Toast.fire({ timer: 5000, icon: 'warning', title: 'Extracción parcial', text: res.data.warning })
    } else if (algo) {
      Toast.fire({ timer: 2500, icon: 'success', title: '¡Datos extraídos!' })
    } else {
      Toast.fire({ timer: 3000, icon: 'info', title: 'No se extrajo nada, complétalo a mano.' })
    }
  } catch (err) {
    prefill_data.value = { pdf: file }
    Toast.fire({ timer: 3500, icon: 'info', title: 'No se pudo leer el PDF. Complétalo a mano.' })
  }
  modal_crear.value = true
}
// "Sin factura" se movió a la barra flotante de selección (TabOrdersService),
// para que el header del panel no mute de tamaño entre modos.
</script>

<style scoped>
.panel-facturas {
  height: calc(100vh - 140px);
  max-height: calc(100vh - 140px);
  overflow: hidden;
}
/* Cabecera compacta: misma altura de arranque que la tabla de órdenes */
.panel-header {
  height: 48px;
  border-bottom: 1px solid rgba(128,128,128,0.12);
}
.lista-scroll {
  overflow-y: auto;
  overflow-x: auto; /* la tabla expandida scrollea en horizontal si no cabe */
  min-height: 0;
}
.lista-scroll::-webkit-scrollbar { width: 8px; }
.lista-scroll::-webkit-scrollbar-track { background: transparent; }
.lista-scroll::-webkit-scrollbar-thumb { background: rgba(128,128,128,0.35); border-radius: 4px; }
.lista-scroll::-webkit-scrollbar-thumb:hover { background: rgba(128,128,128,0.55); }

/* ── Fila compacta ── */
.factura-row {
  height: 56px;
  border-bottom: 1px solid rgba(128,128,128,0.12);
  gap: 12px;
  transition: background-color 0.15s ease;
}
.factura-row--selectable { cursor: pointer; }
.factura-row--selectable:hover { background-color: rgba(var(--v-theme-primary), 0.08); }
/* Sin pointer-events:none para que el tooltip nativo (:title) con el motivo
   se muestre al pasar el cursor. El @click ya no dispara (puede_vincular=false). */
.factura-row--disabled { opacity: 0.45; cursor: not-allowed; }

.estado-dot { width: 8px; height: 8px; border-radius: 50%; }
.factura-main    { min-width: 0; }
.factura-monto   { width: 110px; }
.factura-ordenes { width: 52px; }
.factura-acciones{ width: 140px; }

/* ── Tabla expandida (columnas reales con headers) ── */
.tabla-header {
  height: 36px;
  position: sticky;      /* fijo al scrollear vertical */
  top: 0;
  z-index: 2;
  background: rgb(var(--v-theme-surface)); /* opaco para tapar filas debajo */
  border-bottom: 1px solid rgba(128,128,128,0.18);
  gap: 8px;
  min-width: 1040px;     /* mantiene los anchos de columna; scroll-x si no cabe */
}
.factura-row-exp {
  height: 52px;
  border-bottom: 1px solid rgba(128,128,128,0.10);
  gap: 8px;
  min-width: 1040px;     /* igual que el header, para que scrolleen juntos */
  transition: background-color 0.15s ease;
}
.factura-row-exp:hover { background-color: rgba(128,128,128,0.05); }
/* Anchos de columna compartidos entre header y filas */
.col-estado   { width: 18px; flex-shrink: 0; }
.col-numero   { width: 160px; flex-shrink: 0; }
.col-fecha    { width: 96px; flex-shrink: 0; }
.col-monto    { width: 120px; flex-shrink: 0; }
.col-detr     { width: 110px; flex-shrink: 0; }
.col-abonado  { width: 120px; flex-shrink: 0; }
.col-estado-txt { width: 110px; flex-shrink: 0; }
/* Todas las píldoras de estado con el MISMO ancho (el de la palabra más larga,
   "En proceso") y el texto centrado — así no quedan de tamaños disparejos. */
.estado-chip { min-width: 96px; justify-content: center; }
.col-ordenes  { flex-grow: 1; min-width: 60px; }
.col-acciones { width: 148px; flex-shrink: 0; }
</style>