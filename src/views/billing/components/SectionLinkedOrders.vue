<template>
  <section class="seccion">
    <div class="titulo-de-seccion">{{ titulo }}</div>
    <div v-if="modelValue.length" class="d-flex flex-wrap ga-2">
      <v-chip v-for="orden in modelValue" :key="orden.id" size="small" prepend-icon="mdi-clipboard-text" closable
              :close-label="`Quitar ${orden.numero}`" @click:close="quitar(orden)">
        {{ orden.numero }}
      </v-chip>
    </div>
    <paginated-autocomplete v-if="clienteId" :key="buscador" :model-value="null" :fetch="buscar" :mapper="aOpcion"
                            :exclude-ids="modelValue.map(o => o.id)" label="Agregar orden"
                            prepend-inner-icon="mdi-plus" v-bind="CAMPO" @update:model-value="agregar" />
    <div v-else class="text-caption text-medium-emphasis">Elige primero el cliente para agregar sus órdenes.</div>
  </section>
</template>

<script setup>
// Las ordenes de las que sale el comprobante: se quitan con su "x" y se suman del mismo cliente.
import { ref } from 'vue'
import PaginatedAutocomplete from '@/components/commonComponents/PaginatedAutocomplete.vue'
import OrderDataService from '@/services/orders/orderDataService'
import { CAMPO } from '@/utils/fields'

const props = defineProps({
  // [{ id, numero }]
  modelValue: { type: Array, required: true },
  clienteId: { type: [Number, String], default: null },
  // La factura solo junta ordenes de un tipo; la guia, de cualquiera.
  tipoDeOrden: { type: Number, default: null },
  titulo: { type: String, default: 'Órdenes' },
})
const emit = defineEmits(['update:modelValue'])

const buscador = ref(0)
const aOpcion = (orden) => ({ id: orden.id, name: orden.order_number })
const buscar = (pagina, cantidad, texto) => OrderDataService.getFiltered(
  pagina, cantidad, props.clienteId, texto, '', '', '', '', props.tipoDeOrden)

function agregar (orden) {
  if (!orden) return
  emit('update:modelValue', [...props.modelValue, { id: orden.id, numero: orden.name }])
  buscador.value++
}
const quitar = (orden) => emit('update:modelValue', props.modelValue.filter(o => o !== orden))
</script>
