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
        <div v-if="!vinculando && totales.length" class="titulo-de-seccion">Total de la orden</div>
        <div v-for="t in vinculando ? [] : totales" :key="t.currency" class="totales">
          <div v-for="dato in datosDe(t)" :key="dato.titulo" class="bg-hoja_de_apoyo rounded-lg pa-2">
            <div class="text-caption text-medium-emphasis">{{ dato.titulo }}</div>
            <div class="font-weight-medium text-no-wrap" :class="dato.clase">{{ dato.valor }}</div>
          </div>
        </div>

        <div v-if="vinculando" class="text-caption text-medium-emphasis">
          Vincúlalas a una factura que ya existe o emite una sola para todas.
        </div>

        <table-loading-overlay v-else :loading="cargando" :isEmpty="facturas.length === 0">
          <div v-if="facturas.length" class="titulo-de-seccion mb-2">
            {{ facturas.length === 1 ? 'Su comprobante' : `Sus ${facturas.length} comprobantes` }}
          </div>
          <div v-if="!facturas.length" class="py-6 text-center text-caption text-medium-emphasis">
            Esta orden todavía no tiene comprobante.
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
                <div v-if="factura.es_fiscal" class="dato"><span>{{ factura.es_credito ? 'Crédito' : 'Contado' }}</span>
                  <span v-if="factura.es_credito">vence {{ fechaCorta(factura.due_date) }}</span></div>
                <div v-if="factura.detraccion_applies" class="dato"><span>Detracción</span>
                  <span>{{ monto(factura.detraccion_amount, factura.currency) }}</span></div>
                <div v-for="abono in factura.payments" :key="abono.id" class="dato">
                  <span>Abono {{ fechaCorta(abono.payment_date) }} · {{ FORMA_DE_PAGO[abono.payment_method] }}</span>
                  <span>{{ monto(abono.amount, abono.currency) }}</span>
                </div>
                <div v-if="factura.es_fiscal" class="dato font-weight-bold"><span>Falta</span>
                  <span :class="factura.saldo_pendiente > 0 ? 'text-error' : 'text-success'">
                    {{ monto(Math.max(factura.saldo_pendiente, 0), factura.currency) }}
                  </span></div>

                <div class="botones mt-3">
                  <v-btn color="primary" variant="flat" size="small" class="text-none" prepend-icon="mdi-cash-plus"
                         @click="abrirAbonos(factura)">Abonar</v-btn>
                  <v-btn v-if="factura.pdf_url" variant="outlined" size="small" class="text-none"
                         prepend-icon="mdi-file-pdf-box" @click="abrirEnOtraPestana(factura.pdf_url)">PDF</v-btn>
                  <v-btn v-if="factura.es_fiscal" variant="outlined" size="small" class="text-none"
                         prepend-icon="mdi-link-off" @click="quitar(factura)">Desvincular</v-btn>
                </div>
              </div>
            </v-expand-transition>
          </div>
        </table-loading-overlay>

        <paginated-autocomplete :key="buscador" :model-value="null" v-bind="CAMPO"
                                :fetch="buscarFacturas" :mapper="InvoiceMappers.getMap" :exclude-ids="yaVinculadas"
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
  </v-card>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import PaginatedAutocomplete from '@/components/commonComponents/PaginatedAutocomplete.vue'
import TableLoadingOverlay from '@/components/commonComponents/TableLoadingOverlay.vue'
import DetailEmpty from '@/components/shared/DetailEmpty.vue'
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
import DialogInvoicePayments from '@/views/billing/components/DialogInvoicePayments.vue'

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
const clientes = computed(() => [...new Set(aCobrar.value.map(o => o.client_data?.name).filter(Boolean))])
const acciones = computed(() => props.accionesDe(aCobrar.value).filter(a => !a.disabled))

const titulo = computed(() => {
  const n = aCobrar.value.length
  return vinculando.value ? `Cobro de ${n} ${n === 1 ? 'orden' : 'órdenes'}` : `Cobro de ${props.orden.order_number}`
})
const subtitulo = computed(() => {
  if (!vinculando.value) return clientes.value.join(', ')
  const numeros = aCobrar.value.map(o => o.order_number)
  const resto = numeros.length - VISIBLES
  return numeros.slice(0, VISIBLES).join(', ') + (resto > 0 ? ` y ${resto} más` : '')
})

const detalleDe = (factura) => [factura.cliente, fechaCorta(factura.invoice_date),
  factura.es_fiscal ? '' : 'Sin comprobante'].filter(Boolean).join(' · ')
const datosDe = (t) => [
  { titulo: 'Facturado', valor: monto(t.facturado, t.currency) },
  { titulo: 'Cobrado', valor: monto(t.cobrado, t.currency) },
  { titulo: 'Falta', valor: monto(t.falta, t.currency), clase: Number(t.falta) > 0 ? 'text-error' : 'text-success' },
]

const facturas = ref([])
const totales = ref([])
const cargando = ref(false)
const abierta = ref(null)
const buscador = ref(0)
const yaVinculadas = computed(() => (vinculando.value ? [] : facturas.value.map(f => f.id)))

const { begin, isLatest } = useLatestRequest()

async function recargar () {
  if (!props.orden) return
  cargando.value = true
  const turno = begin()
  try {
    const [lista, resumen] = await Promise.all([
      BillingDataService.listInvoices({ order_id: props.orden.id, page_size: 100, con_abonos: true }),
      OrderDataService.getResumen(props.orden.id),
    ])
    if (!isLatest(turno)) return
    facturas.value = lista.data.results.map(InvoiceMappers.getMap)
    totales.value = resumen.data.totales || []
    if (conAbonos.value) conAbonos.value = facturas.value.find(f => f.id === conAbonos.value.id) || conAbonos.value
  } catch {
    if (!isLatest(turno)) return
    facturas.value = []
    totales.value = []
  } finally {
    if (isLatest(turno)) cargando.value = false
  }
}

// Las del cliente y las sueltas; con clientes distintos marcados, todas las del tipo.
const buscarFacturas = (page, size, q) => BillingDataService.listInvoices({
  page, page_size: size, q: q || undefined, tipo: 'fiscal', order_type: props.order_type,
  para_cliente: clientes.value.length === 1 ? aCobrar.value[0].client_data.id : undefined,
})

async function vincularA (factura) {
  buscador.value++
  if (!factura || !await vincular(factura, aCobrar.value)) return
  if (vinculando.value) emit('limpiar-seleccion')
  else recargar()
}

async function quitar (factura) {
  if (await desvincular(factura, props.orden)) recargar()
}

const enAbonos = ref(false)
const conAbonos = ref(null)
function abrirAbonos (factura) {
  conAbonos.value = factura
  enAbonos.value = true
}

// Al dejar una orden sin comprobante se abre el abono de su registro interno; se puede cerrar sin cobrar.
async function hacer (clave) {
  const cobrarYa = clave === SIN_COMPROBANTE && !vinculando.value && marcaDe(aCobrar.value) !== SIN_COMPROBANTE
  const hecho = await props.ejecutarAccion(clave, aCobrar.value)
  if (!hecho || !cobrarYa) return
  await recargar()
  const interna = facturas.value.find(f => !f.es_fiscal)
  if (interna) abrirAbonos(interna)
}

watch(() => props.orden?.id, () => {
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
.botones { display: grid; grid-auto-flow: column; grid-auto-columns: minmax(0, 1fr); gap: 0.5rem; }
.totales { display: grid; grid-template-columns: repeat(auto-fit, minmax(7rem, 1fr)); gap: 0.5rem; }
</style>
