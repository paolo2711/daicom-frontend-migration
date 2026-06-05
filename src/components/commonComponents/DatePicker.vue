<template>
  <v-menu v-model="open_menu" :close-on-content-click="false" transition="scale-transition" offset-y min-width="auto">
    <template v-slot:activator="{ props }">
      <v-text-field
        v-model="picked_date"
        :label="label"
        density="compact"
        prepend-inner-icon="mdi-calendar"
        readonly
        v-bind="props"
        variant="outlined"
        hide-details="auto"
      />
    </template>
    <v-date-picker v-model="dateObj" @update:model-value="onDateChange" />
  </v-menu>
</template>

<script setup>
import { ref, watch, computed } from 'vue'

const props = defineProps({
  date: String,
  label: String
})

const emit = defineEmits(['setPickedDate'])

const open_menu = ref(false)
const picked_date = ref(props.date)

const dateObj = computed({
  get: () => picked_date.value ? new Date(picked_date.value.replace(/-/g, '/')) : null,
  set: (val) => {}
})

watch(() => props.date, (val) => {
  picked_date.value = val
})

const onDateChange = (val) => {
  if (val instanceof Date) {
    const formatted = val.toISOString().substr(0, 10)
    picked_date.value = formatted
    emit('setPickedDate', formatted)
    open_menu.value = false
  }
}
</script>