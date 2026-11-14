<template>
  <div>
    <div class="text-subtitle-1 font-weight-bold text-primary mb-3">
      <v-icon size="small" class="mr-1">mdi-domain</v-icon> Cliente a facturar
    </div>

    <client-lookup-bar v-model="clientId" :forma="apilado ? 'apilada' : 'mitades'" :campo="CAMPO" class="mb-4"
                       @client-selected="aplicarCliente" />

    <v-alert v-if="bloqueado && clientId" type="warning" variant="tonal" density="compact" class="mb-4" icon="mdi-alert">
      Este cliente está incompleto. Búsquelo por RUC/DNI en SUNAT/RENIEC con la barra de arriba para completarlo.
    </v-alert>

    <!-- Todo el panel va en la misma reticula de 4 columnas (md="3" cada una):
         los bordes coinciden de fila a fila. -->
    <v-row dense>
      <!-- Razon social y documento salen del cliente elegido, como en una factura; el back los toma de ahi. -->
      <v-col v-bind="ancho(9)">
        <v-text-field v-model="billing.business_name" label="Razón social (del cliente elegido)" disabled
                      v-bind="CAMPO" />
      </v-col>
      <v-col v-bind="ancho(3)">
        <v-text-field v-model="billing.doc_number" :label="billing.doc_type || 'Documento'" disabled
                      v-bind="CAMPO" />
      </v-col>
      <v-col cols="12">
        <v-text-field v-model="billing.address" label="Dirección" :disabled="bloqueado"
                      v-bind="CAMPO" />
      </v-col>
    </v-row>

    <div class="text-body-2 font-weight-bold text-medium-emphasis mt-4 mb-2">
      Contacto de esta {{ DOCUMENTOS[tipoDeDocumento].nombre }} (opcional)
    </div>
    <v-row dense>
      <v-col v-bind="ancho(3, { sm: 6 })">
        <v-text-field v-model="billing.area" label="Área o dependencia" placeholder="Ej: Facultad de Ingeniería"
                      prepend-inner-icon="mdi-office-building-outline" :maxlength="LIMITES.area"
                      v-bind="CAMPO">
          <template #append-inner><inner-counter :valor="billing.area" :max="LIMITES.area" /></template>
        </v-text-field>
      </v-col>
      <v-col v-bind="ancho(3, { sm: 6 })">
        <v-text-field v-model="billing.contact_name" label="Atención" prepend-inner-icon="mdi-account-outline"
                      v-bind="CAMPO" />
      </v-col>
      <v-col v-bind="ancho(3, { sm: 6 })">
        <v-text-field v-model="billing.phone" label="Teléfono" prepend-inner-icon="mdi-phone-outline"
                      v-bind="CAMPO" />
      </v-col>
      <v-col v-bind="ancho(3, { sm: 6 })">
        <v-text-field v-model="billing.email" label="Correo" prepend-inner-icon="mdi-email-outline"
                      v-bind="CAMPO" />
      </v-col>
    </v-row>

    <!-- En un alquiler no se emite certificado a nombre del cliente. -->
    <v-checkbox v-if="meta.kind === 'servicio'" v-model="certificate.same_as_billing_client" color="primary"
                hide-details density="compact" label="El certificado va a nombre del mismo cliente" class="mt-2" />
    <v-expand-transition>
      <v-row v-if="meta.kind === 'servicio' && !certificate.same_as_billing_client" dense>
        <v-col v-bind="ancho(6)">
          <v-text-field v-model="certificate.business_name" label="Razón social del certificado"
                        v-bind="CAMPO" />
        </v-col>
        <v-col v-bind="ancho(6)">
          <v-text-field v-model="certificate.address" label="Dirección del certificado"
                        v-bind="CAMPO" />
        </v-col>
      </v-row>
    </v-expand-transition>

    <v-divider class="my-4" />

    <div class="text-subtitle-1 font-weight-bold text-primary mb-3">
      <v-icon size="small" class="mr-1">mdi-text-box-outline</v-icon> Condiciones
    </div>
    <v-row dense>
      <v-col v-bind="ancho(3, { sm: 6, apilado: 6 })">
        <date-picker label="Fecha" :date="meta.date" :campo="CAMPO" @setPickedDate="v => (meta.date = v)" />
      </v-col>
      <v-col v-if="DOCUMENTOS[tipoDeDocumento].conValidez" v-bind="ancho(3, { sm: 6, apilado: 6 })">
        <v-text-field v-model.number="meta.validity_days" label="Validez" suffix="días" type="number" min="1"
                      v-bind="CAMPO" />
      </v-col>
      <v-col v-bind="ancho(3, { sm: 6, apilado: 6 })">
        <v-select v-model="meta.currency" :items="MONEDAS" label="Moneda" v-bind="CAMPO" />
      </v-col>
      <v-col v-bind="ancho(3, { sm: 6, apilado: 6 })">
        <v-select v-model="meta.payment_terms" :items="FORMAS_DE_PAGO" label="Forma de pago"
                  v-bind="CAMPO" />
      </v-col>
      <v-col v-bind="ancho(6)">
        <v-text-field v-model="meta.delivery_time"
                      :label="`${etiquetaDelPlazo(tipoDeDocumento, meta.kind)} (opcional)`"
                      :placeholder="ejemploDelPlazo(tipoDeDocumento, meta.kind)" persistent-placeholder
                      v-bind="CAMPO" />
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import DatePicker from '@/components/commonComponents/DatePicker.vue'
import ClientLookupBar from '@/components/shared/ClientLookupBar.vue'
import InnerCounter from '@/components/shared/InnerCounter.vue'
import { CAMPO } from '@/utils/fields'
import {
  DOCUMENTOS, FORMAS_DE_PAGO, LIMITES, ejemploDelPlazo, etiquetaDelPlazo,
} from '@/utils/documents/quoteDefaults'
import { COTIZACION } from '@/utils/documents/tipos'
import { MONEDAS } from '@/utils/money'

// `apilado`: en una columna angosta cada campo toma la fila; fecha, validez, moneda y pago, media.
const props = defineProps({
  apilado: { type: Boolean, default: false },
  tipoDeDocumento: { type: String, default: COTIZACION },
})
const ancho = (md, { sm, apilado = 12 } = {}) => (props.apilado ? { cols: apilado } : { cols: 12, sm, md })

const meta = defineModel('meta', { type: Object, required: true })
const billing = defineModel('billing', { type: Object, required: true })
const certificate = defineModel('certificate', { type: Object, required: true })
const clientId = defineModel('clientId', { type: [Number, String], default: null })


// Sin un cliente con documento no se puede guardar: la direccion espera a que lo tenga.
const bloqueado = computed(() => !clientId.value || !billing.value.doc_number?.trim())

// Del cliente salen sus datos de factura. El telefono y el correo no: son del
// contacto de este documento, que depende del area a la que va.
const aplicarCliente = (c) => {
  Object.assign(billing.value, {
    business_name: c.name,
    doc_type: c.documentType_name || 'SIN DOCUMENTO',
    doc_number: c.document || '',
    address: c.address || '',
  })
}
</script>
