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
          <v-autocomplete
            v-model="temp_rental.equipment"
            :items="inventory_items"
            :loading="loading_items"
            v-model:search="search_item"
            item-title="name"
            item-value="id"
            variant="outlined"
            density="compact"
            hide-details
            label="Buscar Equipo* (Nombre, ID o Serie)"
            placeholder="Ej: INV-PR-001 o Manómetro"
            return-object
          >
            <template v-slot:selection="{ item }">
              <strong>{{ item.raw.internal_id }}</strong>&nbsp;-&nbsp;{{ item.raw.name }}&nbsp;(Serie: {{ item.raw.series || 'N/A' }})
            </template>
            <template v-slot:item="{ item, props }">
              <v-list-item v-bind="props" :title="null">
                <v-list-item-title><strong>{{ item.raw.name }}</strong> - Serie: {{ item.raw.series || 'N/A' }} </v-list-item-title>
                <v-list-item-subtitle>{{ item.raw.brand }} | ID: {{ item.raw.internal_id }}</v-list-item-subtitle>
              </v-list-item>
            </template>
          </v-autocomplete>
          
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
  <add-equipment ref="addEquipmentModalRef" @saved="fetchInitialInventory" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, getCurrentInstance, defineAsyncComponent } from 'vue'
import { useTheme } from 'vuetify'
import InventoryDataService from '@/services/inventory/inventoryDataService'

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

const all_inventory_items = ref([])
const loading_items  = ref(false)
const search_item    = ref(null)

watch(rentals, (val) => { emit('update-list', val) }, { deep: true })

const inventory_items = computed(() => {
  const query = (search_item.value || '').toLowerCase()
  
  return all_inventory_items.value.filter(item => {
    const isAlreadyAdded = rentals.value.some(r => r.equipment_id === item.id)
    if (isAlreadyAdded) return false

    if (!query) return true

    const safeName       = item.name ? item.name.toLowerCase() : ''
    const safeInternalId = item.internal_id ? item.internal_id.toLowerCase() : ''
    const safeSeries     = item.series ? item.series.toLowerCase() : ''
    
    return safeName.includes(query) || safeInternalId.includes(query) || safeSeries.includes(query)
  })
})

onMounted(() => {
  fetchInitialInventory()
})

async function fetchInitialInventory() {
  loading_items.value = true
  try {
    const response = await InventoryDataService.getAll()
    const all_items = response.data.results ? response.data.results : response.data
    all_inventory_items.value = all_items.filter(item => item.status === 1)
  } catch (error) {
    console.error('Error cargando inventario', error)
  } finally {
    loading_items.value = false
  }
}

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
  
  temp_rental.value.equipment       = null
  temp_rental.value.delivery_notes  = ''
  temp_rental.value.expected_return_date = ''
  search_item.value                 = ''
}
</script>