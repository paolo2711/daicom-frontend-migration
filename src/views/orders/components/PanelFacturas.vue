<template>
  <v-card class="panel-cobro d-flex flex-column" elevation="0" rounded="lg" border>
    <detail-empty v-if="!aCobrar.length" titulo="Cobro" icono="mdi-cash-multiple"
                  texto="Elige «Cobro…» en el menú de una orden o haz clic en su semáforo." />

    <template v-else>
      <div class="pa-3 border-b-thin flex-shrink-0">
        <div class="d-flex align-center ga-2">
          <v-icon color="primary">mdi-cash-multiple</v-icon>
          <span class="text-subtitle-2 font-weight-bold">{{ titulo }}</span>
          <v-spacer />
          <v-btn icon="mdi-close" variant="text" size="small" density="comfortable"
                 :title="vinculando ? 'Soltar las órdenes' : 'Cerrar'"
                 @click="emit(vinculando ? 'limpiar-seleccion' : 'limpiar-foco')" />
        </div>
        <div v-if="subtitulo" class="text-caption text-medium-emphasis">{{ subtitulo }}</div>
      </div>

      <div class="cuerpo d-flex flex-column ga-3 pa-3 flex-grow-1">
        <div v-if="totales.length" class="titulo-de-seccion">{{ varias ? 'Total de las órdenes' : 'Total de la orden' }}</div>
        <amount-breakdown v-for="t in totales" :key="t.currency" v-bind="desgloseDeOrden(t)"
                          class="total-de-la-orden px-3 py-2 rounded-lg" />

        <table-loading-overlay :loading="cargando" :isEmpty="facturas.length === 0">
          <div v-if="facturas.length" class="titulo-de-seccion mb-2">
            {{ facturas.length === 1 ? 'Su comprobante' : `Sus ${facturas.length} comprobantes` }}
          </div>
          <div v-if="!facturas.length" class="py-6 text-center text-caption text-medium-emphasis">
            {{ varias ? 'Estas órdenes todavía no tienen comprobante.' : 'Esta orden todavía no tiene comprobante.' }}
          </div>

          <div v-for="factura in facturas" :key="factura.id" class="comprobante"
               :class="{ abierta: abierta === factura.id }">
            <div class="cabeza pa-3" @click="abierta = abierta === factura.id ? null : factura.id">
              <div class="d-flex align-center ga-2 text-body-2">
                <v-icon size="small" class="text-medium-emphasis" :title="tipoDe(factura).texto">
                  {{ tipoDe(factura).icono }}</v-icon>
                <span class="font-weight-bold">{{ factura.invoice_number || 'Sin número' }}</span>
                <v-spacer />
                <span class="font-weight-bold text-no-wrap">
                  {{ montoDe(factura) ? monto(factura.amount, factura.currency) : '—' }}</span>
              </div>
              <div class="d-flex justify-space-between ga-2 text-caption text-medium-emphasis">
                <span>{{ detalleDe(factura) }}</span>
                <span :class="estadoDe(factura).color && `text-${estadoDe(factura).color}`">
                  {{ estadoDe(factura).texto }}</span>
              </div>
            </div>

            <v-expand-transition>
              <div v-if="abierta === factura.id" class="detalle mx-3 pb-3">
                <amount-breakdown v-if="factura.es_fiscal" v-bind="desgloseDeFactura(factura, factura.payments)" />
                <div v-for="abono in factura.es_fiscal ? [] : factura.payments" :key="abono.id" class="dato">
                  <span>Abono {{ fechaCorta(abono.payment_date) }} · {{ FORMA_DE_PAGO[abono.payment_method] }}</span>
                  <span>{{ monto(abono.amount, abono.currency) }}</span>
                </div>

                <div class="botones mt-3">
                  <v-btn color="primary" variant="flat" size="small" class="text-none" prepend-icon="mdi-cash-plus"
                         @click="abrirAbonos(factura)">Abonar</v-btn>
                  <v-btn v-if="factura.pdf_url" variant="tonal" size="small" class="text-none"
                         prepend-icon="mdi-file-pdf-box" @click="abrirEnOtraPestana(factura.pdf_url)">PDF</v-btn>
                  <v-btn v-if="factura.es_fiscal && !varias" variant="tonal" size="small" class="text-none"
                         prepend-icon="mdi-link-off" @click="quitar(factura)">Desvincular</v-btn>
                </div>
              </div>
            </v-expand-transition>
          </div>
        </table-loading-overlay>

        <div v-if="!clienteUnico" class="text-caption text-medium-emphasis">
          Las órdenes marcadas son de clientes distintos: no pueden ir en la misma factura.
        </div>
        <paginated-autocomplete v-else :key="buscador" :model-value="null" v-bind="CAMPO"
                                :fetch="buscarFacturas" :cache="false"
                                :mapper="InvoiceMappers.getMap" :exclude-ids="yaVinculadas"
                                item-title="invoice_number" label="Vincular a una factura que ya existe"
                                prepend-inner-icon="mdi-link-variant" @selected="vincularA">
          <template #item="{ props: fila, item }">
            <v-list-item v-bind="fila" :title="item.raw.invoice_number || 'Sin número'"
                         :subtitle="[monto(item.raw.amount, item.raw.currency), item.raw.cliente || 'Suelta',
                                     fechaCorta(item.raw.invoice_date)].filter(Boolean).join(' · ')" />
          </template>
        </paginated-autocomplete>
      </div>

      <div v-if="acciones.length" class="d-flex flex-wrap ga-2 pa-3 border-t-thin flex-shrink-0">
        <v-btn v-for="(a, i) in acciones" :key="a.clave" class="flex-grow-1 text-none" :prepend-icon="a.icono"
               :color="i === 0 ? 'primary' : undefined" :variant="i === 0 ? 'flat' : 'outlined'"
               @click="hacer(a.clave)">{{ a.texto }}</v-btn>
      </div>
    </template>

    <dialog-invoice-payments v-model="enAbonos" :invoice="conAbonos" @close="enAbonos = false" />
    <dialog-invoice v-model="subiendo" :orders="aCobrar" @close="recargar" />
  </v-card>
</template>

<script setup>
import AmountBreakdown from '@/components/shared/AmountBreakdown.vue'
import { desgloseDeFactura, desgloseDeOrden } from '@/utils/billing/desglose'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import PaginatedAutocomplete from '@/components/commonComponents/PaginatedAutocomplete.vue'
import TableLoadingOverlay from '@/components/commonComponents/TableLoadingOverlay.vue'
import DetailEmpty from '@/components/shared/DetailEmpty.vue'
import { useOpenRow } from '@/composables/useCurrentRows'
import { useLatestRequest } from '@/composables/useLatestRequest'
import InvoiceMappers from '@/mappers/invoiceMappers'
import BillingDataService from '@/services/billing/billingDataService'
import OrderDataService from '@/services/orders/orderDataService'
import { FORMA_DE_PAGO, desvincular, estadoDe, montoDe, tipoDe, vincular } from '@/utils/billing/facturas'
import { fechaCorta } from '@/utils/dates'
import { CAMPO } from '@/utils/fields'
import { monto } from '@/utils/money'
import { SIN_COMPROBANTE, marcaDe } from '@/utils/orders/sinFactura'
import { abrirEnOtraPestana } from '@/utils/pdf'
import DialogInvoice from '@/views/billing/components/DialogInvoice.vue'
import DialogInvoicePayments from '@/views/billing/components/DialogInvoicePayments.vue'
import { SUBIR } from '@/utils/orders/acciones'

// El cobro de la orden elegida, o de las marcadas: sus comprobantes, vincular, emitir o cobrar sin comprobante.
const props = defineProps({
  order_type: { type: Number, required: true },
  orden: { type: Object, default: null },
  ordenes_seleccionadas: { type: Array, default: () => [] },
  accionesDe: { type: Function, required: true },
  ejecutarAccion: { type: Function, required: true },
})
const emit = defineEmits(['limpiar-seleccion', 'limpiar-foco'])

const VISIBLES = 5
const vinculando = computed(() => props.ordenes_seleccionadas.length > 0)
const aCobrar = computed(() => {
  if (vinculando.value) return props.ordenes_seleccionadas
  return props.orden ? [props.orden] : []
})
const varias = computed(() => aCobrar.value.length > 1)
const clientes = computed(() => [...new Set(aCobrar.value.map(o => o.client_data?.name).filter(Boolean))])
const clienteUnico = computed(() => {
  const ids = new Set(aCobrar.value.map(o => o.client_data?.id))
  return ids.size === 1 ? [...ids][0] ?? null : null
})
const acciones = computed(() => props.accionesDe(aCobrar.value).filter(a => !a.disabled))

const titulo = computed(() => {
  const n = aCobrar.value.length
  return varias.value ? `Cobro de ${n} órdenes` : `Cobro de ${aCobrar.value[0].order_number}`
})
const subtitulo = computed(() => {
  if (!varias.value) return clientes.value.join(', ')
  const numeros = aCobrar.value.map(o => o.order_number)
  const resto = numeros.length - VISIBLES
  return numeros.slice(0, VISIBLES).join(', ') + (resto > 0 ? ` y ${resto} más` : '')
})

// Con varias ordenes, cada comprobante dice a cuales va.
const detalleDe = (factura) => [varias.value ? factura.ordenes_vinculadas.map(o => o.order_number).join(', ') : '',
  factura.cliente, fechaCorta(factura.invoice_date), factura.es_fiscal ? '' : 'Sin comprobante'].filter(Boolean).join(' · ')

const facturas = ref([])
const totales = ref([])
const cargando = ref(false)
const abierta = ref(null)
const buscador = ref(0)
const yaVinculadas = computed(() => facturas.value.map(f => f.id))

const { begin, isLatest } = useLatestRequest()

// Los comprobantes y el total de las ordenes del panel, una o varias.
async function recargar () {
  const ids = aCobrar.value.map(o => o.id)
  if (!ids.length) return
  cargando.value = true
  const turno = begin()
  try {
    const [lista, resumen] = await Promise.all([
      BillingDataService.listInvoices({ order_ids: ids.join(','), page_size: 100, con_abonos: true }),
      OrderDataService.getTotales(ids),
    ])
    if (!isLatest(turno)) return
    facturas.value = lista.data.results.map(InvoiceMappers.getMap)
    totales.value = resumen.data.totales
  } catch {
    if (!isLatest(turno)) return
    facturas.value = []
    totales.value = []
  } finally {
    if (isLatest(turno)) cargando.value = false
  }
}

// Las del cliente y las sueltas, que se le pueden vincular.
const buscarFacturas = (page, size, q) => BillingDataService.listInvoices({
  page, page_size: size, q: q || undefined, tipo: 'fiscal', order_type: props.order_type,
  para_cliente: clienteUnico.value,
})

async function vincularA (factura) {
  buscador.value++
  if (!factura || !await vincular(factura, aCobrar.value)) return
  if (vinculando.value) emit('limpiar-seleccion')
  else recargar()
}

async function quitar (factura) {
  if (await desvincular(factura, aCobrar.value[0])) recargar()
}

const enAbonos = ref(false)
const conAbonos = useOpenRow(facturas)
function abrirAbonos (factura) {
  conAbonos.value = factura
  enAbonos.value = true
}

// Al dejar una orden sin comprobante se abre el abono de su registro interno; se puede cerrar sin cobrar.
// Subir la de KeyFacil abre su dialogo aca; lo demas lo hace la pantalla de ordenes.
const subiendo = ref(false)
async function hacer (clave) {
  if (clave === SUBIR) {
    subiendo.value = true
    return
  }
  const cobrarYa = clave === SIN_COMPROBANTE && !vinculando.value && marcaDe(aCobrar.value) !== SIN_COMPROBANTE
  const hecho = await props.ejecutarAccion(clave, aCobrar.value)
  if (!hecho || !cobrarYa) return
  await recargar()
  const interna = facturas.value.find(f => !f.es_fiscal)
  if (interna) abrirAbonos(interna)
}

watch(() => aCobrar.value.map(o => o.id).join(','), () => {
  abierta.value = null
  facturas.value = []
  totales.value = []
  recargar()
})

onMounted(() => {
  recargar()
  window.addEventListener('wss-reload-invoices', recargar)
  window.addEventListener('wss-update-invoice-row', recargar)
})
onUnmounted(() => {
  window.removeEventListener('wss-reload-invoices', recargar)
  window.removeEventListener('wss-update-invoice-row', recargar)
})
</script>

<style scoped>
.panel-cobro { max-height: 85vh; }
.cuerpo { overflow-y: auto; min-height: 0; }
.comprobante { border-radius: 0.625rem; background: rgba(var(--v-theme-on-surface), 0.05); overflow: hidden; }
.comprobante + .comprobante { margin-top: 0.5rem; }
.comprobante.abierta { background: rgba(var(--v-theme-primary), 0.1); }
.cabeza { cursor: pointer; }
.cabeza:hover { background: rgba(var(--v-theme-on-surface), 0.04); }
.detalle { border-top: thin solid rgba(var(--v-border-color), var(--v-border-opacity)); padding-top: 0.5rem; }
.dato { display: flex; justify-content: space-between; gap: 0.5rem; padding-top: 0.25rem; font-size: 0.75rem; }
.botones { display: flex; flex-wrap: wrap; gap: 0.5rem; }
.botones > * { flex: 1 1 auto; }
.total-de-la-orden { background: rgba(var(--v-theme-on-surface), 0.05); }
</style>
