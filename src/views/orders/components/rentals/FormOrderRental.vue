<template>
  <div>
    <v-card variant="flat" class="border pa-4 rounded-lg" :color="isDark ? '#1E1E1E' : 'amber-lighten-5'">
      <div class="d-flex align-center mb-3">
        <div class="text-subtitle-1 font-weight-bold" :class="isDark ? 'text-amber-lighten-2' : 'text-amber-darken-4'">
          <v-icon size="small" color="amber-darken-3" class="mr-1">mdi-truck-delivery</v-icon>
          Seleccionar Equipo para Alquiler
        </div>
      </div>

      <v-row dense align="center">
        <v-col cols="12" md="6" class="d-flex align-center">
          <paginated-autocomplete
            ref="equipComboRef"
            v-model="temp_rental.equipment"
            :fetch="fetchEquipos"
            :exclude-ids="rentals.map(r => r.equipment_id)"
            label="Buscar Equipo* (ID, Nombre, Marca o Serie)"
            placeholder="Ej: DAI-017, Manómetro o N° serie"
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
          </paginated-autocomplete>
          
          <v-btn icon size="small" color="primary" variant="tonal" class="ml-2 flex-shrink-0" @click="addEquipmentModalRef?.open()">
            <v-icon>mdi-plus</v-icon>
          </v-btn>
        </v-col>

        <v-col cols="12" md="3">
          <v-text-field v-model="temp_rental.departure_date" :label="FECHAS_ALQUILER.departure_date" type="date"
                        :max="hoy" variant="outlined" density="compact" hide-details clearable />
        </v-col>

        <v-col cols="12" md="3">
          <v-text-field v-model="temp_rental.expected_return_date" :label="FECHAS_ALQUILER.expected_return_date" type="date"
                        :min="temp_rental.departure_date || undefined"
                        variant="outlined" density="compact" hide-details clearable />
        </v-col>
      </v-row>

      <v-row dense>
        <v-col cols="12" md="9">
          <v-text-field v-model="temp_rental.delivery_notes" label="Observaciones de entrega (Opcional)"
                        variant="outlined" density="compact" hide-details
                        placeholder="Ej: Se entrega con estuche y manual" />
        </v-col>
        <v-col cols="12" md="3" class="text-right">
          <v-btn color="amber-darken-3" class="text-white" variant="flat" block
                 @click="addRentalToBatch"
                 :disabled="!temp_rental.equipment">
            <template #prepend><v-icon size="small">mdi-plus</v-icon></template>
            Añadir
          </v-btn>
        </v-col>
      </v-row>

      <div class="text-caption text-medium-emphasis mt-2">
        Si el equipo todavía no sale, deja «{{ FECHAS_ALQUILER.departure_date }}» vacío: queda reservado y la
        salida se registra cuando salga.
      </div>
    </v-card>

    <v-table density="compact" class="mt-4 tabla-mejorada" v-if="rentals.length > 0">
      <thead>
        <tr :class="isDark ? 'bg-grey-darken-3' : 'bg-amber-lighten-4'">
          <th style="width: 130px;">ID Inventario</th>
          <th>Equipo</th>
          <th>Serie</th>
          <th class="text-center">{{ FECHAS_ALQUILER.departure_date }}</th>
          <th class="text-center">{{ FECHAS_ALQUILER.expected_return_date }}</th>
          <th class="text-right">Acción</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(item, index) in rentals" :key="index" :class="{ 'fila-con-error': errores[index] }">
          <td><strong>{{ item.internal_id }}</strong></td>
          <td>
            {{ item.name }}
            <div v-if="errores[index]" class="text-caption text-error">{{ errores[index] }}</div>
          </td>
          <td>{{ item.series || '—' }}</td>
          <td class="text-center" :class="{ 'text-medium-emphasis': !item.departure_date }">
            {{ salidaDe(item) }}
          </td>
          <td class="text-center" :class="{ 'text-medium-emphasis': !item.expected_return_date }">
            {{ fechaCorta(item.expected_return_date) || '—' }}
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
import { useRowErrors } from '@/composables/useRowErrors'
import { fechaCorta, hoyISO } from '@/utils/dates'
import { FECHAS_ALQUILER, salidaDe } from '@/utils/orders/alquiler'

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
  if (salida && salida > hoy) return 'La salida no puede ser a futuro: déjala vacía y regístrala cuando salga.'
  if (salida && pactado && pactado < salida) return 'La devolución pactada no puede ser antes de la salida.'
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