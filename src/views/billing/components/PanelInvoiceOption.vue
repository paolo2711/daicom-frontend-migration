<template>
  <detail-panel :titulo="TITULOS[clave]" @cerrar="emit('cerrar')">
    <template v-if="clave === 'detraccion'">
      <v-select v-model="datos.detraccion.codigo" :items="codigos" :item-title="nombreDelCodigo" item-value="codigo"
                label="Código del bien o servicio" v-bind="CAMPO" />
      <card-invoice-summary :cuenta="cuenta" :moneda="datos.moneda" />
      <div v-if="cuenta.detraccion.aplica" class="text-caption text-medium-emphasis">
        <template v-if="cuentaDeDetracciones">El cliente la deposita en la cuenta {{ cuentaDeDetracciones }} del Banco de la
          Nación. </template>
        <template v-if="datos.moneda !== 'PEN' && cuenta.detraccion.en_soles == null">
          Falta el tipo de cambio: SUNAT la recibe en soles.
        </template>
      </div>
    </template>

    <template v-else-if="clave === 'moneda'">
      <v-select v-model="datos.moneda" :items="MONEDAS" label="Moneda" v-bind="CAMPO" />
      <v-text-field v-if="datos.moneda !== 'PEN'" v-model="datos.tipo_de_cambio" type="number" min="0" step="0.001"
                    :prefix="`1 ${datos.moneda} =`" suffix="soles" label="Tipo de cambio" v-bind="CAMPO" />
    </template>

    <v-combobox v-else-if="clave === 'orden_de_compra'" v-model="datos.orden_de_compra" :items="ordenesDeCompra"
                label="N.° de la orden de compra" :hint="ordenesDeCompra.length ? 'Las de sus órdenes, o escríbela' : ''"
                v-bind="CAMPO" />

    <template v-else-if="clave === 'guias'">
      <div class="text-caption text-medium-emphasis">Guías aceptadas del cliente</div>
      <v-progress-linear v-if="cargando" indeterminate color="primary" />
      <v-checkbox v-for="guia in guias" :key="guia.id" v-model="datos.guias" :value="guia.numero" density="compact"
                  hide-details :label="`${guia.numero} · ${fechaCorta(guia.fecha_emision)}`" />
      <div v-if="!cargando && !guias.length" class="text-body-2 text-medium-emphasis">
        {{ clienteId ? 'El cliente no tiene guías aceptadas.' : 'Elige primero el cliente.' }}
      </div>
    </template>

    <v-textarea v-else v-model="datos.observaciones" label="Observaciones" rows="3" auto-grow v-bind="CAMPO" />
  </detail-panel>
</template>

<script setup>
// Las opciones de la factura que se abren a la derecha: detraccion, moneda, orden de compra, guias y observaciones.
import { onMounted, ref } from 'vue'
import DetailPanel from '@/components/shared/DetailPanel.vue'
import BillingDataService from '@/services/billing/billingDataService'
import { ACEPTADA } from '@/utils/billing/sunat'
import { fechaCorta } from '@/utils/dates'
import { CAMPO } from '@/utils/fields'
import { MONEDAS } from '@/utils/money'
import CardInvoiceSummary from './CardInvoiceSummary.vue'

const props = defineProps({
  clave: { type: String, required: true },
  datos: { type: Object, required: true },
  cuenta: { type: Object, required: true },
  codigos: { type: Array, default: () => [] },
  cuentaDeDetracciones: { type: String, default: '' },
  clienteId: { type: [Number, String], default: null },
  ordenesDeCompra: { type: Array, default: () => [] },
})
const emit = defineEmits(['cerrar'])

const TITULOS = { detraccion: 'Detracción', moneda: 'Moneda y tipo de cambio', orden_de_compra: 'Orden de compra',
                  guias: 'Guías de remisión', observaciones: 'Observaciones' }
const nombreDelCodigo = (c) => `(${c.codigo}) ${c.nombre} · ${Number(c.porcentaje)} %`

const guias = ref([])
const cargando = ref(false)
onMounted(async () => {
  if (props.clave !== 'guias' || !props.clienteId) return
  cargando.value = true
  try {
    const { data } = await BillingDataService.listDispatchGuides({ cliente: props.clienteId, estado: ACEPTADA, page_size: 50 })
    guias.value = data.results
  } catch {
    guias.value = []
  } finally {
    cargando.value = false
  }
})
</script>
