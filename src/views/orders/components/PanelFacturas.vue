<template>
  <v-card class="panel-facturas d-flex flex-column" elevation="0" rounded="lg" border>
    <div class="pa-3 border-b-thin flex-shrink-0">
      <div class="d-flex align-center ga-2">
        <v-icon color="primary">{{ vinculando ? 'mdi-link-variant' : 'mdi-receipt-text-outline' }}</v-icon>
        <span class="text-subtitle-2 font-weight-bold">{{ titulo }}</span>
        <v-spacer />
        <v-btn v-if="vinculando || orden" icon="mdi-close" variant="text" size="small" density="comfortable"
               :title="vinculando ? 'Soltar las órdenes' : 'Cerrar'"
               @click="emit(vinculando ? 'limpiar-seleccion' : 'limpiar-foco')" />
      </div>
      <div v-if="subtitulo" class="text-caption text-medium-emphasis">{{ subtitulo }}</div>

      <paginated-autocomplete v-if="vinculando || orden" :key="buscador" :model-value="null" class="mt-3"
                              :fetch="buscarFacturas" :mapper="InvoiceMappers.getMap" :exclude-ids="yaVinculadas"
                              item-title="invoice_number" label="Buscar factura para vincular"
                              prepend-inner-icon="mdi-link-variant" density="compact" variant="outlined"
                              hide-details @selected="vincularA">
        <template #item="{ props: fila, item }">
          <v-list-item v-bind="fila" :title="item.raw.invoice_number || 'Sin número'"
                       :subtitle="[monto(item.raw.amount, item.raw.currency), item.raw.cliente || 'Suelta',
                                   fechaCorta(item.raw.invoice_date)].filter(Boolean).join(' · ')" />
        </template>
      </paginated-autocomplete>
    </div>

    <div v-if="!orden || vinculando" class="pa-6 text-center text-caption text-medium-emphasis">
      {{ vinculando ? 'Elige arriba la factura a la que se vinculan.'
                    : 'Elige una orden con el clic en su semáforo para ver sus facturas.' }}
    </div>

    <template v-else>
      <table-loading-overlay :loading="cargando" :isEmpty="facturas.length === 0" class="lista flex-grow-1">
        <div v-if="!facturas.length" class="pa-6 text-center text-caption text-medium-emphasis">
          Esta orden no tiene facturas.
        </div>

        <div v-for="factura in facturas" :key="factura.id" class="border-b-thin">
          <div class="fila px-3 py-2" @click="abierta = abierta === factura.id ? null : factura.id">
            <div class="d-flex justify-space-between ga-2">
              <span class="font-weight-medium">{{ factura.invoice_number || 'Sin número' }}</span>
              <span class="font-weight-medium">{{ montoDe(factura) ? monto(factura.amount, factura.currency) : '—' }}</span>
            </div>
            <div class="d-flex justify-space-between ga-2 text-caption text-medium-emphasis">
              <span>{{ detalleDe(factura) }}</span>
              <span :class="estadoDe(factura).color && `text-${estadoDe(factura).color}`">{{ estadoDe(factura).texto }}</span>
            </div>
          </div>

          <v-expand-transition>
            <div v-if="abierta === factura.id" class="px-3 pb-3 bg-hoja_de_apoyo">
              <div class="dato"><span>{{ factura.es_credito ? 'Crédito' : 'Contado' }}</span>
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

              <div class="d-flex flex-wrap ga-2 mt-2">
                <v-btn color="primary" variant="flat" size="small" prepend-icon="mdi-cash-plus"
                       @click="abrirAbonos(factura)">Registrar abono</v-btn>
                <v-btn v-if="factura.pdf_url" variant="outlined" size="small" prepend-icon="mdi-file-pdf-box"
                       @click="abrirEnOtraPestana(factura.pdf_url)">PDF</v-btn>
                <v-btn v-if="factura.es_fiscal" variant="outlined" size="small" prepend-icon="mdi-link-off"
                       @click="quitar(factura)">Desvincular</v-btn>
              </div>
            </div>
          </v-expand-transition>
        </div>
      </table-loading-overlay>

      <div v-if="totales.length" class="pa-3 border-t-thin flex-shrink-0">
        <div v-for="t in totales" :key="t.currency" class="totales">
          <div class="bg-hoja_de_apoyo rounded-lg pa-2"><div class="text-caption text-medium-emphasis">Facturado</div>
            <div class="font-weight-medium text-no-wrap">{{ monto(t.facturado, t.currency) }}</div></div>
          <div class="bg-hoja_de_apoyo rounded-lg pa-2"><div class="text-caption text-medium-emphasis">Cobrado</div>
            <div class="font-weight-medium text-no-wrap">{{ monto(t.cobrado, t.currency) }}</div></div>
          <div class="bg-hoja_de_apoyo rounded-lg pa-2"><div class="text-caption text-medium-emphasis">Falta</div>
            <div class="font-weight-medium text-no-wrap" :class="Number(t.falta) > 0 ? 'text-error' : 'text-success'">
              {{ monto(t.falta, t.currency) }}</div></div>
        </div>
      </div>
    </template>

    <dialog-invoice-payments v-model="enAbonos" :invoice="conAbonos" @close="enAbonos = false" />
  </v-card>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import PaginatedAutocomplete from '@/components/commonComponents/PaginatedAutocomplete.vue'
import TableLoadingOverlay from '@/components/commonComponents/TableLoadingOverlay.vue'
import { useLatestRequest } from '@/composables/useLatestRequest'
import InvoiceMappers from '@/mappers/invoiceMappers'
import BillingDataService from '@/services/billing/billingDataService'
import OrderDataService from '@/services/orders/orderDataService'
import { FORMA_DE_PAGO, desvincular, estadoDe, montoDe, vincular } from '@/utils/billing/facturas'
import { fechaCorta } from '@/utils/dates'
import { monto } from '@/utils/money'
import { abrirEnOtraPestana } from '@/utils/pdf'
import DialogInvoicePayments from '@/views/billing/components/DialogInvoicePayments.vue'

// Las facturas de la orden elegida; con ordenes marcadas, su buscador las vincula a todas.
const props = defineProps({
  order_type: { type: Number, required: true },
  orden: { type: Object, default: null },
  ordenes_seleccionadas: { type: Array, default: () => [] },
})
const emit = defineEmits(['limpiar-seleccion', 'limpiar-foco'])

const VISIBLES = 5
const vinculando = computed(() => props.ordenes_seleccionadas.length > 0)
const aVincular = computed(() => (vinculando.value ? props.ordenes_seleccionadas : [props.orden]))
const clientes = computed(() => [...new Set(aVincular.value.map(o => o.client_data?.name).filter(Boolean))])

const titulo = computed(() => {
  if (vinculando.value) {
    const n = props.ordenes_seleccionadas.length
    return `Vincular ${n} ${n === 1 ? 'orden' : 'órdenes'}`
  }
  return props.orden ? `Facturas de ${props.orden.order_number}` : 'Facturas'
})
const subtitulo = computed(() => {
  if (vinculando.value) {
    const numeros = props.ordenes_seleccionadas.map(o => o.order_number)
    const resto = numeros.length - VISIBLES
    return numeros.slice(0, VISIBLES).join(', ') + (resto > 0 ? ` y ${resto} más` : '')
  }
  return props.orden ? clientes.value.join(', ') : ''
})

const detalleDe = (factura) => [factura.cliente, fechaCorta(factura.invoice_date),
  factura.es_fiscal ? '' : 'Sin comprobante'].filter(Boolean).join(' · ')

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
  para_cliente: clientes.value.length === 1 ? aVincular.value[0].client_data.id : undefined,
})

async function vincularA (factura) {
  buscador.value++
  if (!factura || !await vincular(factura, aVincular.value)) return
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
.panel-facturas { max-height: 85vh; }
.lista { overflow-y: auto; min-height: 0; }
.fila { cursor: pointer; }
.fila:hover { background-color: rgba(var(--v-theme-on-surface), 0.04); }
.dato { display: flex; justify-content: space-between; gap: 0.5rem; padding-top: 0.25rem; font-size: 0.8125rem; }
.totales { display: grid; grid-template-columns: repeat(auto-fit, minmax(7rem, 1fr)); gap: 0.5rem; }
.totales + .totales { margin-top: 0.5rem; }
</style>
