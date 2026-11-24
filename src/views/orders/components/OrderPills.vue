<template>
  <filter-pill v-for="p in PILDORAS" :key="p.valor" :active="modelValue === p.valor" :count="cuentas[p.valor]"
               :color="p.color" :icon="p.icono" :tooltip="p.detalle"
               @click="emit('update:modelValue', modelValue === p.valor ? null : p.valor)">
    {{ p.texto }}
  </filter-pill>
</template>

<script setup>
import FilterPill from '@/components/shared/FilterPill.vue'

// Las pildoras de cobro de las dos pestañas de Órdenes, una prendida a la vez. `valor` es el filtro del back.
defineProps({
  modelValue: { type: String, default: null },
  cuentas: { type: Object, required: true },
})
const emit = defineEmits(['update:modelValue'])

const PILDORAS = [
  { valor: 'missing_payment', texto: 'Falta Pago', color: 'error', icono: 'mdi-cash-remove',
    detalle: 'Con algo por cobrar' },
  { valor: 'a_credito', texto: 'A Crédito', color: 'teal', icono: 'mdi-calendar-clock',
    detalle: 'A crédito que aún no vence' },
  { valor: 'missing_invoice', texto: 'Sin Emitir Factura', color: 'warning', icono: 'mdi-file-document-remove-outline',
    detalle: 'Abiertas pendientes de facturar' },
]
</script>
