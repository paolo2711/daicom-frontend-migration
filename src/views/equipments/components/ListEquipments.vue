<template>
  <v-container fluid class="down-top-padding pa-0">
    <v-card variant="flat" class="border rounded-lg mb-4 pa-2 bg-surface elevation-0">
      <div class="ml-4 mr-2">
        <v-row align="center" class="mb-0">
          <v-col cols="12" md="6" class="d-flex align-center text-grey-darken-1">
            <v-icon color="primary" class="mr-2">mdi-bookshelf</v-icon>
            <span class="text-subtitle-1 font-weight-medium">Catálogo Maestro</span>
          </v-col>
          <v-col cols="12" md="6" class="text-right">
            <v-btn v-if="tab === 0" color="primary" class="mt-3 mr-3 mb-3" @click="equipmentModal?.open()">
              <v-icon start>mdi-plus</v-icon> Nuevo Equipo
            </v-btn>
            <v-btn v-if="tab === 1" color="primary" class="mt-3 mr-3 mb-3" @click="unitModal?.open()">
              <v-icon start>mdi-plus</v-icon> Nueva Unidad
            </v-btn>
          </v-col>
        </v-row>

        <v-tabs v-model="tab" color="primary" bg-color="transparent" class="mb-2">
          <v-tab :value="0"><v-icon start size="small">mdi-toolbox-outline</v-icon> Equipos y Tipos</v-tab>
          <v-tab :value="1"><v-icon start size="small">mdi-ruler</v-icon> Unidades</v-tab>
        </v-tabs>

        <v-row v-if="tab === 0" class="pb-3">
          <v-col cols="12" md="4">
            <v-text-field v-model="search" hide-details="auto" density="compact"
                          prepend-inner-icon="mdi-magnify"
                          variant="outlined" label="Buscar equipo o tipo..." clearable
                          @update:model-value="optionsEquipments.page = 1" />
          </v-col>
        </v-row>
      </div>
    </v-card>

    <table-loading-overlay :loading="loading" :isEmpty="equipments.length === 0 && units.length === 0">
      <v-window v-model="tab" style="background-color: transparent;">
        <v-window-item :value="0">
          <v-data-table
            :headers="headers_equipments"
            :items="equipments"
            :search="search"
            class="elevation-0 rounded-lg tabla-mejorada bg-surface"
            style="border: 1px solid var(--v-border-color, rgba(0,0,0,0.12));"
            v-model:page="optionsEquipments.page"
            v-model:items-per-page="optionsEquipments.itemsPerPage"
            hide-default-footer
          >
            <template v-slot:bottom>
              <fluent-pagination
                :page="optionsEquipments.page"
                :itemsPerPage="optionsEquipments.itemsPerPage"
                :totalItems="filteredEquipmentsCount"
                @update:page="optionsEquipments.page = $event"
                @update:itemsPerPage="onItemsPerPageChange($event, 'equipments')"
              />
            </template>

            <template v-slot:item.equipo_completo="{ item }">
            <span class="font-weight">{{ item.equipment_name }}</span>
            <span v-if="item.type" class="text-grey"> - {{ item.type }}</span>
          </template>

          <template v-slot:item.unit_detail.symbol="{ item }">
            <v-chip v-if="item.unit_detail" size="small" variant="outlined" color="grey-darken-2" class="font-weight-bold">{{ item.unit_detail.symbol }}</v-chip>
            <span v-else class="text-grey">---</span>
          </template>

          <template v-slot:item.actions="{ item }">
            <v-btn icon variant="text" @click="equipmentModal?.open(item)"><v-icon>mdi-pencil</v-icon></v-btn>
            <v-btn icon variant="text" color="red-darken-2" @click="deleteItem(item, 'equipo')"><v-icon>mdi-delete-outline</v-icon></v-btn>
          </template>
        </v-data-table>
      </v-window-item>

      <v-window-item :value="1">
        <v-data-table
          :headers="headers_units"
          :items="units"
          class="elevation-0 rounded-lg tabla-mejorada bg-surface"
          style="border: 1px solid var(--v-border-color, rgba(0,0,0,0.12));"
          v-model:page="optionsUnits.page"
          v-model:items-per-page="optionsUnits.itemsPerPage"
          hide-default-footer
        >
          <template v-slot:bottom>
            <fluent-pagination
              :page="optionsUnits.page"
              :itemsPerPage="optionsUnits.itemsPerPage"
              :totalItems="units.length"
              @update:page="optionsUnits.page = $event"
              @update:itemsPerPage="onItemsPerPageChange($event, 'units')"
            />
          </template>

          <template v-slot:item.actions="{ item }">
            <v-btn icon variant="text" @click="unitModal?.open(item)"><v-icon>mdi-pencil</v-icon></v-btn>
            <v-btn icon variant="text" color="red-darken-2" @click="deleteItem(item, 'unidad')"><v-icon>mdi-delete-outline</v-icon></v-btn>
          </template>
        </v-data-table>
      </v-window-item>
    </v-window>
</table-loading-overlay>

    <equipment-modal ref="equipmentModal" :existingEquipments="equipments" :units="units" @reload="retrieveAll" @open-unit-modal="unitModal?.open()" />
    <unit-modal ref="unitModal" @reload="retrieveAll" />
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
const theme = useTheme()
const isDark = computed(() => theme.global.current.value.dark)
import Swal from 'sweetalert2'
import FluentPagination from '@/components/commonComponents/FluentPagination.vue'
import EquipmentModal from './EquipmentModal.vue'
import UnitModal from './UnitModal.vue'
import UnitDataService from '@/services/equipments/unitDataService'
import EquipmentDataService from '@/services/equipments/equipmentDataService'
import TableLoadingOverlay from '@/components/commonComponents/TableLoadingOverlay.vue'

const tab = ref(0)
const search = ref('')
const loading = ref(false)
const equipments = ref([])
const units = ref([])
const equipmentModal = ref(null)
const unitModal = ref(null)

import { useTheme } from 'vuetify'

const optionsEquipments = ref({ page: 1, itemsPerPage: 30 })
const optionsUnits = ref({ page: 1, itemsPerPage: 30 })

const filteredEquipmentsCount = computed(() => {
  if (!search.value) return equipments.value.length
  const s = search.value.toLowerCase()
  return equipments.value.filter(item =>
    (item.equipment_name && item.equipment_name.toLowerCase().includes(s)) ||
    (item.type && item.type.toLowerCase().includes(s))
  ).length
})

const onItemsPerPageChange = (newVal, listType) => {
  if (listType === 'equipments') {
    optionsEquipments.value.itemsPerPage = newVal
    optionsEquipments.value.page = 1
  } else {
    optionsUnits.value.itemsPerPage = newVal
    optionsUnits.value.page = 1
  }
}

const headers_equipments = [
  { title: 'Nombre y Tipo', key: 'equipo_completo' },
  { title: 'Unidad Base', key: 'unit_detail.symbol', align: 'center' },
  { title: 'Opciones', key: 'actions', align: 'center', sortable: false },
]

const headers_units = [
  { title: 'ID', key: 'id' },
  { title: 'Símbolo de Unidad', key: 'symbol' },
  { title: 'Opciones', key: 'actions', align: 'center', sortable: false },
]

const retrieveAll = () => {
  loading.value = true
  Promise.all([
    UnitDataService.getAll(),
    EquipmentDataService.getAll()
  ]).then(responses => {
    units.value = responses[0].data.results ? responses[0].data.results : responses[0].data
    equipments.value = responses[1].data.results ? responses[1].data.results : responses[1].data
  }).catch(e => {
    console.error("Error cargando diccionario", e)
    Swal.fire('Error', 'Fallo al conectar con la base de datos.', 'error')
  }).finally(() => {
    loading.value = false
  })
}

const deleteItem = (item, tipo) => {
  Swal.fire({
    title: `¿Eliminar ${tipo}?`,
    text: tipo === 'equipo' ? `Se eliminará "${item.equipment_name}" del catálogo.` : `Se eliminará la unidad "${item.symbol}".`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sí, eliminar',
  }).then((result) => {
    if (result.isConfirmed) {
      let request = tipo === 'equipo'
        ? EquipmentDataService.delete(item.id)
        : UnitDataService.delete(item.id)

      request.then(() => {
        retrieveAll()
        Swal.fire('Eliminado', 'El registro ha sido eliminado con éxito.', 'success')
      }).catch(e => {
        console.error(e)
        Swal.fire('Error', 'No se pudo eliminar el registro, puede estar en uso.', 'error')
      })
    }
  })
}

onMounted(() => {
  retrieveAll()
})

defineExpose({ retrieveAll })
</script>