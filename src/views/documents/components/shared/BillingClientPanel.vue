<template>
  <div>
    <div class="text-subtitle-1 font-weight-bold text-primary mb-3">
      <v-icon size="small" class="mr-1">mdi-domain</v-icon> Cliente a facturar
    </div>

    <client-lookup-bar v-model="clientId" class="mb-4" @client-selected="aplicarCliente" />

    <v-alert v-if="bloqueado && clientId" type="warning" variant="tonal" density="compact" class="mb-4" icon="mdi-alert">
      Este cliente está incompleto. Búsquelo por RUC/DNI en SUNAT/RENIEC con la barra de arriba para completarlo.
    </v-alert>

    <!-- Todo el panel va en la misma reticula de 4 columnas (md="3" cada una):
         los bordes coinciden de fila a fila. -->
    <v-row dense>
      <!-- Razon social y documento salen del cliente elegido, como en una factura; el back los toma de ahi. -->
      <v-col cols="12" md="9">
        <v-text-field v-model="billing.business_name" label="Razón social (del cliente elegido)" disabled
                      density="compact" variant="outlined" hide-details />
      </v-col>
      <v-col cols="12" md="3">
        <v-text-field v-model="billing.doc_number" :label="billing.doc_type || 'Documento'" disabled
                      density="compact" variant="outlined" hide-details />
      </v-col>
      <v-col cols="12">
        <v-text-field v-model="billing.address" label="Dirección" :disabled="bloqueado"
                      density="compact" variant="outlined" hide-details />
      </v-col>
    </v-row>

    <div class="text-body-2 font-weight-bold text-medium-emphasis mt-4 mb-2">Contacto de esta cotización (opcional)</div>
    <v-row dense>
      <v-col cols="12" sm="6" md="3">
        <v-text-field v-model="billing.area" label="Área o dependencia" placeholder="Ej: Facultad de Ingeniería"
                      prepend-inner-icon="mdi-office-building-outline" :maxlength="LIMITES.area"
                      density="compact" variant="outlined" hide-details>
          <template #append-inner><inner-counter :valor="billing.area" :max="LIMITES.area" /></template>
        </v-text-field>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-text-field v-model="billing.contact_name" label="Atención" prepend-inner-icon="mdi-account-outline"
                      density="compact" variant="outlined" hide-details />
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-text-field v-model="billing.phone" label="Teléfono" prepend-inner-icon="mdi-phone-outline"
                      density="compact" variant="outlined" hide-details />
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-text-field v-model="billing.email" label="Correo" prepend-inner-icon="mdi-email-outline"
                      density="compact" variant="outlined" hide-details />
      </v-col>
    </v-row>

    <!-- En un alquiler no se emite certificado a nombre del cliente. -->
    <v-checkbox v-if="meta.kind === 'servicio'" v-model="certificate.same_as_billing_client" color="primary"
                hide-details density="compact" label="El certificado va a nombre del mismo cliente" class="mt-2" />
    <v-expand-transition>
      <v-row v-if="meta.kind === 'servicio' && !certificate.same_as_billing_client" dense>
        <v-col cols="12" md="6">
          <v-text-field v-model="certificate.business_name" label="Razón social del certificado"
                        density="compact" variant="outlined" hide-details="auto" />
        </v-col>
        <v-col cols="12" md="6">
          <v-text-field v-model="certificate.address" label="Dirección del certificado"
                        density="compact" variant="outlined" hide-details="auto" />
        </v-col>
      </v-row>
    </v-expand-transition>

    <v-divider class="my-4" />

    <div class="text-subtitle-1 font-weight-bold text-primary mb-3">
      <v-icon size="small" class="mr-1">mdi-text-box-outline</v-icon> Condiciones
    </div>
    <v-row dense>
      <v-col cols="12" sm="6" md="3">
        <v-text-field v-model="meta.date" label="Fecha" type="date" density="compact" variant="outlined" hide-details="auto" />
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-text-field v-model.number="meta.validity_days" label="Validez" suffix="días" type="number" min="1"
                      density="compact" variant="outlined" hide-details="auto" />
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-select v-model="meta.currency" :items="MONEDAS" label="Moneda" density="compact" variant="outlined" hide-details="auto" />
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-select v-model="meta.payment_terms" :items="FORMAS_DE_PAGO" label="Forma de pago"
                  density="compact" variant="outlined" hide-details="auto" />
      </v-col>
      <v-col cols="12" md="6">
        <v-text-field v-model="meta.delivery_time" :label="`${tipo.etiquetaPlazo} (opcional)`" :placeholder="tipo.ejemploPlazo"
                      persistent-placeholder density="compact" variant="outlined" hide-details="auto" />
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import ClientLookupBar from '@/components/shared/ClientLookupBar.vue'
import InnerCounter from '@/components/shared/InnerCounter.vue'
import { FORMAS_DE_PAGO, LIMITES, TIPOS_DE_COTIZACION } from '@/utils/documents/quoteDefaults'
import { MONEDAS } from '@/utils/money'

const meta = defineModel('meta', { type: Object, required: true })
const billing = defineModel('billing', { type: Object, required: true })
const certificate = defineModel('certificate', { type: Object, required: true })
const clientId = defineModel('clientId', { type: [Number, String], default: null })

const tipo = computed(() => TIPOS_DE_COTIZACION[meta.value.kind])

// Sin un cliente con documento no se puede guardar: la direccion espera a que lo tenga.
const bloqueado = computed(() => !clientId.value || !billing.value.doc_number?.trim())

// Del cliente salen sus datos de factura. El telefono y el correo no: son del
// contacto de esta cotizacion, que depende del area a la que va.
const aplicarCliente = (c) => {
  Object.assign(billing.value, {
    business_name: c.name,
    doc_type: c.documentType_name || 'SIN DOCUMENTO',
    doc_number: c.document || '',
    address: c.address || '',
  })
}
</script>
