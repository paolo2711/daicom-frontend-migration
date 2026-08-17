<template>
  <v-autocomplete
    :model-value="modelValue"
    @update:model-value="onSelect"
    v-model:search="search"
    :items="visibleItems"
    :loading="loading"
    :label="label"
    :placeholder="placeholder"
    :item-title="itemTitle"
    :item-value="itemValue"
    :return-object="returnObject"
    no-filter
  >
    <!-- Reenvia al padre solo los slots que si definio (selection / item). -->
    <template v-if="$slots.selection" v-slot:selection="s"><slot name="selection" v-bind="s" /></template>
    <template v-if="$slots.item" v-slot:item="s"><slot name="item" v-bind="s" /></template>

    <!-- Aviso GENERICO reutilizable: hay mas resultados de los mostrados. -->
    <template v-if="hayMas" v-slot:append-item>
      <div class="px-4 py-2 text-caption text-medium-emphasis">
        <v-icon size="14" class="mr-1">mdi-magnify</v-icon>
        Hay más resultados — escribe para afinar la búsqueda.
      </div>
    </template>
  </v-autocomplete>
</template>

<script setup>
// Combobox con busqueda server-side paginada. El comportamiento (traer 10, buscar
// al teclear, aviso de "hay mas", preservar el seleccionado) esta definido aca una
// sola vez. Cada combobox solo pasa su fetch, su label y sus slots si los necesita.
import { computed, onMounted } from 'vue'
import { usePaginatedSearch } from '@/composables/usePaginatedSearch'

const props = defineProps({
  modelValue: { default: null },
  // (page, size, query) => Promise -> tu servicio paginado que ya busca en el back.
  fetch: { type: Function, required: true },
  mapper: { type: Function, default: (x) => x },
  label: { type: String, default: '' },
  placeholder: { type: String, default: '' },
  itemTitle: { type: String, default: 'name' },
  itemValue: { type: String, default: 'id' },
  returnObject: { type: Boolean, default: true },
  excludeIds: { type: Array, default: () => [] },   // ids a ocultar (ej. ya agregados)
  seed: { default: null },   // item ya seleccionado (para que se muestre al editar, sin buscar)
})
// 'selected' emite el OBJETO elegido (util si el padre necesita otros campos, ej.
// el nombre) sin tener que leer toda la lista.
const emit = defineEmits(['update:modelValue', 'selected'])

const selectedId = () => props.returnObject
  ? (props.modelValue?.[props.itemValue] ?? null)
  : (props.modelValue ?? null)

const { items, loading, searchQuery: search, retrieveData, total } =
  usePaginatedSearch((page, size, q) => props.fetch(page, size, q), props.mapper, selectedId)

const visibleItems = computed(() => {
  const base = items.value.filter(it => !props.excludeIds.includes(it[props.itemValue]))
  // Si hay un `seed` (item ya seleccionado, ej. al editar) y no vino en la tanda,
  // lo anteponemos para que se muestre sin necesidad de buscarlo.
  if (props.seed && !base.some(it => it[props.itemValue] === props.seed[props.itemValue])) {
    return [props.seed, ...base]
  }
  return base
})
const hayMas = computed(() => total.value > items.value.length)

function onSelect(v) {
  emit('update:modelValue', v)
  const obj = props.returnObject ? v : items.value.find(it => it[props.itemValue] === v)
  emit('selected', obj ?? null)
}

onMounted(() => retrieveData(''))

// El padre puede forzar recargar la lista (ej. tras crear un item en un modal).
defineExpose({ reload: () => retrieveData('') })
</script>
