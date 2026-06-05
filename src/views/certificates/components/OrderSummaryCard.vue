<template>
  <v-card 
    width="380" 
    class="elevation-4 rounded-lg tarjeta-limpia"
  >
    <v-toolbar color="primary" theme="dark" flat density="compact">
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

    <v-card-text v-else class="pa-0">
      <div class="pa-3 text-grey" :class="isDark ? 'bg-grey-darken-4' : 'bg-grey-lighten-4'">
        
        <div class="d-flex align-center justify-space-between mb-3">
          <v-chip size="small" color="blue-grey" class="text-white font-weight-bold">
            <v-icon start size="small">mdi-package-variant-closed</v-icon>
            Ampara {{ certCodes.length }} certificados
          </v-chip>
          <v-tooltip location="bottom" color="black" max-width="250">
            <template v-slot:activator="{ props }">
              <v-icon size="small" color="grey-darken-1" v-bind="props">mdi-help-circle</v-icon>
            </template>
            <span class="text-caption font-weight-bold">Códigos incluidos:</span><br>
            <span class="text-caption">{{ certCodes.join(', ') }}</span>
          </v-tooltip>
        </div>

        <v-divider class="mb-3"/>

        <div class="d-flex align-center justify-space-between mb-2">
          <span class="text-caption font-weight-bold">Estado de Factura:</span>
          <v-chip size="small" 
                  :color="(orderData.billed_pdf || orderData.invoice_number === 'SIN FACTURA') ? 'success' : (orderData.billed ? 'warning' : 'grey')" 
                  label>
            <span v-if="orderData.invoice_number === 'SIN FACTURA'">Cliente no requiere factura</span>
            <span v-else-if="orderData.billed_pdf">Facturado (Con PDF)</span>
            <span v-else-if="orderData.billed">Facturado (Sin PDF)</span>
            <span v-else>Pendiente</span>
          </v-chip>
          <v-btn v-if="orderData.billed_pdf" icon variant="text" size="small" color="error" :href="orderData.billed_pdf" target="_blank">
            <v-icon size="small">mdi-file-pdf-box</v-icon>
          </v-btn>
        </div>

        <div class="text-caption font-weight-bold mt-3 mb-1">Historial de Pagos:</div>
        
        <v-alert v-if="!orderData.payments || orderData.payments.length === 0" type="info" variant="tonal" density="compact" class="mb-0 text-caption pa-2">
          No hay abonos registrados.
        </v-alert>

        <v-list v-else density="compact" class="rounded-lg pa-0 bg-transparent" style="border: 1px solid rgba(0,0,0,0.1)">
          <v-list-item v-for="pago in orderData.payments" :key="pago.id" style="border-bottom: 1px solid rgba(0,0,0,0.1)">
            <template v-slot:prepend>
              <v-avatar size="32" :color="getColorPago(pago.payment_method) + '-lighten-5'" class="mr-3">
                <v-icon size="small" :color="getColorPago(pago.payment_method)">{{ getIconoPago(pago.payment_method) }}</v-icon>
              </v-avatar>
            </template>
            <v-list-item-title class="font-weight-bold text-caption">S/ {{ pago.amount }}</v-list-item-title>
            <v-list-item-subtitle style="font-size: 10px;">{{ pago.payment_method }}</v-list-item-subtitle>
            
            <template v-slot:append>
              <v-list-item-action v-if="pago.payment_proof" class="ma-0">
                <v-tooltip location="bottom">
                  <template v-slot:activator="{ props }">
                    <v-btn icon variant="text" size="small" color="primary" :href="pago.payment_proof" target="_blank" v-bind="props">
                      <v-icon size="small">mdi-file-eye</v-icon>
                    </v-btn>
                  </template>
                  <span>Ver Comprobante</span>
                </v-tooltip>
              </v-list-item-action>
            </template>
          </v-list-item>
        </v-list>

        <v-divider class="my-3 border-opacity-25" />
        <v-btn 
          variant="flat" 
          color="primary" 
          block 
          size="small" 
          class="font-weight-bold"
          @click="$emit('seleccionar-orden')"
        >
          <v-icon start size="small">mdi-checkbox-multiple-marked</v-icon>
          Seleccionar {{ certCodes.length }} certificados
        </v-btn>

      </div>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useTheme } from 'vuetify'
import OrderDataService from "@/services/certificates/orderDataService"

const props = defineProps({
  orderNumber: { type: String, required: true },
  certCodes: { type: Array, required: true }
})

const emit = defineEmits(['cerrar-tarjeta', 'seleccionar-orden'])

const router = useRouter()
const theme = useTheme()

const loading = ref(true)
const orderData = ref({})

const isDark = computed(() => theme.global.current.value.dark)

const fetchOrderData = () => {
  loading.value = true
  OrderDataService.getFiltered(1, 1, '', props.orderNumber)
    .then(res => {
      if (res.data.results && res.data.results.length > 0) {
        orderData.value = res.data.results[0]
      }
    })
    .finally(() => { loading.value = false })
}

onMounted(() => {
  fetchOrderData()
})

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
  if (metodo === 'EFECTIVO') return 'green'
  if (metodo === 'BILLETERA') return 'purple'
  if (metodo === 'TRANSFERENCIA') return 'blue'
  return 'grey'
}
</script>

<style scoped>
.tarjeta-limpia {
  cursor: default !important;
  user-select: none !important;
}
.tarjeta-limpia .text-subtitle-2, 
.tarjeta-limpia .text-caption {
  user-select: text !important;
}
</style>