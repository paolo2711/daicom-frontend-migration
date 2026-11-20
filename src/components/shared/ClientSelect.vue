<template>
  <paginated-autocomplete
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    @selected="$emit('selected', $event)"
    lista="clientes"
    :return-object="false"
    :seed="seed"
    :label="label"
    :no-data-text="noDataText"
    placeholder="Buscar cliente..."
    prepend-inner-icon="mdi-account-group"
    density="compact"
    variant="outlined"
    hide-details="auto"
    clearable
  >
    <template v-slot:item="{ props, item }">
      <v-list-item v-bind="props">
        <v-list-item-subtitle class="text-caption">{{ documento(item.raw) }}</v-list-item-subtitle>
      </v-list-item>
    </template>
  </paginated-autocomplete>
</template>

<script setup>
// Desplegable para elegir un cliente que ya esta en la base, con su documento para distinguir nombres parecidos.
// Traerlo de SUNAT/RENIEC o darlo de alta a mano es ClientLookupBar, que usa este por dentro.
import PaginatedAutocomplete from '@/components/commonComponents/PaginatedAutocomplete.vue'

defineProps({
  modelValue: { type: [Number, String], default: null },
  label: { type: String, default: 'Cliente' },
  noDataText: { type: String, default: 'No se encontraron clientes' },
  // Cliente ya elegido, para mostrarlo sin tener que buscarlo de nuevo.
  seed: { type: Object, default: null },
})

defineEmits(['update:modelValue', 'selected'])

const documento = (cliente) => cliente.document
  ? `${cliente.documentType_name}: ${cliente.document}`
  : 'Sin documento'
</script>
