<template>
  <div class="border rounded-lg pa-3 text-body-2">
    <div class="d-flex justify-space-between"><span class="text-medium-emphasis">Total</span>
      <span class="font-weight-bold">{{ monto(cuenta.total, moneda) }}</span></div>
    <div class="d-flex justify-space-between">
      <span class="text-medium-emphasis">
        Detracción{{ cuenta.detraccion.aplica ? ` ${Number(cuenta.detraccion.porcentaje)} %` : '' }}
      </span>
      <span v-if="!cuenta.detraccion.aplica" class="text-medium-emphasis">No aplica</span>
      <span v-else class="font-weight-bold text-right">
        <template v-if="cuenta.detraccion.en_soles != null">{{ monto(cuenta.detraccion.en_soles, 'PEN') }}</template>
        <template v-if="moneda !== 'PEN'"> ({{ monto(cuenta.detraccion.monto, moneda) }})</template>
      </span>
    </div>
    <div class="d-flex justify-space-between border-t-thin mt-1 pt-1">
      <span class="font-weight-bold">Neto por cobrar</span>
      <span class="font-weight-bold">{{ monto(cuenta.por_cobrar, moneda) }}</span>
    </div>
  </div>
</template>

<script setup>
// La cuenta del cobro que hace el back: total, detraccion (en soles, como va a SUNAT) y neto por cobrar.
import { monto } from '@/utils/money'

defineProps({
  cuenta: { type: Object, required: true },
  moneda: { type: String, default: 'PEN' },
})
</script>
