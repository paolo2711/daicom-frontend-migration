<template>
  <v-menu v-model="abierto" :close-on-content-click="false" location="bottom">
    <template v-slot:activator="{ props }">
      <v-text-field
        v-bind="props"
        :model-value="texto"
        :label="label"
        :clearable="clearable"
        prepend-inner-icon="mdi-calendar-range"
        variant="outlined"
        density="compact"
        readonly
        hide-details="auto"
        class="cursor-pointer"
        @click:clear="$emit('clear')"
      />
    </template>

    <v-card class="pa-4 elevation-4 border rounded-lg" min-width="320">
      <div class="text-caption font-weight-bold text-medium-emphasis mb-3">Seleccione el periodo:</div>
      <v-row dense>
        <v-col cols="12" sm="6">
          <date-picker :date="desde" label="Desde:" @setPickedDate="(v) => $emit('update:desde', v)" />
        </v-col>
        <v-col cols="12" sm="6">
          <date-picker :date="hasta" label="Hasta:" @setPickedDate="(v) => $emit('update:hasta', v)" />
        </v-col>
      </v-row>
      <div class="d-flex justify-end mt-4">
        <v-btn color="primary" variant="tonal" size="small" class="font-weight-bold" @click="aplicar">Aplicar</v-btn>
      </div>
    </v-card>
  </v-menu>
</template>

<script setup>
// Rango de fechas de los filtros. El menu, el texto del campo y el boton
// Aplicar estaban repetidos en Certificados, Ordenes y Alquileres, con el mismo
// computed de "Cualquier fecha / Desde el X / Hasta el X / X al Y" escrito tres
// veces con distintos nombres de variable.
import { ref, computed } from 'vue'
import DatePicker from '@/components/commonComponents/DatePicker.vue'

const props = defineProps({
  desde: { type: String, default: '' },
  hasta: { type: String, default: '' },
  label: { type: String, default: 'Rango de Fechas' },
  clearable: { type: Boolean, default: false },
})

const emit = defineEmits(['update:desde', 'update:hasta', 'apply', 'clear'])

const abierto = ref(false)

const texto = computed(() => {
  if (!props.desde && !props.hasta) return 'Cualquier fecha'
  if (props.desde && !props.hasta) return `Desde el ${props.desde}`
  if (!props.desde && props.hasta) return `Hasta el ${props.hasta}`
  return `${props.desde} al ${props.hasta}`
})

// El menu se cierra solo: quien lo usa se ocupa nada mas de recargar su tabla.
const aplicar = () => {
  abierto.value = false
  emit('apply')
}
</script>
