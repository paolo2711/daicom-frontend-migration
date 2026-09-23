<template>
  <v-card 
    width="380" 
    class="panel-flotante"
  >
    <v-toolbar color="transparent" flat density="compact" class="panel-flotante__encabezado">
      <v-btn icon variant="text" size="small" @click="$emit('cerrar-tarjeta')" class="mr-1">
        <v-icon size="small">mdi-arrow-left</v-icon>
      </v-btn>
      <span class="text-subtitle-2 font-weight-bold">{{ orderNumber }}</span>
      
      <v-spacer/>
      
      <v-tooltip location="bottom">
        <template v-slot:activator="{ props }">
          <v-btn icon variant="text" size="small" v-bind="props" @click="irAOrden">
            <v-icon size="small">mdi-open-in-new</v-icon>
          </v-btn>
        </template>
        <span>Ir a la Orden Completa</span>
      </v-tooltip>
    </v-toolbar>

    <v-card-text v-if="loading" class="text-center pa-6">
      <v-progress-circular indeterminate color="primary" size="32"></v-progress-circular>
      <div class="text-caption mt-2 text-grey">Cargando datos financieros...</div>
    </v-card-text>

    <v-card-text v-else class="pa-4 bg-surface">
      <div class="mb-4">
        <div class="d-flex align-center mb-2">
          <v-icon size="small" color="primary" class="mr-1">mdi-file-document-outline</v-icon>
          <span class="text-caption font-weight-bold text-uppercase text-medium-emphasis">Comprobantes</span>
        </div>
        
        <!-- Sin cargo va primero: si no, una orden interna dice "el cliente no
             requiere comprobante", que es falso: el cliente somos nosotros. -->
        <v-alert v-if="orderData.requiere_pago === false" density="compact" variant="tonal" color="success" class="mb-0 text-caption font-weight-bold">
          <v-icon start size="small">mdi-cash-off</v-icon> Sin cargo, no se cobra
        </v-alert>

        <v-alert v-else-if="orderData.wants_invoice === false" density="compact" variant="tonal" color="info" class="mb-0 text-caption font-weight-bold">
          <v-icon start size="small">mdi-file-cancel</v-icon> Cliente no requiere comprobante
        </v-alert>

        <div v-else-if="facturas.length">
          <v-sheet v-for="inv in facturasVisibles" :key="inv.id" border rounded
                   class="d-flex align-center justify-space-between bg-transparent pa-2 mb-1"
                   :class="{ 'fila-con-doc': inv.pdf_url }"
                   :title="inv.pdf_url ? 'Ver comprobante' : ''"
                   @click="abrirDoc(inv.pdf_url)">
            <div class="d-flex flex-column">
              <span class="text-body-2 font-weight-bold">{{ inv.invoice_number || 'Sin número' }}</span>
              <span class="text-caption text-medium-emphasis">{{ inv.invoice_date || 'Sin fecha' }}</span>
            </div>
            <div class="d-flex align-center">
              <span class="text-body-2 font-weight-bold mr-2">{{ simbolo(inv.currency) }} {{ formatMoney(inv.amount) }}</span>
              <v-icon size="small" :color="inv.pdf_url ? 'primary' : 'grey'">
                {{ inv.pdf_url ? 'mdi-file-eye' : 'mdi-file-hidden' }}
              </v-icon>
            </div>
          </v-sheet>

          <v-btn v-if="facturas.length > VISIBLES" variant="text" size="small" block
                 class="text-caption" @click="irAOrden">
            + {{ facturas.length - VISIBLES }} más · Ver en Órdenes
          </v-btn>
        </div>

        <v-alert v-else density="compact" variant="tonal" color="error" class="mb-0 text-caption font-weight-bold">
          <v-icon start size="small">mdi-alert-circle-outline</v-icon> Pendiente de facturar
        </v-alert>
      </div>

      <!-- Si no se cobra, "Abonos y Liquidacion" no tiene sentido: sin esto la
           seccion cae en "Pendiente de pago" y marca en naranja algo que no se
           va a cobrar nunca. -->
      <template v-if="orderData.requiere_pago !== false">
        <v-divider class="mb-4 border-opacity-25"></v-divider>

        <div class="d-flex align-center mb-2">
          <v-icon size="small" color="success" class="mr-1">mdi-cash-register</v-icon>
          <span class="text-caption font-weight-bold text-uppercase text-medium-emphasis">Abonos y Liquidación</span>
        </div>

        <div v-if="abonos.length">
          <v-sheet v-for="pay in abonosVisibles" :key="pay.id" border rounded
                   class="d-flex align-center justify-space-between bg-transparent pa-2 mb-1"
                   :class="{ 'fila-con-doc': pay.payment_proof }"
                   :title="pay.payment_proof ? 'Ver comprobante' : ''"
                   @click="abrirDoc(pay.payment_proof)">
            <div class="d-flex align-center">
              <v-icon size="small" :color="getColorPago(pay.payment_method)" class="mr-2">{{ getIconoPago(pay.payment_method) }}</v-icon>
              <div class="d-flex flex-column">
                <span class="text-body-2 font-weight-bold text-capitalize">{{ (pay.payment_method || '').toLowerCase() }}</span>
                <span class="text-caption text-medium-emphasis">{{ pay.payment_date }}</span>
              </div>
            </div>
            <div class="d-flex align-center">
              <span class="text-body-2 font-weight-bold text-success mr-2">{{ simbolo(pay.currency) }} {{ formatMoney(pay.amount) }}</span>
              <v-icon size="small" :color="pay.payment_proof ? 'primary' : 'grey'">
                {{ pay.payment_proof ? 'mdi-file-eye' : 'mdi-file-hidden' }}
              </v-icon>
            </div>
          </v-sheet>

          <v-btn v-if="abonos.length > VISIBLES" variant="text" size="small" block
                 class="text-caption" @click="irAOrden">
            + {{ abonos.length - VISIBLES }} más · Ver en Órdenes
          </v-btn>

          <div v-if="abonos.length > 1" class="d-flex justify-end mt-1 px-2">
            <span class="text-caption font-weight-bold">
              Total abonado:
              <span v-for="(t, i) in totalPorMoneda" :key="t.currency" class="text-success">
                {{ i ? ' · ' : ' ' }}{{ simbolo(t.currency) }} {{ t.monto }}
              </span>
            </span>
          </div>
        </div>

        <!-- Sin factura no hay nada que cobrar todavia: decirlo en naranja pone
             dos alarmas para el mismo hecho. -->
        <v-alert v-else-if="facturas.length" density="compact" variant="tonal" color="warning" class="mb-0 text-caption font-weight-bold text-orange-darken-4">
          <v-icon start size="small">mdi-clock-outline</v-icon> Pendiente de pago
        </v-alert>

        <span v-else class="text-caption text-medium-emphasis">Se cobra al emitir la factura.</span>
      </template>
      
      <div class="d-flex justify-end mt-4">
        <v-btn color="primary" variant="flat" size="small" rounded="lg"
               class="font-weight-bold text-none px-4"
               prepend-icon="mdi-checkbox-multiple-marked-outline"
               @click="$emit('seleccionar-orden')">
          Seleccionar equipos
        </v-btn>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import OrderDataService from '@/services/orders/orderDataService.js'

const props = defineProps({
  orderId: { type: Number, required: true },
  orderNumber: { type: String, required: true }
})

defineEmits(['cerrar-tarjeta', 'seleccionar-orden'])
const router = useRouter()

const loading = ref(true)
const orderData = ref({})

const fetchOrderData = () => {
  loading.value = true
  OrderDataService.getResumen(props.orderId)
    .then(res => { orderData.value = res.data || {} })
    .finally(() => { loading.value = false })
}

onMounted(() => {
  fetchOrderData()
})

// La tarjeta es un resumen: el detalle completo vive en Ordenes.
const VISIBLES = 3

const facturas = computed(() => orderData.value.invoices || [])
const abonos = computed(() => orderData.value.payments || [])
const facturasVisibles = computed(() => facturas.value.slice(0, VISIBLES))
const abonosVisibles = computed(() => abonos.value.slice(0, VISIBLES))

// Una orden puede tener abonos en soles y en dolares. Sumarlos juntos da un
// numero que no existe, asi que va uno por moneda.
const totalPorMoneda = computed(() => {
  const porMoneda = {}
  for (const pago of abonos.value) {
    const moneda = pago.currency || 'PEN'
    porMoneda[moneda] = (porMoneda[moneda] || 0) + parseFloat(pago.amount || 0)
  }
  return Object.entries(porMoneda).map(([currency, monto]) => ({ currency, monto: monto.toFixed(2) }))
})

const abrirDoc = (url) => { if (url) window.open(url, '_blank') }

const formatMoney = (val) => parseFloat(val || 0).toFixed(2)

// La moneda vive en cada factura y en cada abono; la orden no tiene.
const simbolo = (currency) => (currency === 'USD' ? '$' : 'S/')

const irAOrden = () => {
  router.push({ path: '/orders', query: { buscar_orden: props.orderNumber } }).catch(()=>{})
}

const getIconoPago = (metodo) => {
  if (metodo === 'EFECTIVO') return 'mdi-cash'
  if (metodo === 'BILLETERA') return 'mdi-cellphone-nfc'
  if (metodo === 'TRANSFERENCIA') return 'mdi-bank-transfer'
  return 'mdi-cash-register'
}

const getColorPago = (metodo) => {
  if (metodo === 'EFECTIVO') return 'green-darken-1'
  if (metodo === 'BILLETERA') return 'purple-darken-1'
  if (metodo === 'TRANSFERENCIA') return 'blue-darken-1'
  return 'grey'
}
</script>

<style scoped>
.fila-con-doc {
  cursor: pointer;
}
.fila-con-doc:hover {
  border-color: rgb(var(--v-theme-primary));
}
</style>
