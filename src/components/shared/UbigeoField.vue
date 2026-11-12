<template>
  <v-autocomplete :model-value="modelValue" :items="opciones" item-title="nombre" item-value="codigo"
                  :loading="buscando" :label="label" no-filter hide-no-data density="compact" variant="outlined"
                  hide-details="auto" prepend-inner-icon="mdi-map-marker-outline" placeholder="Distrito o código"
                  @update:search="buscar" @update:model-value="emit('update:modelValue', $event)">
    <template #item="{ props: fila, item }">
      <v-list-item v-bind="fila" :subtitle="item.raw.codigo" />
    </template>
  </v-autocomplete>
</template>

<script setup>
import { ref, watch } from 'vue'
import BillingDataService from '@/services/billing/billingDataService'
import { debounce } from '@/utils/debounce'

// El distrito (ubigeo del INEI) que SUNAT pide en la partida y la llegada; busca por nombre o codigo.
const props = defineProps({
  modelValue: { type: String, default: '' },
  label: { type: String, default: 'Ubigeo' },
})
const emit = defineEmits(['update:modelValue'])

const LETRAS_PARA_BUSCAR = 2
const opciones = ref([])
const buscando = ref(false)

async function traer (texto) {
  buscando.value = true
  try {
    const { data } = await BillingDataService.listUbigeos(texto)
    opciones.value = data
  } catch {
    opciones.value = []
  } finally {
    buscando.value = false
  }
}

const buscar = debounce((texto) => {
  const elegido = opciones.value.find(o => o.codigo === props.modelValue)
  if (texto && texto.length >= LETRAS_PARA_BUSCAR && texto !== elegido?.nombre) traer(texto)
})

// El que viene puesto se busca por su codigo, para mostrar su nombre.
watch(() => props.modelValue, (codigo) => {
  if (codigo && !opciones.value.some(o => o.codigo === codigo)) traer(codigo)
}, { immediate: true })
</script>
