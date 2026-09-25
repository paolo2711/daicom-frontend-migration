<template>
  <div>
    <v-card variant="flat" class="border pa-4 rounded-lg" :color="isDark ? '#1E1E1E' : 'grey-lighten-4'">
      <div class="d-flex align-center mb-3">
        <div class="text-subtitle-1 font-weight-bold" :class="isDark ? 'text-amber-lighten-2' : 'text-amber-darken-4'">
          <v-icon size="small" color="amber-darken-3" class="mr-1">mdi-truck-delivery</v-icon>
          Seleccionar Equipo para Alquiler
        </div>
      </div>

      <v-row dense>
        <v-col cols="12">
          <paginated-autocomplete
            ref="equipComboRef"
            v-model="temp_rental.equipment"
            :fetch="fetchEquipos"
            :exclude-ids="rentals.map(r => r.equipment_id)"
            label="Equipo (ID, nombre, marca o serie)"
            placeholder="Ej: DAI-017, Manómetro o N° serie"
            prepend-inner-icon="mdi-toolbox-outline"
            variant="outlined"
            density="compact"
            hide-details
          >
            <template #selection="{ item }">
              <strong>{{ item.raw.internal_id }}</strong>&nbsp;-&nbsp;{{ item.raw.name }}&nbsp;(Serie: {{ item.raw.series || 'N/A' }})
            </template>
            <template #item="{ item, props }">
              <v-list-item v-bind="props" :title="null">
                <v-list-item-title><strong>{{ item.raw.name }}</strong> - Serie: {{ item.raw.series || 'N/A' }} </v-list-item-title>
                <v-list-item-subtitle>{{ item.raw.brand }} | ID: {{ item.raw.internal_id }}</v-list-item-subtitle>
              </v-list-item>
            </template>
            <template #append>
              <add-new-button texto="Nuevo equipo en el inventario" @click="addEquipmentModalRef?.open()" />
            </template>
          </paginated-autocomplete>
        </v-col>

        <v-col cols="12" md="6">
          <v-text-field v-model="temp_rental.departure_date" :label="FECHAS_ALQUILER.departure_date" type="date"
                        :max="hoy" variant="outlined" density="compact" hide-details clearable />
        </v-col>

        <v-col cols="12" md="6">
          <v-text-field v-model="temp_rental.expected_return_date" :label="FECHAS_ALQUILER.expected_return_date" type="date"
                        :min="temp_rental.departure_date || undefined"
                        variant="outlined" density="compact" hide-details clearable />
        </v-col>

        <v-col cols="12">
          <v-text-field v-model="temp_rental.delivery_notes" label="Observaciones de entrega (Opcional)"
                        variant="outlined" density="compact" hide-details
                        placeholder="Ej: Se entrega con estuche y manual" />
        </v-col>
      </v-row>

      <div class="d-flex align-center ga-4 mt-3">
        <div class="text-caption text-medium-emphasis">
          Si el equipo todavía no sale, deja «{{ FECHAS_ALQUILER.departure_date }}» vacío: queda reservado y la
          salida se registra cuando salga.
        </div>
        <v-spacer />
        <v-btn color="amber-darken-3" class="text-white flex-shrink-0" variant="flat" prepend-icon="mdi-plus"
               @click="addRentalToBatch" :disabled="!temp_rental.equipment">
          Añadir
        </v-btn>
      </div>
    </v-card>

    <v-table density="compact" class="mt-4 tabla-mejorada" v-if="rentals.length > 0">
      <thead>
        <tr :class="isDark ? 'bg-grey-darken-3' : 'bg-grey-lighten-3'">
          <th style="width: 8rem;">ID Inventario</th>
          <th>Equipo</th>
          <th>Serie</th>
          <th style="width: 20%;">{{ FECHAS_ALQUILER.departure_date }}</th>
          <th style="width: 20%;">{{ FECHAS_ALQUILER.expected_return_date }}</th>
          <th class="text-right">Acción</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(item, index) in rentals" :key="index" :class="{ 'fila-con-error': errores[index] }">
          <td><strong>{{ item.internal_id }}</strong></td>
          <td>
            {{ item.name }}
            <v-text-field v-model="item.delivery_notes" placeholder="Sin observaciones" variant="plain"
                          density="compact" hide-details class="observaciones" />
            <div v-if="errores[index]" class="text-caption text-error">{{ errores[index] }}</div>
          </td>
          <td>{{ item.series || '—' }}</td>
          <td>
            <v-text-field v-model="item.departure_date" type="date" :max="hoy" :rules="[reglaNoFutura(hoy)]"
                          :hint="item.departure_date ? '' : salidaDe(item)" persistent-hint
                          variant="plain" density="compact" hide-details="auto" />
          </td>
          <td>
            <v-text-field v-model="item.expected_return_date" type="date" :min="item.departure_date || undefined"
                          :rules="[reglaNoAntesDe(item.departure_date)]"
                          variant="plain" density="compact" hide-details="auto" />
          </td>
          <td class="text-right">
            <v-btn icon size="x-small" variant="text" color="red" density="comfortable" @click="rentals.splice(index, 1)">
              <v-icon>mdi-delete</v-icon>
            </v-btn>
          </td>
        </tr>
      </tbody>
    </v-table>
  <add-equipment ref="addEquipmentModalRef" @saved="equipComboRef?.reload()" />
  </div>
</template>

<script setup>
import { ref, computed, watch, getCurrentInstance, defineAsyncComponent } from 'vue'
import { useTheme } from 'vuetify'
import InventoryDataService from '@/services/inventory/inventoryDataService'
import PaginatedAutocomplete from '@/components/commonComponents/PaginatedAutocomplete.vue'
import AddNewButton from '@/components/commonComponents/AddNewButton.vue'
import { useRowErrors } from '@/composables/useRowErrors'
import { hoyISO } from '@/utils/dates'
import { FECHAS_ALQUILER, reglaNoAntesDe, reglaNoFutura, salidaDe } from '@/utils/orders/alquiler'

const AddEquipment = defineAsyncComponent(() => import('@/views/inventory/components/AddEquipment.vue'))
const addEquipmentModalRef = ref(null)

const emit = defineEmits(['update-list'])

const { appContext } = getCurrentInstance()
const $swal = appContext.config.globalProperties.$swal
const theme = useTheme()
const isDark = computed(() => theme.global.current.value.dark)

const hoy = hoyISO()

const temp_rental = ref({
  equipment:            null,
  departure_date:       '',
  expected_return_date: '',
  delivery_notes:       '',
})
const rentals        = ref([])
const { errores, marcarErrores } = useRowErrors(rentals)

watch(rentals, (val) => { emit('update-list', val) }, { deep: true })

// Solo los disponibles; al guardar, el back lo vuelve a revisar.
const fetchEquipos = (page, size, query) =>
  InventoryDataService.getAll({ status: 1, search: query || '', page, page_size: size })
const equipComboRef = ref(null)   // recargar la lista tras crear un equipo nuevo

function problemaDeFechas({ departure_date: salida, expected_return_date: pactado }) {
  const salidaMal = reglaNoFutura(hoy)(salida)
  if (salidaMal !== true) return `${FECHAS_ALQUILER.departure_date}: ${salidaMal}. Si todavía no sale, déjala vacía.`
  const pactadoMal = reglaNoAntesDe(salida)(pactado)
  if (pactadoMal !== true) return `${FECHAS_ALQUILER.expected_return_date}: ${pactadoMal}.`
  return null
}

function addRentalToBatch() {
  if (!temp_rental.value.equipment) return
  const problema = problemaDeFechas(temp_rental.value)
  if (problema) {
    $swal.fire('Revisa las fechas', problema, 'warning')
    return
  }

  rentals.value.push({
    equipment_id:          temp_rental.value.equipment.id,
    internal_id:           temp_rental.value.equipment.internal_id,
    name:                  temp_rental.value.equipment.name,
    series:                temp_rental.value.equipment.series,
    departure_date:        temp_rental.value.departure_date || null,
    expected_return_date:  temp_rental.value.expected_return_date || null,
    delivery_notes:        temp_rental.value.delivery_notes,
  })
  
  temp_rental.value.equipment       = null   // limpia la selección del combobox
  temp_rental.value.delivery_notes  = ''
  temp_rental.value.expected_return_date = ''
}

defineExpose({ marcarErrores })
</script>

<style scoped>
.observaciones :deep(input) {
  font-size: 0.75rem;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  padding-top: 0;
}
</style>