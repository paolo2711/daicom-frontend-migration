<template>
  <detail-panel titulo="Condición de pago" @cerrar="emit('cerrar')">
    <card-invoice-summary :cuenta="cuenta" :moneda="datos.moneda" />

    <segmented-field v-model="datos.forma_de_pago" :opciones="FORMAS_DE_PAGO" />

    <section v-if="datos.forma_de_pago === 'credito'" class="seccion">
      <div class="titulo-de-seccion">Cuotas</div>
      <v-row v-for="(cuota, i) in datos.cuotas" :key="i" dense align="center" class="mb-1">
        <v-col cols="6">
          <date-picker :date="cuota.fecha" :label="`Cuota ${i + 1} · vence`" :min="datos.fecha"
                       @setPickedDate="f => (cuota.fecha = f)" />
        </v-col>
        <v-col>
          <v-text-field v-model="cuota.monto" type="number" min="0" :prefix="simboloDe(datos.moneda)" label="Monto"
                        v-bind="CAMPO" />
        </v-col>
        <v-col cols="auto">
          <v-btn icon="mdi-close" variant="text" size="x-small" title="Quitar la cuota" @click="datos.cuotas.splice(i, 1)" />
        </v-col>
      </v-row>
      <div class="text-caption text-medium-emphasis mb-1">Agregar cuota a</div>
      <div class="d-flex flex-wrap ga-2">
        <v-chip v-for="dias in PLAZOS" :key="dias" size="small" variant="outlined" @click="agregar(dias)">
          {{ dias }} días
        </v-chip>
      </div>
      <div class="d-flex justify-space-between text-body-2 border-t-thin mt-3 pt-2">
        <span>Falta asignar</span>
        <span class="font-weight-bold" :class="{ 'text-error': Number(cuenta.cuotas.falta) !== 0 }">
          {{ monto(cuenta.cuotas.falta, datos.moneda) }}
        </span>
      </div>
    </section>
  </detail-panel>
</template>

<script setup>
// Contado o credito; las cuotas se agregan a un plazo desde la emision con lo que falta asignar.
import DatePicker from '@/components/commonComponents/DatePicker.vue'
import DetailPanel from '@/components/shared/DetailPanel.vue'
import SegmentedField from '@/components/shared/SegmentedField.vue'
import { CAMPO } from '@/utils/fields'
import { monto, simboloDe } from '@/utils/money'
import CardInvoiceSummary from './CardInvoiceSummary.vue'

const props = defineProps({
  datos: { type: Object, required: true },
  cuenta: { type: Object, required: true },
})
const emit = defineEmits(['cerrar'])

const PLAZOS = [7, 15, 30, 60, 90]
const FORMAS_DE_PAGO = [{ valor: 'contado', texto: 'Contado' }, { valor: 'credito', texto: 'Crédito' }]

function agregar (dias) {
  const vence = new Date(`${props.datos.fecha}T12:00:00`)
  vence.setDate(vence.getDate() + dias)
  props.datos.cuotas.push({ monto: Math.max(Number(props.cuenta.cuotas.falta) || 0, 0), fecha: vence.toISOString().slice(0, 10) })
}
</script>
