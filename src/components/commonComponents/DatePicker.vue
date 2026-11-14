<template>
  <v-menu v-model="open_menu" :close-on-content-click="false" transition="scale-transition" offset-y min-width="auto">
    <template v-slot:activator="{ props }">
      <v-text-field
        :model-value="fechaCorta(picked_date)"
        :label="label"
        density="compact"
        prepend-inner-icon="mdi-calendar"
        readonly
        variant="outlined"
        hide-details="auto"
        v-bind="{ ...campo, ...props }"
      />
    </template>
    <v-date-picker :model-value="dateObj" :min="min" :max="max" @update:model-value="onDateChange" />
  </v-menu>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { fechaCorta, fechaISO } from '@/utils/dates'

const props = defineProps({
  date: String,
  label: String,
  // 'YYYY-MM-DD': los dias anteriores a `min` y posteriores a `max` no se pueden elegir.
  min: String,
  max: String,
  // Props de mas para el campo, como el redondeado de las pantallas de trabajo.
  campo: { type: Object, default: () => ({}) },
})

const emit = defineEmits(['setPickedDate'])

const open_menu = ref(false)
const picked_date = ref(props.date)

const dateObj = computed(() => picked_date.value ? new Date(picked_date.value.replace(/-/g, '/')) : null)

watch(() => props.date, (val) => {
  picked_date.value = val
})

const onDateChange = (val) => {
  if (val instanceof Date) {
    const formatted = fechaISO(val)
    picked_date.value = formatted
    emit('setPickedDate', formatted)
    open_menu.value = false
  }
}
</script>