<template>
  <v-card variant="flat" class="border rounded-lg pa-4 mb-4 bg-surface">
    <div class="text-subtitle-1 font-weight-bold text-primary mb-3">
      <v-icon size="small" class="mr-1">mdi-text-box-outline</v-icon> Datos de Cotización
    </div>
    <v-row dense class="mb-4">
      <v-col cols="12" md="3">
        <v-text-field v-model="meta.date" label="Fecha" type="date" density="compact" variant="outlined" hide-details="auto" />
      </v-col>
      <v-col cols="12" md="3">
        <v-text-field v-model="meta.validity_days" label="Validez (Días)" type="number" density="compact" variant="outlined" hide-details="auto" />
      </v-col>
      <v-col cols="12" md="3">
        <v-select v-model="meta.currency" :items="['PEN', 'USD']" label="Moneda" density="compact" variant="outlined" hide-details="auto" />
      </v-col>
      <v-col cols="12" md="3">
        <v-select v-model="meta.payment_terms" :items="['Contado', 'Crédito 15 días', 'Crédito 30 días']" label="Forma de Pago" density="compact" variant="outlined" hide-details="auto" />
      </v-col>
    </v-row>

    <v-divider class="mb-4"></v-divider>

    <div class="text-subtitle-1 font-weight-bold text-primary mb-3">
      <v-icon size="small" class="mr-1">mdi-domain</v-icon> Cliente a Facturar
    </div>

    <ClientSmartSearch
      :model-value="clientId"
      @update:model-value="$emit('update:clientId', $event)"
      @client-selected="aplicarCliente"
      class="mb-4"
    />

    <v-alert v-if="isLocked && clientId" type="warning" variant="tonal" density="compact" class="mb-4" icon="mdi-alert">
      Este cliente está incompleto. Use la barra de arriba para buscar su RUC/DNI en SUNAT/RENIEC y actualizarlo automáticamente.
    </v-alert>

    <v-row dense class="mb-4">
      <v-col cols="12" md="8">
        <v-text-field v-model="billing.business_name" label="Razón Social / Nombre" :disabled="isLocked" density="compact" variant="outlined" hide-details="auto" />
      </v-col>
      <v-col cols="12" md="4">
        <v-text-field v-model="billing.doc_number" :label="billing.doc_type || 'Documento'" :disabled="true" hint="Se autocompleta con la búsqueda" persistent-hint density="compact" variant="outlined" hide-details="auto" />
      </v-col>
      <v-col cols="12" md="12" class="mt-2">
        <v-text-field v-model="billing.address" label="Dirección" :disabled="isLocked" density="compact" variant="outlined" hide-details="auto" />
      </v-col>
    </v-row>

    <div class="mt-4 border rounded-lg pa-3" :class="$vuetify.theme.current.dark ? 'bg-grey-darken-4' : 'bg-grey-lighten-4'">
      <v-checkbox 
        v-model="certificate.same_as_billing_client" 
        label="Los datos del certificado son los mismos que los de facturación" 
        color="primary" 
        hide-details 
        density="compact"
        class="font-weight-bold"
      />
      
      <v-expand-transition>
        <div v-if="!certificate.same_as_billing_client" class="pt-3">
          <v-row dense>
            <v-col cols="12" md="6">
              <v-text-field v-model="certificate.business_name" label="Razón Social (Para Certificado)" density="compact" variant="outlined" hide-details="auto" />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field v-model="certificate.address" label="Dirección (Para Certificado)" density="compact" variant="outlined" hide-details="auto" />
            </v-col>
          </v-row>
        </div>
      </v-expand-transition>
    </div>
  </v-card>
</template>

<script setup>
import { computed } from 'vue'
import ClientSmartSearch from '@/components/shared/ClientSmartSearch.vue'

const props = defineProps({
  meta: Object,
  billing: Object,
  certificate: Object,
  clientId: { type: [Number, String], default: null }
})

const emit = defineEmits(['update:clientId'])

// LÓGICA DE BLOQUEO
const isLocked = computed(() => {
  if (!props.clientId) return true
  const hasDoc = props.billing.doc_number && props.billing.doc_number.trim() !== ''
  return !hasDoc
})

const aplicarCliente = (c) => {
  const DOC_TYPE_LABEL = { 1: 'DNI', 2: 'RUC', 3: 'SIN DOCUMENTO' }
  props.billing.business_name = c.name
  props.billing.doc_type = DOC_TYPE_LABEL[c.documentType] || 'SIN DOCUMENTO'
  props.billing.doc_number = c.document || ''
  props.billing.address = c.address || ''
  props.billing.phone = c.phone || ''
  if (c.email) props.billing.email = c.email
}
</script>