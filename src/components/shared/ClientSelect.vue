<template>
  <paginated-autocomplete
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    @selected="$emit('selected', $event)"
    :fetch="fetchClientes"
    :mapper="ClientMappers.getMap"
    recurso="clientes"
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
// Desplegable para elegir un cliente que ya esta en la base. Si ademas hace
// falta traerlo de SUNAT/RENIEC o darlo de alta a mano, eso es ClientLookupBar,
// que usa este por dentro.
//
// Estaba escrito de cinco formas distintas y en cuatro de ellas no se veia el
// documento, asi que dos clientes con nombre parecido eran indistinguibles.
import PaginatedAutocomplete from '@/components/commonComponents/PaginatedAutocomplete.vue'
import ClientDataService from '@/services/clients/clientDataService'
import ClientMappers from '@/mappers/clientMappers'

defineProps({
  modelValue: { type: [Number, String], default: null },
  label: { type: String, default: 'Cliente' },
  noDataText: { type: String, default: 'No se encontraron clientes' },
  // Cliente ya elegido, para mostrarlo sin tener que buscarlo de nuevo.
  seed: { type: Object, default: null },
})

defineEmits(['update:modelValue', 'selected'])

const fetchClientes = (page, size, query) => ClientDataService.getFiltered(page, size, query)

// Los que no tienen documento decian "SIN DOCUMENTO: ---", que no aporta nada.
const documento = (cliente) => cliente.document
  ? `${cliente.documentType_name}: ${cliente.document}`
  : 'Sin documento'
</script>
