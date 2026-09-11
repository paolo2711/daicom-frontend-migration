<template>
  <v-card 
    width="380" 
    class="elevation-4 rounded-lg tarjeta-limpia"
  >
    <v-toolbar :color="getColorStatus(orderData.status)" theme="dark" flat density="compact">
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

        <div v-else-if="orderData.invoices && orderData.invoices.length > 0">
          <v-sheet border rounded class="d-flex align-center justify-space-between bg-transparent pa-2 mb-1" v-for="inv in orderData.invoices" :key="inv.id">
            <div class="d-flex flex-column">
              <span class="text-body-2 font-weight-bold">{{ inv.invoice_number || 'Sin número' }}</span>
              <span class="text-caption text-grey-darken-1">{{ inv.invoice_date || 'Sin fecha' }}</span>
            </div>
            <div class="d-flex align-center">
              <span class="text-body-2 font-weight-bold text-primary mr-2">{{ simbolo(inv.currency) }} {{ formatMoney(inv.amount) }}</span>
              <v-tooltip location="bottom" v-if="inv.pdf_url">
                <template v-slot:activator="{ props }">
                  <v-btn icon variant="text" size="small" color="primary" density="comfortable" :href="inv.pdf_url" target="_blank" v-bind="props">
                    <v-icon size="small">mdi-file-eye</v-icon>
                  </v-btn>
                </template>
                <span>Ver Comprobante</span>
              </v-tooltip>
            </div>
          </v-sheet>
        </div>

        <v-alert v-else density="compact" variant="tonal" color="error" class="mb-0 text-caption font-weight-bold">
          <v-icon start size="small">mdi-alert-circle-outline</v-icon> Pendiente de facturar
        </v-alert>
      </div>

      <!-- Si no se cobra, "Abonos y Liquidacion" no tiene sentido: sin esto la
           seccion cae en "Pendiente de pago" y marca en naranja algo que no se
           va a cobrar nunca. -->
      <v-divider v-if="orderData.requiere_pago !== false" class="mb-4 border-opacity-25"></v-divider>

      <div v-if="orderData.requiere_pago !== false">
        <div class="d-flex align-center mb-2">
          <v-icon size="small" color="success" class="mr-1">mdi-cash-register</v-icon>
          <span class="text-caption font-weight-bold text-uppercase text-medium-emphasis">Abonos y Liquidación</span>
        </div>

        <div v-if="orderData.payments && orderData.payments.length > 0">
          <v-sheet border rounded class="d-flex align-center justify-space-between bg-transparent pa-2 mb-1" v-for="pay in orderData.payments" :key="pay.id">
            <div class="d-flex align-center">
              <v-icon size="small" :color="getColorPago(pay.payment_method)" class="mr-2">{{ getIconoPago(pay.payment_method) }}</v-icon>
              <div class="d-flex flex-column">
                <span class="text-body-2 font-weight-bold text-capitalize">{{ (pay.payment_method || '').toLowerCase() }}</span>
                <span class="text-caption text-grey-darken-1">{{ pay.payment_date }}</span>
              </div>
            </div>
            <div class="d-flex align-center">
              <span class="text-body-2 font-weight-bold text-success mr-2">{{ simbolo(pay.currency) }} {{ formatMoney(pay.amount) }}</span>
              <v-tooltip location="bottom" v-if="pay.payment_proof">
                <template v-slot:activator="{ props }">
                  <v-btn icon variant="text" size="small" color="primary" density="comfortable" :href="pay.payment_proof" target="_blank" v-bind="props">
                    <v-icon size="small">mdi-file-eye</v-icon>
                  </v-btn>
                </template>
                <span>Ver Comprobante</span>
              </v-tooltip>
            </div>
          </v-sheet>
          
          <div v-if="orderData.payments.length > 1" class="d-flex justify-end mt-1 px-2">
            <span class="text-caption font-weight-bold">Total Abonado: <span class="text-success">{{ simbolo() }} {{ totalPagado }}</span></span>
          </div>
        </div>

        <v-alert v-else density="compact" variant="tonal" color="warning" class="mb-0 text-caption font-weight-bold text-orange-darken-4">
          <v-icon start size="small">mdi-clock-outline</v-icon> Pendiente de pago
        </v-alert>
      </div>
      
      <v-btn block color="primary" variant="tonal" class="mt-4 font-weight-bold" @click="$emit('seleccionar-orden')">
        Seleccionar todos los equipos
      </v-btn>
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

const emit = defineEmits(['cerrar-tarjeta', 'seleccionar-orden'])
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

const totalPagado = computed(() => {
  if (!orderData.value.payments) return "0.00"
  const total = orderData.value.payments.reduce((sum, pay) => sum + parseFloat(pay.amount || 0), 0)
  return total.toFixed(2)
})

const formatMoney = (val) => parseFloat(val || 0).toFixed(2)

// La moneda vive en cada factura y en cada abono; la orden no tiene.
const simbolo = (currency) => (currency === 'USD' ? '$' : 'S/')

const irAOrden = () => {
  router.push({ path: '/orders', query: { buscar_orden: props.orderNumber } }).catch(()=>{})
}

const getColorStatus = (status) => {
  if (status === 4) return 'red-darken-3' // Anulada
  return 'primary' // Normal
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
.tarjeta-limpia {
  border: 1px solid rgba(0,0,0,0.1);
  overflow: hidden;
}
</style>