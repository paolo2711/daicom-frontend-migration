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
          <v-text-field v-model="temp_rental.departure_date" label="Fecha Salida*" type="date" variant="outlined" density="compact" hide-details />
        </v-col>

        <v-col cols="12" md="3">
          <v-text-field v-model="temp_rental.expected_return_date" label="Retorno Pactado" type="date" variant="outlined" density="compact" hide-details />
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
                 :disabled="!temp_rental.equipment || !temp_rental.departure_date">
            <template #prepend><v-icon size="small">mdi-plus</v-icon></template>
            Añadir
          </v-btn>
        </v-col>
      </v-row>
    </v-card>

    <v-table density="compact" class="mt-4 border rounded" v-if="rentals.length > 0">
      <thead>
        <tr :class="isDark ? 'bg-grey-darken-3' : 'bg-amber-lighten-4'">
          <th style="width: 130px;">ID Inventario</th>
          <th>Equipo</th>
          <th>Serie</th>
          <th class="text-center">Salida</th>
          <th class="text-center">Retorno</th>
          <th class="text-right">Acción</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(item, index) in rentals" :key="index">
          <td><strong>{{ item.internal_id }}</strong></td>
          <td>{{ item.name }}</td>
          <td>{{ item.series || '---' }}</td>
          <td class="text-center">{{ item.departure_date }}</td>
          <td class="text-center font-weight-medium" :class="!item.expected_return_date ? 'text-grey' : ''">
            {{ item.expected_return_date || 'Sin fecha' }}
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
import { ref, computed, watch, onMounted, getCurrentInstance, defineAsyncComponent } from 'vue'
import { useTheme } from 'vuetify'
import InventoryDataService from '@/services/inventory/inventoryDataService'
import PaginatedAutocomplete from '@/components/commonComponents/PaginatedAutocomplete.vue'

const AddEquipment = defineAsyncComponent(() => import('@/views/inventory/components/AddEquipment.vue'))
const addEquipmentModalRef = ref(null)

const emit = defineEmits(['update-list'])

const { appContext } = getCurrentInstance()
const $swal = appContext.config.globalProperties.$swal
const theme = useTheme()
const isDark = computed(() => theme.global.current.value.dark)

const temp_rental = ref({
  equipment:            null,
  departure_date:       new Date().toISOString().substring(0, 10),
  expected_return_date: '',
  delivery_notes:       '',
})
const rentals        = ref([])

watch(rentals, (val) => { emit('update-list', val) }, { deep: true })

// combobox (equipos disponibles, por id/nombre/…).
// (traer 10, buscar al teclear, aviso "hay mas", preservar seleccion) lo
const fetchEquipos = (page, size, query) =>
  InventoryDataService.getAll({ status: 1, search: query || '', page, page_size: size })
const equipComboRef = ref(null)   // recargar la lista tras crear un equipo nuevo

function addRentalToBatch() {
  if (!temp_rental.value.equipment) return
  if (temp_rental.value.expected_return_date && temp_rental.value.expected_return_date < temp_rental.value.departure_date) {
    $swal.fire('Error de fechas', 'El retorno no puede ser antes de la salida', 'warning')
    return
  }
  
  rentals.value.push({
    equipment_id:          temp_rental.value.equipment.id,
    internal_id:           temp_rental.value.equipment.internal_id,
    name:                  temp_rental.value.equipment.name,
    series:                temp_rental.value.equipment.series,
    departure_date:        temp_rental.value.departure_date,
    expected_return_date:  temp_rental.value.expected_return_date || null,
    delivery_notes:        temp_rental.value.delivery_notes,
  })
  
  temp_rental.value.equipment       = null   // limpia la selección del combobox
  temp_rental.value.delivery_notes  = ''
  temp_rental.value.expected_return_date = ''
}
</script>