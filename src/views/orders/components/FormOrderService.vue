<template>
  <div>
    <v-card variant="flat" class="border pa-4 rounded-lg" :color="isDark ? '#1E1E1E' : 'grey-lighten-4'">
      <div class="d-flex align-center mb-3">
        <div class="text-subtitle-1 font-weight-bold" :class="isDark ? 'text-white' : 'text-grey-darken-3'">
          <v-icon size="small" class="mr-1">mdi-plus-circle</v-icon> Configurar Equipo
        </div>
        
        <v-spacer />

        <v-radio-group v-model="temp_eq.modo" inline density="compact" hide-details class="mt-0 pt-0" style="flex: 0 0 auto;">
          <v-radio label="Crear Nuevo" value="nuevo" color="primary" />
          <v-radio label="Vincular" value="existente" color="secondary" class="ml-4" />
        </v-radio-group>
      </div>

      <template v-if="temp_eq.modo === 'nuevo'">
        <v-row dense>
          <v-col cols="12" md="5">
            <v-autocomplete v-model="selected_equipment_name" :items="unique_catalog_names" :loading="loading_equipments"
                            label="Equipo (Familia)" density="compact" variant="outlined" hide-details="auto"
                            prepend-inner-icon="mdi-toolbox-outline"
                            @update:model-value="onFamilyChange" clearable />
          </v-col>
          <v-col cols="12" md="4">
            <v-autocomplete v-model="selected_variant_obj" :items="filtered_equipment_variants"
                            :disabled="!selected_equipment_name" item-title="type_display" return-object
                            label="Característica / Tipo" density="compact" variant="outlined" hide-details="auto"
                            prepend-inner-icon="mdi-shape-outline"
                            @update:model-value="onVariantSelect" clearable />
          </v-col>
          <v-col cols="12" md="3" class="ml-auto">
            <v-btn color="primary" variant="flat" block class="font-weight-bold" style="height: 40px;" @click="equipmentModal?.open()">
              <template #prepend><v-icon>mdi-plus</v-icon></template>
              Catálogo
            </v-btn>
          </v-col>
        </v-row>

        <v-row dense class="mt-2">
          <v-col cols="12" md="5">
            <v-autocomplete v-model="temp_eq.lab" :items="labs" density="compact" variant="outlined" hide-details="auto"
                            label="Laboratorio" item-title="name" item-value="id"
                            :loading="loading_labs" v-model:search="search_lab" />
          </v-col>
          <v-col cols="12" md="4">
            <v-select v-model="temp_eq.certificate_type" :items="cert_types" density="compact" variant="outlined"
                      hide-details="auto" label="Tipo de Certificación" />
          </v-col>
          <v-col cols="12" md="2" class="ml-auto" v-if="next_cert_number_preview">
            <v-chip size="small" color="primary" variant="flat" class="font-weight-bold">
              Sig: {{ next_cert_number_preview }}
            </v-chip>
          </v-col>
        </v-row>
      </template>

      <v-row dense v-else align="center">
        <v-col cols="8" md="8">
          <v-text-field v-model="temp_eq.correlative_busqueda" label="Nro. Correlativo (Ej: 15)"
                        type="number" variant="outlined" density="compact" hide-details
                        @keyup.enter="buscarCertificadoHuerfano" />
        </v-col>
        <v-col cols="4" md="4">
          <v-btn color="secondary" block variant="flat" @click="buscarCertificadoHuerfano" :loading="buscando_cert">
            <template #prepend><v-icon size="small">mdi-magnify</v-icon></template>
            Buscar
          </v-btn>
        </v-col>
        <v-col cols="12" v-if="certificado_encontrado" class="mt-1">
          <v-chip color="success" variant="outlined" label class="justify-center font-weight-bold" style="height: 38px; width: 100%;">
            <template #prepend><v-icon size="small">mdi-check-circle</v-icon></template>
            {{ certificado_encontrado.equipment }} ({{ certificado_encontrado.registry_code }})
          </v-chip>
        </v-col>
      </v-row>

      <v-row dense>
        <v-col cols="12" class="text-right mt-2">
          <v-btn color="primary" variant="flat" size="small" @click="addEquipmentToBatch"
                 density="comfortable"
                 :disabled="(temp_eq.modo === 'nuevo' && (!selected_variant_obj || !temp_eq.lab || !temp_eq.certificate_type)) || (temp_eq.modo === 'existente' && !certificado_encontrado)">
            <template #prepend><v-icon size="small">mdi-plus</v-icon></template>
            Añadir a la Lista
          </v-btn>
        </v-col>
      </v-row>
    </v-card>

    <v-table density="compact" class="mt-4 border rounded" v-if="equipments.length > 0">
      <thead>
        <tr :class="isDark ? 'bg-grey-darken-3' : 'bg-grey-lighten-3'">
          <th class="text-center" style="width: 130px;">Nro. Previsto</th>
          <th>Equipo</th>
          <th>Laboratorio</th>
          <th>Tipo</th>
          <th class="text-right">Acción</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(eq, index) in equipments" :key="index">
          <td class="text-center">
            <v-chip size="x-small" :color="eq.modo === 'nuevo' ? 'primary' : 'grey-darken-1'"
                    class="text-white font-weight-bold" label style="min-width: 90px; justify-content: center;">
              {{ eq.modo === 'nuevo' ? getCalculatedCorrelative(index) : eq.registry_code }}
            </v-chip>
          </td>
          <td><span class="text-subtitle-2">{{ eq.name }}</span></td>
          <td>{{ eq.lab_name }}</td>
          <td><v-chip size="x-small" variant="outlined">{{ eq.type_label }}</v-chip></td>
          <td class="text-right">
            <v-btn icon size="x-small" variant="text" color="red" density="comfortable" @click="equipments.splice(index, 1)">
              <v-icon>mdi-delete</v-icon>
            </v-btn>
          </td>
        </tr>
      </tbody>
    </v-table>

    <equipment-modal ref="equipmentModal" :existingEquipments="equipments_catalog" :units="units_catalog"
                     @reload="retrieveEquipmentsCatalog" @open-unit-modal="unitModal?.open()" />
    <unit-modal ref="unitModal" @reload="retrieveEquipmentsCatalog" />
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, getCurrentInstance } from 'vue'
import { useTheme } from 'vuetify'
import LabDataService from '@/services/labs/labDataService'
import { usePaginatedSearch } from '@/composables/usePaginatedSearch'
import LabMappers from '@/mappers/labMappers'
import CertificateDataService from '@/services/certificates/certificateDataService'
import CorrelativeDataService from '@/services/correlative/correlativeDataService'
import EquipmentDataService from '@/services/equipments/equipmentDataService'
import UnitDataService from '@/services/equipments/unitDataService'
import EquipmentModal from '@/views/equipments/components/EquipmentModal.vue'
import UnitModal from '@/views/equipments/components/UnitModal.vue'

const emit = defineEmits(['update-list'])

const { appContext } = getCurrentInstance()
const $swal = appContext.config.globalProperties.$swal
const theme = useTheme()
const isDark = computed(() => theme.global.current.value.dark)

const temp_eq = ref({ modo: 'nuevo', name: '', lab: null, certificate_type: null, correlative_busqueda: '' })
const certificado_encontrado = ref(null)
const buscando_cert          = ref(false)
const base_correlatives      = ref({ 1: null, 2: null, 3: null })
const equipments             = ref([])

const cert_types = [
  { title: 'ACREDITADO',    value: 1 },
  { title: 'NO ACREDITADO', value: 2 },
  { title: 'OPERATIVIDAD',  value: 3 },
]

const equipments_catalog = ref([])

// Instancia del buscador de Laboratorios usando el Composable global
const { 
  items: labs, 
  loading: loading_labs, 
  searchQuery: search_lab, 
  retrieveData: retrieveLabs 
} = usePaginatedSearch(
  (page, size, query) => LabDataService.getFiltered(page, size, query),
  LabMappers.getMap,
  () => temp_eq.value.lab
)
const units_catalog      = ref([])
const loading_equipments = ref(false)
const selected_equipment_name = ref(null)
const selected_variant_obj    = ref(null)

const equipmentModal = ref(null)
const unitModal      = ref(null)

const next_cert_number_preview = computed(() => {
  const type = temp_eq.value.certificate_type
  if (!type || !base_correlatives.value[type]) return ''
  const offset = equipments.value.filter(e => e.certificate_type == type && e.modo === 'nuevo').length
  return (parseInt(base_correlatives.value[type]) + offset).toString().padStart(8, '0')
})

const unique_catalog_names = computed(() => {
  const names = equipments_catalog.value.map(e => e.equipment_name)
  return [...new Set(names)].sort()
})

const filtered_equipment_variants = computed(() => {
  if (!selected_equipment_name.value) return []
  return equipments_catalog.value.filter(e => e.equipment_name === selected_equipment_name.value)
})

watch(equipments, (val) => { emit('update-list', val) }, { deep: true })


onMounted(() => {
  retrieveLabs('')
  initCorrelatives()
  retrieveEquipmentsCatalog()
})

function inyectarBorrador(datosRecuperados) {
  equipments.value = datosRecuperados
  emit('update-list', equipments.value)
}

async function initCorrelatives() {
  try {
    const [resAcre, resNoAcre, resOpe] = await Promise.all([
      CorrelativeDataService.get(1),
      CorrelativeDataService.get(2),
      CorrelativeDataService.get(3),
    ])
    base_correlatives.value[1] = resAcre.data.correlative
    base_correlatives.value[2] = resNoAcre.data.correlative
    base_correlatives.value[3] = resOpe.data.correlative
  } catch (e) {
    console.error('No se pudieron cargar los correlativos base', e)
  }
}



async function buscarCertificadoHuerfano() {
  if (!temp_eq.value.correlative_busqueda) return
  buscando_cert.value = true
  certificado_encontrado.value = null
  try {
    const res = await CertificateDataService.getFiltered(1, 50, '', '', '', '', Number(temp_eq.value.correlative_busqueda), '')
    const validos = res.data.results.filter(c => !c.order_number && c.status !== 5)
    if (validos.length > 0) {
      certificado_encontrado.value = validos[0]
    } else {
      $swal.fire('No encontrado', 'No se encontró un certificado suelto o válido con ese número.', 'warning')
    }
  } catch (e) {
    $swal.fire('Error', 'Hubo un problema al buscar el certificado.', 'error')
  } finally {
    buscando_cert.value = false
  }
}

function getCalculatedCorrelative(index) {
  const item = equipments.value[index]
  if (item.modo !== 'nuevo') return item.registry_code
  const base = base_correlatives.value[item.certificate_type]
  if (!base) return '...'
  const offset = equipments.value.slice(0, index).filter(e => e.certificate_type == item.certificate_type && e.modo === 'nuevo').length
  return (parseInt(base) + offset).toString().padStart(8, '0')
}

function addEquipmentToBatch() {
  if (temp_eq.value.modo === 'nuevo') {
    if (!selected_variant_obj.value || !temp_eq.value.lab || !temp_eq.value.certificate_type) return
    const labObj  = labs.value.find(l => l.id === temp_eq.value.lab)
    const typeObj = cert_types.find(t => t.value === temp_eq.value.certificate_type)
    equipments.value.push({
      modo:             'nuevo',
      name:             selected_variant_obj.value.clean_name,
      lab:              temp_eq.value.lab,
      lab_name:         labObj ? labObj.name : 'No asignado',
      certificate_type: temp_eq.value.certificate_type,
      type_label:       typeObj ? typeObj.title : 'ACREDITADO',
    })
    selected_equipment_name.value = null
    selected_variant_obj.value    = null
  } else {
    if (!certificado_encontrado.value) return
    
    // UX: Prevenir que el usuario agregue el mismo equipo existente dos veces a la lista
    const yaExiste = equipments.value.some(e => e.modo === 'existente' && e.cert_id === certificado_encontrado.value.id)
    if (yaExiste) {
      $swal.fire('Atención', 'Este equipo ya está en la lista para ser añadido.', 'warning')
      return
    }

    equipments.value.push({
      modo:             'existente',
      cert_id:          certificado_encontrado.value.id,
      name:             certificado_encontrado.value.equipment,
      registry_code:    certificado_encontrado.value.registry_code,
      lab:              certificado_encontrado.value.lab,
      lab_name:         certificado_encontrado.value.lab_data ? certificado_encontrado.value.lab_data.name : '---',
      certificate_type: certificado_encontrado.value.certificate_type,
      type_label:       certificado_encontrado.value.certificate_type_label,
    })
    certificado_encontrado.value = null
    temp_eq.value.correlative_busqueda = ''
  }
  temp_eq.value.name = ''
}

function retrieveEquipmentsCatalog() {
  loading_equipments.value = true
  UnitDataService.getAll().then(res => { units_catalog.value = res.data.results || res.data })
  EquipmentDataService.getAll().then((response) => {
    let items = response.data.results || response.data
    equipments_catalog.value = items.map(eq => {
      let fullName = eq.type ? `${eq.equipment_name} - ${eq.type}` : eq.equipment_name
      let unitSym  = eq.unit_detail ? eq.unit_detail.symbol : '--'
      return {
        ...eq,
        clean_name:   fullName,
        type_display: eq.type ? `${eq.type} (${unitSym})` : `Estándar (${unitSym})`,
      }
    })
  }).finally(() => { loading_equipments.value = false })
}

function onFamilyChange() {
  selected_variant_obj.value = null
  if (selected_equipment_name.value) {
    nextTick(() => {
      if (filtered_equipment_variants.value.length === 1) {
        selected_variant_obj.value = filtered_equipment_variants.value[0]
        onVariantSelect(selected_variant_obj.value)
      }
    })
  }
}

function onVariantSelect(val) {
  if (val && typeof val === 'object') {
    temp_eq.value.name = val.clean_name
  }
}

defineExpose({ inyectarBorrador })
</script>